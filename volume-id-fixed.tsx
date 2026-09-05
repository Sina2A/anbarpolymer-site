import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { updateVolumeTierRuleAction, deleteVolumeTierRuleAction } from '../../actions'
import { notFound } from 'next/navigation'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

export const dynamic = 'force-dynamic'

export default async function EditVolumePage({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser()
  const { id } = await params
  const tier = await prisma.volumeTierRule.findUnique({ where: { id } })
  if (!tier) notFound()

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <a href="/admin-pricing?tab=volume" style={backLink}>← بازگشت</a>
        <h1 style={h1Style}>ویرایش پله حجمی</h1>

        <form action={updateVolumeTierRuleAction} style={formCard}>
          <input type="hidden" name="id" value={tier.id} />

          <div style={fieldGroup}>
            <label style={labelStyle}>حداقل تناژ (تن) <span style={{ color: '#9b1c1c' }}>*</span></label>
            <input type="number" step="0.01" name="minTonnage" required style={inputStyle} defaultValue={tier.minTonnage} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>ضریب تنظیم (%) <span style={{ color: '#9b1c1c' }}>*</span></label>
            <input type="number" step="0.01" name="adjustmentPercent" required style={inputStyle} defaultValue={tier.adjustmentPercent} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>نوع انبار</label>
            <select name="storageType" style={inputStyle} defaultValue={tier.storageType || ''}>
              <option value="">سراسری</option>
              <option value="owned">انبار اختصاصی</option>
              <option value="third_party">انبار طرف سوم</option>
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={{ fontSize: 13 }}><input type="checkbox" name="isActive" defaultChecked={tier.isActive} /> فعال</label>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" style={btnStyle}>ذخیره تغییرات</button>
            <form action={deleteVolumeTierRuleAction} style={{ flex: 1 }}>
              <input type="hidden" name="id" value={tier.id} />
              <ConfirmSubmitButton message="حذف شود؟" style={btnDeleteStyle}>حذف</ConfirmSubmitButton>
            </form>
          </div>
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
const btnStyle = { background: '#1e357b', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: 2 }
const btnDeleteStyle = { background: 'transparent', color: '#9b1c1c', border: '1px solid #9b1c1c', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }
