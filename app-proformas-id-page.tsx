import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { notFound } from 'next/navigation'
import UserNav from '@/components/UserNav'
import ProformaBankPay from '@/components/ProformaBankPay'
import RefundPolicyHint from '@/components/RefundPolicyHint'
import { enforceProformaDeadlines } from '@/lib/dealDeadlines'

export const dynamic = 'force-dynamic'

/**
 * صفحه‌ی جزئیات پیش‌فاکتور — چیدمان طبق پروتوتایپ استاتیک تاییدشده:
 *   ۱. عنوان سفارش + گریدها
 *   ۲. کارت فایل پیش‌فاکتور (فعلاً دکمه‌ی غیرفعال — فیلد proformaPdfUrl روی Order وجود نداره)
 *   ۳. جدول اقلام با مالیات ۹٪
 *   ۴. خلاصه + کارت برجسته‌ی جمع کل
 *   ۵. نوار وضعیت
 *   ۶. دو کارت انتخاب روش پرداخت (بانکی فعال / آنلاین به‌زودی)
 *   ۷. برچسب‌های نتیجه‌ی بررسی فیش + شماره‌ی فاکتور رسمی پس از تایید مالی
 */

const VAT_RATE = 0.09

const STATUS_TEXT: Record<string, string> = {
  priced: 'قیمت ثبت شد — در انتظار تایید شما',
  buyer_confirmed: 'قیمت تایید شد — در حال تنظیم قرارداد',
  contracted: 'قرارداد بسته شد — روش پرداخت را انتخاب کنید',
  paid: 'پرداخت ثبت شد — در انتظار تایید کارشناس مالی',
  loading: 'در حال بارگیری در انبار',
  in_transit: 'در مسیر ارسال',
  delivered: 'تحویل داده شد',
  rejected: 'سفارش باطل شد — مهلت تایید پیش‌فاکتور گذشت و موجودی به انبار برگشت',
}

/** مراحلی که کاربر هنوز می‌تونه پرداخت کنه (قبل از تایید مالی) */
const PAYABLE_STATUSES = ['priced', 'buyer_confirmed', 'contracted']

