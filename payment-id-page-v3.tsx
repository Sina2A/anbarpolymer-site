import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { updatePaymentTermRuleAction, deletePaymentTermRuleAction } from '../../actions'
import { notFound } from 'next/navigation'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

export const dynamic = 'force-dynamic'

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser()
  const { id } = await params
  const term = await prisma.paymentTermRule.findUnique({ where: { id } })
  if (!term) notFound()

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <a href="/admin-pricing?tab=payment" style={backLink}>← بازگشت</a>
        <h1 style={h1Style}>ویرایش شرایط تسویه</h1>

        <form action={updatePaymentTermRuleAction} style={formCard}>
          <input type="hidden" name="id" value={term.id} />

          <div style={fieldGroup}>
            <label style={labelStyle}>مدت پرداخت (روز) <span style={{ color: '#9b1c1c' }}>*</span></label>
            <input type="number" name="termDays" required style={inputStyle} defaultValue={term.termDays} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>ضریب تنظیم (%) <span style={{ color: '#9b1c1c' }}>*</span></label>
            <input type="number" step="0.01" name="adjustmentPercent" required style={inputStyle} defaultValue={term.adjustmentPercent} />
          </div>

          <div style={fieldGroup}>
            <label style={{ fontSize: 13 }}><input type="checkbox" name="isActive" defaultChecked={term.isActive} /> فعال</label>
          </div>

          <button type="submit" style={btnStyle}>ذخیره تغییرات</button>
        </form>

        <form action={deletePaymentTermRuleAction} style={deleteFormWrapStyle}>
          <input type="hidden" name="id" value={term.id} />
          <ConfirmSubmitButton message="حذف شود؟" style={btnDeleteStyle}>حذف</ConfirmSubmitButton>
        </form>
      </div>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#faf8f4', padding: '32px 20px', fontFamily: "'Vazirmatn', Tahoma, sans-serif", direction: 'rtl' as const }
const backLink = { fontSize: 12.5, color: '#1e357b', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }
const h1Style = { fontSize: 20, fontWeight: 800, marginBottom: 24 }
const formCard = { background: '#fff', border: '1px solid #d8dde3', borderRadius: 12, padding: 24 }
const fieldGroup = { marginBottom: 18 }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }
const inputStyle = { width: '100%', border: '1px solid #d8dde3', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }
const btnStyle = { background: '#1e357b', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }
const btnDeleteStyle = { background: 'transparent', color: '#9b1c1c', border: '1px solid #9b1c1c', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }
const deleteFormWrapStyle: React.CSSProperties = { marginTop: 12 }
