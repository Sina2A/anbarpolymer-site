import prisma from './prisma'

/**
 * صدور فاکتور رسمی — تنها جایی که رکورد Invoice ساخته می‌شه.
 *
 * سه نکته‌ی طراحی که نباید دور زده بشن:
 *   ۱. idempotent — هر سفارش حداکثر یک فاکتور. صدور دوباره همون رکورد قبلی رو
 *      برمی‌گردونه، نه یه شماره‌ی جدید.
 *   ۲. شماره‌ی یکتا بدون SQL خام — با قید @@unique([fiscalYear, seq]) روی اسکیما
 *      و تلاش مجدد در صورت رقابت همزمان.
 *   ۳. مبالغ snapshot می‌شن — بعد از صدور، تغییر OrderItem روی فاکتور اثر نداره.
 */

/** نرخ مالیات بر ارزش افزوده — همون مقداری که صفحه‌ی پیش‌فاکتور نمایش می‌ده */
export const INVOICE_VAT_RATE = 0.09

/** پیش‌شماره‌ی ثابت همه‌ی فاکتورها */
const INVOICE_PREFIX = 'AP'

/** سقف تلاش مجدد وقتی دو صدور همزمان سر یه شماره رقابت می‌کنن */
const MAX_SEQ_RETRIES = 5

/**
 * سال مالی شمسی — پایه‌ی شماره‌گذاری فاکتور.
 *
 * ICU خودش تقویم هجری شمسی رو داره، پس نیازی به هیچ پکیج تاریخ نیست. لوکال
 * en-US انتخاب شده تا ارقام لاتین برگردن (۱۴۰۴ به‌جای 1404 دردسر تبدیل داره).
 * منطقه‌ی زمانی تهران صریح ست شده تا سال مالی به ساعت سرور وابسته نباشه.
 */
export function getPersianFiscalYear(date: Date = new Date()): number {
  const formatted = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    year: 'numeric',
    timeZone: 'Asia/Tehran',
  }).format(date)

  // خروجی معمولاً "1404 AP" هست — فقط ارقام لازمه
  const year = Number(formatted.replace(/[^0-9]/g, ''))

  // اگه ICU سرور تقویم شمسی نداشته باشه، بی‌صدا به میلادی برمی‌گرده (مثلاً 2026)
  // و شماره‌ی فاکتور برای همیشه غلط ثبت می‌شه — پس اینجا سخت شکست می‌خوریم.
  if (!year || year < 1300 || year > 1600) {
    throw new Error('سال مالی شمسی معتبر نیست — تقویم شمسی روی سرور در دسترس نیست.')
  }
  return year
}

/** شماره‌ی نمایشی فاکتور، مثل "AP-1404-00001" */
export function formatInvoiceNumber(fiscalYear: number, seq: number): string {
  return `${INVOICE_PREFIX}-${fiscalYear}-${String(seq).padStart(5, '0')}`
}

/**
 * صدور فاکتور برای یک سفارش. اگه قبلاً صادر شده، همون رکورد برمی‌گرده.
 * فراخوانی‌کننده مسئول لاگ‌کردن نتیجه‌ست (این تابع خودش لاگ نمی‌نویسه).
 */
export async function issueInvoiceForOrder(orderId: string, issuedById?: string | null) {
  const existing = await prisma.invoice.findUnique({ where: { orderId } })
  if (existing) return existing

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { companyName: true } }, items: true },
  })
  if (!order) throw new Error('سفارش پیدا نشد.')
  if (order.status === 'rejected') throw new Error('سفارش باطل شده — فاکتور صادر نمی‌شود.')
  if (order.items.length === 0) throw new Error('سفارش هیچ قلمی ندارد — فاکتور صادر نمی‌شود.')

  // همون فرمول صفحه‌ی پیش‌فاکتور: قیمت واحد = قیمت نهایی کارشناس، وگرنه snapshot مرجع.
  // گرد کردن جدا انجام می‌شه و totalAmount از جمع دو عدد گردشده ساخته می‌شه تا سه
  // مبلغ روی سند همیشه با هم بخونن (نه اختلاف یک ریالی).
  const netTotal = order.items.reduce((sum, it) => sum + (it.finalPrice ?? it.price) * it.quantity, 0)
  const itemsTotal = Math.round(netTotal)
  const vatAmount = Math.round(netTotal * INVOICE_VAT_RATE)
  const totalAmount = itemsTotal + vatAmount

  const fiscalYear = getPersianFiscalYear()

  for (let attempt = 0; attempt < MAX_SEQ_RETRIES; attempt++) {
    const last = await prisma.invoice.findFirst({
      where: { fiscalYear },
      orderBy: { seq: 'desc' },
      select: { seq: true },
    })
    const seq = (last?.seq ?? 0) + 1

    try {
      return await prisma.invoice.create({
        data: {
          orderId,
          number: formatInvoiceNumber(fiscalYear, seq),
          fiscalYear,
          seq,
          buyerCompanyName: order.user.companyName,
          itemsTotal,
          vatRate: INVOICE_VAT_RATE,
          vatAmount,
          totalAmount,
          issuedById: issuedById || null,
        },
      })
    } catch (e) {
      // P2002 = نقض قید یکتایی. دو حالت داره:
      //   - orderId: یه صدور همزمان زودتر از ما تموم شده → همون رکورد رو برگردون
      //   - number / [fiscalYear, seq]: شماره رو یکی دیگه برداشته → با شماره‌ی بعدی دوباره
      if ((e as { code?: string }).code !== 'P2002') throw e

      const raced = await prisma.invoice.findUnique({ where: { orderId } })
      if (raced) return raced
    }
  }

  throw new Error('صدور فاکتور ناموفق بود — شماره‌ی یکتا پیدا نشد.')
}
