import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { isPriceStillValid } from '@/lib/pricing'
import { getUserKycLevel } from '@/lib/kyc'
import KycStatusBanner from '@/components/KycStatusBanner'
import UserNav from '@/components/UserNav'
import PaymentMethodModal from '@/components/PaymentMethodModal'
import RefundPolicyHint from '@/components/RefundPolicyHint'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  pending: 'در حال ثبت اولیه',
  priced: 'در حال تعیین قیمت توسط کارشناس فروش',
  buyer_confirmed: 'در انتظار تایید شما',
  contracted: 'در حال عقد قرارداد',
  paid: 'در حال بررسی پرداخت',
  loading: 'در حال بارگیری',
  in_transit: 'در مسیر ارسال',
  delivered: 'تحویل داده شد',
  rejected: 'رد شد',
}

export default async function MyOrdersPage() {
  const user = await getCurrentUser()
  const kycLevel = await getUserKycLevel(user.id)

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { grade: true, warehouse: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 24 }} className="admin-page-wrap">
        <UserNav currentUserName={user.companyName} activeSection="orders" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>سفارش‌های من</h1>
          <p style={{ fontSize: 13, color: '#9199a3', marginBottom: 24 }}>لیست واقعی درخواست‌ها و سفارش‌های ثبت‌شده‌ی شما</p>

          <KycStatusBanner level={kycLevel} />

          {orders.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: '#9199a3', border: '1px dashed #d8dde3', borderRadius: 12 }}>
              هنوز هیچ درخواستی ثبت نکردی — از صفحه‌ی «استعلام قیمت» شروع کن.
            </div>
          )}

          {orders.map((order) => {
            const totalRial = order.items.reduce((sum, it) => sum + it.price * it.quantity, 0)
            return (
              <div key={order.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <b style={{ fontSize: 14 }}>سفارش #{order.id.slice(0, 8)}</b>
                  <span style={statusTag}>{STATUS_LABELS[order.status] || order.status}</span>
                </div>

                {order.items.map((item) => {
                  const valid = isPriceStillValid(item.priceValidUntil)
                  return (
                    <div key={item.id} style={itemRowStyle}>
                      <div>
                        <b style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{item.grade.code}</b>
                        <span style={{ fontSize: 11, color: '#9199a3', marginRight: 8 }}>
                          {item.warehouse?.name} — {item.quantity} تن
                        </span>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{(item.finalPrice ?? item.price).toLocaleString('en-US')} ریال/کیلوگرم</div>
                        {!item.finalPrice && (
                          <div style={{ fontSize: 10, color: valid ? '#146c3a' : '#a8241a', fontWeight: 700 }}>
                            {valid ? 'قیمت هنوز معتبره' : 'مهلت قیمت گذشته — منتظر تایید مجدد کارشناس'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 10, textAlign: 'left' }}>
                  جمع مرجع: {totalRial.toLocaleString('en-US')} ریال
                </div>

                {/* دکمه‌ی آپلود رسید — فقط برای سفارش‌هایی که در مرحله‌ی پرداخت هستن */}
                {order.status === 'contracted' && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <a href={`/proformas/${order.id}`} style={payLinkStyle}>پرداخت ↗</a>
                    {order.paymentReceiptUrl ? (
                      <span style={receiptSentTag}>✓ رسید پرداخت ارسال شد — در انتظار تایید</span>
                    ) : (
                      <PaymentMethodModal
                        entityType="order"
                        entityId={order.id}
                        amountLabel={`${totalRial.toLocaleString('en-US')} ریال`}
                        purposeLabel="پرداخت سفارش"
                      />
                    )}
                    <RefundPolicyHint />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#faf8f4', padding: '32px 20px', fontFamily: "'Vazirmatn', Tahoma, sans-serif", direction: 'rtl' }
const cardStyle: React.CSSProperties = { border: '1px solid #d8dde3', borderRadius: 12, padding: 18, marginBottom: 14, background: '#fff', boxShadow: '0 1px 4px rgba(27,30,36,.05)' }
const statusTag: React.CSSProperties = { fontSize: 11, fontWeight: 700, background: '#eef4fd', color: '#1e357b', borderRadius: 6, padding: '4px 12px' }
const itemRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1efe8' }
const receiptSentTag: React.CSSProperties = { display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#146c3a', background: '#e8f8ee', padding: '6px 14px', borderRadius: 8 }
const payLinkStyle: React.CSSProperties = { display: 'inline-block', padding: '9px 18px', border: '1px solid #1e357b', borderRadius: 8, background: '#fff', color: '#1e357b', fontWeight: 700, fontSize: 13, textDecoration: 'none', cursor: 'pointer' }