export default async function ProformaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  // مثل بقیه‌ی مهلت‌ها (بدون cron): قبل از نمایش، چک می‌شه آیا مهلت تایید این
  // پیش‌فاکتور گذشته — اگه آره، سفارش باطل و موجودی به انبار برمی‌گرده.
  await enforceProformaDeadlines()

  // فقط سفارش خودِ کاربر — در غیر این صورت 404 (نه 403، تا id دیگه‌ها لو نره)
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    include: { items: { include: { grade: true } }, invoice: true },
  })
  if (!order) notFound()

  const shortId = order.id.slice(0, 8)
  const gradeSummary = order.items.map((i) => i.grade.code).join(' + ')

  // محاسبات مالی — قیمت واحد = قیمت نهایی کارشناس (اگه ثبت شده) وگرنه snapshot مرجع
  const rows = order.items.map((item) => {
    const unitPrice = item.finalPrice ?? item.price
    const lineTotal = unitPrice * item.quantity
    const lineVat = lineTotal * VAT_RATE
    return { item, unitPrice, lineTotal, lineVat }
  })
  const itemsTotal = rows.reduce((s, r) => s + r.lineTotal, 0)
  const vatTotal = rows.reduce((s, r) => s + r.lineVat, 0)
  const grandTotal = itemsTotal + vatTotal

  const canPay = PAYABLE_STATUSES.includes(order.status)
  const paymentChosen = Boolean(order.paymentReceiptUrl)

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 24 }} className="admin-page-wrap">
        <UserNav currentUserName={user.companyName} activeSection="proformas" />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ۱. عنوان */}
          <a href="/proformas" style={{ fontSize: 12.5, color: '#9199a3', textDecoration: 'none', display: 'inline-block', marginBottom: 10 }}>
            → بازگشت به لیست پیش‌فاکتورها
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>
            سفارش #{shortId} — <span style={{ fontFamily: 'monospace', fontSize: 17 }}>{gradeSummary}</span>
          </h1>

          {/* ۲. کارت فایل پیش‌فاکتور */}
          <div style={fileCard}>
            <div style={{ fontSize: 30 }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: 'monospace' }}>
                پیش‌فاکتور_{shortId}.pdf
              </div>
              <div style={{ fontSize: 11.5, color: '#9199a3', marginTop: 3 }}>
                آپلودشده توسط تیم فروش — {new Date(order.createdAt).toLocaleDateString('fa-IR')}
              </div>
            </div>
            <button type="button" disabled style={disabledPdfBtn} title="فایل رسمی پس از اتصال آبجکت‌استوریج فعال می‌شود">
              مشاهده / دانلود (PDF یا چاپ)
            </button>
          </div>
          <div style={storageNote}>
            فایل رسمی امضاشده پس از اتصال آبجکت‌استوریج در همین‌جا جایگزین می‌شود.
          </div>

          {/* ۳. جدول اقلام */}
          <div style={whiteCard}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>اقلام پیش‌فاکتور</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #eceff3' }}>
                  <th style={th}>گرید</th>
                  <th style={th}>مقدار</th>
                  <th style={th}>قیمت واحد</th>
                  <th style={th}>جمع</th>
                  <th style={th}>مالیات (۹٪)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ item, unitPrice, lineTotal, lineVat }) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1efe8' }}>
                    <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700 }}>{item.grade.code}</td>
                    <td style={td}>{item.quantity} تن</td>
                    <td style={{ ...td, fontFamily: 'monospace' }}>{unitPrice.toLocaleString('en-US')}</td>
                    <td style={{ ...td, fontFamily: 'monospace' }}>{lineTotal.toLocaleString('en-US')}</td>
                    <td style={{ ...td, fontFamily: 'monospace' }}>{lineVat.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ۴. خلاصه */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <div style={{ minWidth: 280 }}>
                <SummaryRow label="جمع اقلام" value={`${itemsTotal.toLocaleString('en-US')} ریال`} />
                <SummaryRow label="مالیات بر ارزش‌افزوده (۹٪)" value={`${vatTotal.toLocaleString('en-US')} ریال`} />
              </div>
            </div>
          </div>

          {/* ۴. کارت برجسته‌ی جمع کل */}
          <div style={highlightCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#7a3a10' }}>جمع کل قابل پرداخت (با احتساب مالیات) <RefundPolicyHint /></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#7a3a10', marginTop: 6, fontFamily: 'monospace' }}>
              {grandTotal.toLocaleString('en-US')} ریال
            </div>
          </div>

          {/* ۵. نوار وضعیت */}
          <div style={statusBar}>
            وضعیت: {STATUS_TEXT[order.status] || order.status}
          </div>

          {order.status === 'priced' && order.proformaDeadline && (
            <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: '#7a3a10' }}>
              ⏳ مهلت تایید شما: {new Date(order.proformaDeadline).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })} — بعد از این زمان، در صورت عدم تایید، سفارش خودکار باطل می‌شود.
            </div>
          )}

          {/* ۶. انتخاب روش پرداخت — دو کارت */}
          {(canPay || order.status === 'paid') && !paymentChosen && (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 18 }}>
              {/* کارت راست: پرداخت بانکی */}
              <div style={{ ...payCard, flex: '1 1 300px', border: '1.5px solid #f6621b' }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>🏦 پرداخت بانکی</div>
                <div style={{ fontSize: 12, color: '#9199a3', margin: '6px 0 14px' }}>واریز و آپلود فیش</div>
                <ProformaBankPay
                  orderId={order.id}
                  amountLabel={`${grandTotal.toLocaleString('en-US')} ریال`}
                  purposeLabel={`پرداخت پیش‌فاکتور سفارش #${shortId}`}
                  disabled={!canPay}
                  disabledHint="پرداخت پس از عقد قرارداد فعال می‌شود"
                />
              </div>

              {/* کارت چپ: پرداخت آنلاین — به‌زودی */}
              <div style={{ ...payCard, flex: '1 1 300px' }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>💳 پرداخت آنلاین</div>
                <div style={{ fontSize: 12, color: '#9199a3', margin: '6px 0 14px' }}>به‌زودی فعال می‌شود</div>
                <button type="button" disabled style={disabledBtn}>
                  غیرفعال
                </button>
              </div>
            </div>
          )}

          {/* وضعیت رسید پرداخت — پیام‌های متفاوت بر اساس نتیجه‌ی بررسی */}
          {order.paymentReceiptStatus === 'approved' && (
            <div style={{ marginTop: 18 }}>
              <div style={receiptApprovedTag}>
                ✓ فیش پرداخت تایید شد — پرداخت شما تأیید گردید
              </div>
              {/* فاکتور رسمی — با تایید فیش خودکار صادر می‌شه (lib/invoices)؛ مبالغ snapshot لحظه‌ی صدوره */}
              {order.invoice && (
                <div style={invoiceIssuedTag}>
                  🧾 فاکتور رسمی صادر شد — شماره:{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, direction: 'ltr', display: 'inline-block' }}>
                    {order.invoice.number}
                  </span>
                  {' '}— تاریخ صدور: {new Date(order.invoice.issuedAt).toLocaleDateString('fa-IR')}
                </div>
              )}
            </div>
          )}
          {order.paymentReceiptStatus === 'rejected' && (
            <div style={{ marginTop: 18 }}>
              <div style={receiptRejectedTag}>
                ✗ فیش پرداخت رد شد — {order.paymentReceiptReviewedAt && `تاریخ بررسی: ${new Date(order.paymentReceiptReviewedAt).toLocaleDateString('fa-IR')} — `}
                لطفاً رسید صحیح را دوباره ارسال کنید
              </div>
            </div>
          )}
          {paymentChosen && !order.paymentReceiptStatus && (
            <div style={{ marginTop: 18 }}>
              <div style={receiptSentTag}>
                ✓ رسید پرداخت ارسال شد — در انتظار تایید کارشناس مالی
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1efe8', fontSize: 13 }}>
      <span style={{ color: '#6f7680' }}>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#faf8f4',
  padding: '32px 20px',
  fontFamily: "'Vazirmatn', Tahoma, sans-serif",
  direction: 'rtl',
}
const whiteCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d8dde3',
  borderRadius: 12,
  padding: 18,
  marginBottom: 14,
  boxShadow: '0 1px 4px rgba(27,30,36,.05)',
}
const fileCard: React.CSSProperties = {
  ...whiteCard,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  marginBottom: 0,
}
const storageNote: React.CSSProperties = {
  fontSize: 11,
  color: '#9199a3',
  marginTop: 6,
  marginBottom: 18,
}
const highlightCard: React.CSSProperties = {
  background: '#ffe2d1',
  borderRadius: 12,
  padding: '18px 22px',
  marginBottom: 14,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
}
const statusBar: React.CSSProperties = {
  background: '#fff4ee',
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: 13.5,
  fontWeight: 700,
  color: '#7a3a10',
}
const payCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d8dde3',
  borderRadius: 12,
  padding: 18,
}
const th: React.CSSProperties = { textAlign: 'right', fontSize: 11, color: '#6f7680', padding: '6px 8px', fontWeight: 700 }
const td: React.CSSProperties = { padding: '9px 8px', fontSize: 12.5 }
const disabledPdfBtn: React.CSSProperties = {
  padding: '9px 16px',
  background: '#e8e4db',
  color: '#9199a3',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 12,
  cursor: 'not-allowed',
}
const disabledBtn: React.CSSProperties = {
  ...disabledPdfBtn,
  fontSize: 13,
}
const receiptSentTag: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 12.5,
  fontWeight: 700,
  color: '#146c3a',
  background: '#e8f8ee',
  padding: '8px 16px',
  borderRadius: 8,
}
const receiptApprovedTag: React.CSSProperties = {
  ...receiptSentTag,
}
const invoiceIssuedTag: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12.5,
  fontWeight: 700,
  color: '#1e357b',
  background: '#eef4fd',
  padding: '8px 16px',
  borderRadius: 8,
}
const receiptRejectedTag: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 12.5,
  fontWeight: 700,
  color: '#9b1c1c',
  background: '#fde8e8',
  padding: '8px 16px',
  borderRadius: 8,
}
