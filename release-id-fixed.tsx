import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { approveBenchmarkPublishAction, rejectBenchmarkPublishAction } from '../../actions'
import { notFound } from 'next/navigation'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

export const dynamic = 'force-dynamic'

export default async function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  const { id } = await params
  const record = await prisma.benchmarkPublishRecord.findUnique({
    where: { id },
    include: { publishedBy: true, approvedBy: true },
  })
  if (!record) notFound()

  const statusLabel = record.status === 'pending' ? 'در انتظار تایید' : record.status === 'approved' ? 'تایید شده' : record.status === 'rejected' ? 'رد شده' : 'منتشرشده'
  const levelLabel = record.approvalLevel === 'supervisor' ? 'سرپرست' : record.approvalLevel === 'manager' ? 'مدیر' : record.approvalLevel === 'admin' ? 'ادمین' : '—'

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <a href="/admin-pricing?tab=publish&subtab=release" style={backLink}>← بازگشت</a>
        <h1 style={h1Style}>جزئیات انتشار بنچمارک #{record.id.slice(0, 8)}</h1>

        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <InfoRow label="تاریخ ثبت" value={new Date(record.createdAt).toLocaleString('fa-IR')} />
            <InfoRow label="حالت" value={record.mode === 'global' ? 'کلی' : 'جزئی'} />
            <InfoRow label="تنظیم کلی" value={record.globalAdjustPercent !== null ? `${record.globalAdjustPercent > 0 ? '+' : ''}${record.globalAdjustPercent}%` : '—'} />
            <InfoRow label="وضعیت" value={statusLabel} />
            <InfoRow label="سطح تایید" value={levelLabel} />
            <InfoRow label="منتشرکننده" value={record.publishedBy.companyName} />
          </div>

          {record.approvedBy && (
            <div style={{ padding: '12px 16px', background: '#eaf3de', borderRadius: 8, marginTop: 16 }}>
              ✓ تایید شده توسط: {record.approvedBy.companyName} — {record.approvedAt ? new Date(record.approvedAt).toLocaleString('fa-IR') : '—'}
            </div>
          )}

          {record.status === 'rejected' && (
            <div style={{ padding: '12px 16px', background: '#fde8e8', borderRadius: 8, marginTop: 16 }}>
              ✗ رد شده
            </div>
          )}

          {record.status === 'pending' && user.role === 'admin' && (
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <form action={approveBenchmarkPublishAction} style={{ flex: 1 }}>
                <input type="hidden" name="id" value={record.id} />
                <button type="submit" style={btnApprove}>✓ تایید انتشار</button>
              </form>
              <form action={rejectBenchmarkPublishAction} style={{ flex: 1 }}>
                <input type="hidden" name="id" value={record.id} />
                <ConfirmSubmitButton message="رد شود؟" style={btnReject}>✗ رد انتشار</ConfirmSubmitButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: '#6f7680', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#faf8f4', padding: '32px 20px', fontFamily: "'Vazirmatn', Tahoma, sans-serif", direction: 'rtl' as const }
const backLink = { fontSize: 12.5, color: '#1e357b', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }
const h1Style = { fontSize: 20, fontWeight: 800, marginBottom: 24 }
const cardStyle = { background: '#fff', border: '1px solid #d8dde3', borderRadius: 12, padding: 24 }
const btnApprove = { background: '#146c3a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }
const btnReject = { background: 'transparent', color: '#9b1c1c', border: '1.5px solid #9b1c1c', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }
