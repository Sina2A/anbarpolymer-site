import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { getAllSectionAccess } from '@/lib/permissions'
import type { AccessLevel } from '@/lib/sections'
import AdminNav, { PartialAccessBanner } from '@/components/AdminNav'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'
import { approvePaymentReceiptAction, rejectPaymentReceiptAction } from '../admin-orders/actions'

export const dynamic = 'force-dynamic'

const VAT_RATE = 0.09

type OrderItemLike = { price: number; finalPrice: number | null; quantity: number }

function payableTotal(items: OrderItemLike[]) {
  const net = items.reduce((sum, it) => sum + (it.finalPrice ?? it.price) * it.quantity, 0)
  return Math.round(net * (1 + VAT_RATE))
}

export default async function AdminPaymentsPage() {
  const currentUser = await getCurrentUser()
  const isAdmin = currentUser.role === 'admin'
  const myAccess = isAdmin ? null : await getAllSectionAccess(currentUser.id)

  const level: AccessLevel = isAdmin ? 'full' : ((myAccess?.payments as AccessLevel) ?? 'none')
  const hasAccess = level !== 'none'
  const canReview = level === 'full' || level === 'edit'

  // فقط وقتی دسترسی هست کوئری می‌زنیم — بی‌دسترسی یعنی هیچ داده‌ای لود نشه
  const pending = hasAccess
    ? await prisma.order.findMany({
        where: { paymentReceiptUrl: { not: null }, paymentReceiptStatus: 'pending' },
        include: { user: true, items: true },
        orderBy: { paymentReceiptUploadedAt: 'desc' },
      })
    : []

  // رد کردن فیش، paymentReceiptUrl رو null می‌کنه — پس تاریخچه باید روی
  // paymentReceiptReviewedAt کلید بخوره، نه روی وجود فایل
  const reviewed = hasAccess
    ? await prisma.order.findMany({
        where: { paymentReceiptReviewedAt: { not: null } },
        include: { user: true, items: true },
        orderBy: { paymentReceiptReviewedAt: 'desc' },
      })
    : []

  // رابطه‌ی نام‌دار برای بررسی‌کننده توی اسکیما نیست (فقط فیلد اسکالر id) —
  // پس اسم‌ها رو با یه کوئری جدا می‌گیریم
  const reviewerIds = Array.from(
    new Set(reviewed.map((o) => o.paymentReceiptReviewedById).filter((id): id is string => !!id)),
  )
  const reviewers = reviewerIds.length
    ? await prisma.user.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, companyName: true } })
    : []
  const reviewerMap = new Map(reviewers.map((r) => [r.id, r.companyName]))

  return (
    <div
      className="admin-page-wrap"
      style={{
        display: 'flex',
        gap: 24,
        padding: '32px 24px',
        fontFamily: "'Vazirmatn', Tahoma, sans-serif",
        direction: 'rtl',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <AdminNav
        currentUserName={currentUser.companyName}
        isAdmin={isAdmin}
        accessMap={myAccess || {}}
        activeSection="payments"
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>تایید فیش‌های پرداخت</h1>
        <p style={{ fontSize: 13, color: '#9199a3', marginBottom: 24 }}>
          صف بررسی فیش‌های آپلودشده توسط خریدار و تاریخچه‌ی بررسی‌ها
        </p>

        <PartialAccessBanner level={level} sectionLabel="تایید فیش‌های پرداخت" />

        {!hasAccess && (
          <div style={emptyBoxStyle}>به بخش «تایید فیش‌های پرداخت» دسترسی نداری.</div>
        )}

        {hasAccess && (
          <>
            <div style={sectionHeadStyle}>
              🔴 در انتظار بررسی
              {pending.length > 0 && <span style={countBadge}>{pending.length}</span>}
            </div>

            {pending.length === 0 ? (
              <div style={emptyBoxStyle}>فیش در انتظار بررسی‌ای نیست.</div>
            ) : (
              <div style={cardStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f7f8fa' }}>
                      <th style={thStyle}>سفارش</th>
                      <th style={thStyle}>خریدار</th>
                      <th style={thStyle}>مبلغ با مالیات</th>
                      <th style={thStyle}>زمان آپلود</th>
                      <th style={thStyle}>فیش</th>
                      <th style={thStyle}>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((order) => {
                      const shortId = order.id.slice(0, 8)
                      return (
                        <tr key={order.id} style={{ borderTop: '1px solid #eceff3' }}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace' }}>#{shortId}</td>
                          <td style={tdStyle}>{order.user.companyName}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                            {payableTotal(order.items).toLocaleString('en-US')} ریال
                          </td>
                          <td style={{ ...tdStyle, fontSize: 11.5, color: '#6f7680' }}>
                            {order.paymentReceiptUploadedAt
                              ? new Date(order.paymentReceiptUploadedAt).toLocaleString('fa-IR')
                              : '—'}
                          </td>
                          <td style={tdStyle}>
                            {order.paymentReceiptUrl ? (
                              <a
                                href={order.paymentReceiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={fileLinkStyle}
                              >
                                مشاهده‌ی فیش ↗
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={tdStyle}>
                            {canReview ? (
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <form action={approvePaymentReceiptAction.bind(null, order.id)}>
                                  <ConfirmSubmitButton
                                    message={`⚠️ فیش پرداخت سفارش #${shortId} تایید بشه؟`}
                                    style={approveBtnStyle}
                                  >
                                    تایید فیش
                                  </ConfirmSubmitButton>
                                </form>
                                <form action={rejectPaymentReceiptAction.bind(null, order.id)}>
                                  <ConfirmSubmitButton
                                    message={`⚠️ فیش پرداخت سفارش #${shortId} رد بشه؟ خریدار باید فیش جدید آپلود کنه.`}
                                    style={rejectBtnStyle}
                                  >
                                    رد فیش
                                  </ConfirmSubmitButton>
                                </form>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11.5, color: '#9199a3' }}>فقط مشاهده</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ ...sectionHeadStyle, marginTop: 28 }}>تاریخچه‌ی بررسی‌ها</div>

            {reviewed.length === 0 ? (
              <div style={emptyBoxStyle}>هنوز فیشی بررسی نشده.</div>
            ) : (
              <div style={cardStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f7f8fa' }}>
                      <th style={thStyle}>سفارش</th>
                      <th style={thStyle}>خریدار</th>
                      <th style={thStyle}>مبلغ با مالیات</th>
                      <th style={thStyle}>نتیجه</th>
                      <th style={thStyle}>بررسی‌کننده</th>
                      <th style={thStyle}>زمان بررسی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewed.map((order) => {
                      const approved = order.paymentReceiptStatus === 'approved'
                      return (
                        <tr key={order.id} style={{ borderTop: '1px solid #eceff3' }}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace' }}>#{order.id.slice(0, 8)}</td>
                          <td style={tdStyle}>{order.user.companyName}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                            {payableTotal(order.items).toLocaleString('en-US')} ریال
                          </td>
                          <td style={tdStyle}>
                            <span style={approved ? approvedTag : rejectedTag}>
                              {approved ? 'تایید شد' : 'رد شد'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {(order.paymentReceiptReviewedById &&
                              reviewerMap.get(order.paymentReceiptReviewedById)) ||
                              '—'}
                          </td>
                          <td style={{ ...tdStyle, fontSize: 11.5, color: '#6f7680' }}>
                            {order.paymentReceiptReviewedAt
                              ? new Date(order.paymentReceiptReviewedAt).toLocaleString('fa-IR')
                              : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  border: '1px solid #d8dde3',
  borderRadius: 12,
  padding: 14,
  background: '#fff',
  boxShadow: '0 1px 4px rgba(27,30,36,.05)',
  marginBottom: 8,
  overflowX: 'auto',
}
const sectionHeadStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 14,
}
const countBadge: React.CSSProperties = {
  background: '#fee2e2',
  color: '#a8241a',
  fontSize: 11,
  fontWeight: 800,
  borderRadius: 20,
  padding: '2px 10px',
}
const emptyBoxStyle: React.CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: '#9199a3',
  border: '1px dashed #d8dde3',
  borderRadius: 12,
  fontSize: 12.5,
  marginBottom: 20,
}
const thStyle: React.CSSProperties = {
  textAlign: 'right',
  fontSize: 11,
  color: '#6f7680',
  padding: '6px 8px',
  fontWeight: 700,
}
const tdStyle: React.CSSProperties = { padding: '8px', fontSize: 12.5 }
const fileLinkStyle: React.CSSProperties = { color: '#1e357b', fontWeight: 700, fontSize: 12, textDecoration: 'none' }
const approveBtnStyle: React.CSSProperties = {
  background: '#1e357b',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
}
const rejectBtnStyle: React.CSSProperties = {
  background: '#fff',
  color: '#9b1c1c',
  border: '1px solid #9b1c1c',
  borderRadius: 6,
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
}
const approvedTag: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  background: '#e8f8ee',
  color: '#146c3a',
  borderRadius: 6,
  padding: '3px 10px',
}
const rejectedTag: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  background: '#fde8e8',
  color: '#9b1c1c',
  borderRadius: 6,
  padding: '3px 10px',
}
