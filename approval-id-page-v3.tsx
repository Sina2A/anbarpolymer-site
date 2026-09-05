import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { updateApprovalRuleAction, deleteApprovalRuleAction } from '../../actions'
import { notFound } from 'next/navigation'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

export const dynamic = 'force-dynamic'

export default async function EditApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser()
  const { id } = await params
  const rule = await prisma.approvalRule.findUnique({ where: { id } })
  if (!rule) notFound()

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <a href="/admin-pricing?tab=approval" style={backLink}>← بازگشت</a>
        <h1 style={h1Style}>ویرایش قانون تایید</h1>

        <form action={updateApprovalRuleAction} style={formCard}>
          <input type="hidden" name="id" value={rule.id} />

          <div style={fieldGroup}>
            <label style={labelStyle}>موجودیت <span style={{ color: '#9b1c1c' }}>*</span></label>
            <select name="entityType" required style={inputStyle} defaultValue={rule.entityType}>
              <option value="Order">سفارش</option>
              <option value="Deal">معامله</option>
              <option value="BenchmarkPublish">انتشار بنچمارک</option>
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>نوع شرط <span style={{ color: '#9b1c1c' }}>*</span></label>
            <select name="conditionType" required style={inputStyle} defaultValue={rule.conditionType}>
              <option value="amount">مبلغ</option>
              <option value="deviation_percent">درصد انحراف</option>
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>حد آستانه <span style={{ color: '#9b1c1c' }}>*</span></label>
            <input type="number" step="0.01" name="thresholdValue" required style={inputStyle} defaultValue={rule.thresholdValue} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>سطح موردنیاز <span style={{ color: '#9b1c1c' }}>*</span></label>
            <select name="requiredLevel" required style={inputStyle} defaultValue={rule.requiredLevel}>
              <option value="auto">خودکار</option>
              <option value="supervisor">سرپرست</option>
              <option value="manager">مدیر</option>
              <option value="admin">ادمین</option>
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={{ fontSize: 13 }}><input type="checkbox" name="isActive" defaultChecked={rule.isActive} /> فعال</label>
          </div>

          <button type="submit" style={btnStyle}>ذخیره تغییرات</button>
        </form>

        <form action={deleteApprovalRuleAction} style={deleteFormWrapStyle}>
          <input type="hidden" name="id" value={rule.id} />
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
