'use server'

import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { logStatusEvent } from '@/lib/statusEvents'
import { logAudit } from '@/lib/logger'
import { startProformaDeadline } from '@/lib/dealDeadlines'
import { issueInvoiceForOrder } from '@/lib/invoices'
import { revalidatePath } from 'next/cache'

/**
 * کارشناس فروش قیمت نهایی هر قلم رو ثبت می‌کنه — این قیمت جدا از price
 * (که فقط snapshot مرجعه) ذخیره می‌شه، تا سفارش وارد مرحله‌ی «priced» بشه
 * و مشتری بتونه توی /my-orders تاییدش کنه.
 */
export async function setOrderPricing(formData: FormData) {
  const user = await getCurrentUser()
  const orderId = String(formData.get('orderId'))

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) throw new Error('سفارش پیدا نشد.')

  await prisma.$transaction(
    order.items.map((item) =>
      prisma.orderItem.update({
        where: { id: item.id },
        data: { finalPrice: parseFloat(String(formData.get(`finalPrice-${item.id}`) || item.price)) },
      })
    )
  )

  // وضعیت priced + مهلت تایید پیش‌فاکتور مشتری (ساعت کاری، از تنظیمات) یک‌جا ثبت می‌شن
  await startProformaDeadline(orderId)

  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'priced',
    performedById: user.id,
    note: 'قیمت نهایی توسط کارشناس فروش ثبت شد',
  })

  revalidatePath('/admin-orders')
}

/**
 * رد سفارش — موجودی قفل‌شده باید برگرده به انبار، وگرنه برای همیشه
 * از دسترس خارج می‌مونه بدون این‌که واقعاً فروخته شده باشه.
 */
export async function rejectOrder(formData: FormData) {
  const user = await getCurrentUser()
  const orderId = String(formData.get('orderId'))

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) throw new Error('سفارش پیدا نشد.')
  if (order.status !== 'pending') throw new Error('فقط سفارش‌های در انتظار قیمت‌گذاری قابل‌رد کردنن.')

  const itemsWithWarehouse = order.items.filter((item) => item.warehouseId)

  await prisma.$transaction([
    ...itemsWithWarehouse.map((item) =>
      prisma.warehouseStock.update({
        where: { id: item.warehouseId as string },
        data: { quantityTon: { increment: item.quantity } },
      })
    ),
    prisma.order.update({ where: { id: orderId }, data: { status: 'rejected' } }),
  ])

  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'rejected',
    performedById: user.id,
    note: 'سفارش توسط کارشناس رد شد — موجودی به انبار برگشت',
  })

  revalidatePath('/admin-orders')
}

/**
 * ابطال پیش‌فاکتور توسط کارشناس/ادمین — فارغ از مهلت.
 * موجودی قفل‌شده‌ی هر قلم به انبار برمی‌گرده (الگوی واحد rejectOrder/enforceProformaDeadlines).
 */
export async function cancelProformaAction(orderId: string) {
  const user = await getCurrentUser()

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) throw new Error('سفارش پیدا نشد.')
  if (!['priced', 'buyer_confirmed'].includes(order.status)) {
    throw new Error('فقط سفارش‌های در مرحله‌ی پیش‌فاکتور قابل ابطالن.')
  }

  const itemsWithWarehouse = order.items.filter((item) => item.warehouseId)

  await prisma.$transaction([
    ...itemsWithWarehouse.map((item) =>
      prisma.warehouseStock.update({
        where: { id: item.warehouseId as string },
        data: { quantityTon: { increment: item.quantity } },
      })
    ),
    prisma.order.update({ where: { id: orderId }, data: { status: 'rejected' } }),
  ])

  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'rejected',
    performedById: user.id,
    note: 'پیش‌فاکتور توسط کارشناس/ادمین ابطال شد — موجودی به انبار برگشت',
  })

  revalidatePath('/admin-orders')
  revalidatePath('/proformas')
}

/**
 * تایید فیش پرداخت — وضعیت رسید از pending به approved تغییر می‌کنه و بلافاصله
 * فاکتور رسمی سفارش صادر می‌شه (شماره‌گذاری یکتا در lib/invoices).
 */
export async function approvePaymentReceiptAction(orderId: string) {
  const user = await getCurrentUser()

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentReceiptStatus: 'approved',
      paymentReceiptReviewedById: user.id,
      paymentReceiptReviewedAt: new Date(),
    },
  })

  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'receipt_approved',
    performedById: user.id,
    note: 'فیش پرداخت توسط کارشناس مالی تایید شد',
  })

  await logAudit('payment', `تایید فیش پرداخت سفارش ${orderId.slice(0, 8)}`, user.id, { orderId, action: 'receipt_approved' })

  // صدور فاکتور عمداً بعد از ثبت تایید و توی try جدا اجرا می‌شه: اگه صدور
  // شکست بخوره، خودِ تایید فیش نباید برگرده — فقط لاگ می‌شه تا کارشناس مالی
  // ببینه و دوباره تلاش کنه (تایید دوباره همون فاکتور قبلی رو برمی‌گردونه،
  // چون issueInvoiceForOrder بر اساس orderId idempotent هست).
  try {
    const invoice = await issueInvoiceForOrder(orderId, user.id)
    await logAudit('invoice', `صدور فاکتور ${invoice.number} برای سفارش ${orderId.slice(0, 8)}`, user.id, {
      orderId,
      invoiceId: invoice.id,
      number: invoice.number,
      totalAmount: invoice.totalAmount,
    })
  } catch (e) {
    await logAudit('invoice', `صدور فاکتور برای سفارش ${orderId.slice(0, 8)} ناموفق بود`, user.id, {
      orderId,
      action: 'issue_failed',
      error: String(e),
    })
  }

  revalidatePath('/admin-orders')
  revalidatePath('/proformas')
}

/**
 * رد فیش پرداخت — خریدار باید رسید جدید آپلود کنه.
 */
export async function rejectPaymentReceiptAction(orderId: string) {
  const user = await getCurrentUser()

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentReceiptStatus: 'rejected',
      paymentReceiptReviewedById: user.id,
      paymentReceiptReviewedAt: new Date(),
      // رسید قبلی باطل می‌شه تا خریدار رسید جدید آپلود کنه
      paymentReceiptUrl: null,
      paymentReceiptUploadedAt: null,
    },
  })

  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'receipt_rejected',
    performedById: user.id,
    note: 'فیش پرداخت توسط کارشناس مالی رد شد — خریدار باید رسید جدید ارسال کنه',
  })

  await logAudit('payment', `رد فیش پرداخت سفارش ${orderId.slice(0, 8)}`, user.id, { orderId, action: 'receipt_rejected' })

  revalidatePath('/admin-orders')
  revalidatePath('/proformas')
}
