import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { createPriceFormulaAction } from '../../actions'
import FormulaFixedInputs from '@/components/FormulaFixedInputs'

export const dynamic = 'force-dynamic'

export default async function NewFormulaPage() {
  await getCurrentUser()
  const grades = await prisma.grade.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <a href="/admin-pricing?tab=formula" style={backLink}>← بازگشت</a>
        <h1 style={h1Style}>افزودن فرمول قیمت</h1>

        <form action={createPriceFormulaAction} style={formCard}>
          <div style={fieldGroup}>
            <label style={labelStyle}>گرید (اختیاری — خالی = عمومی)</label>
            <select name="gradeId" style={inputStyle}>
              <option value="">عمومی (برای همه‌ی گریدها)</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.code}</option>)}
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>فرمول محاسبه <span style={{ color: '#9b1c1c' }}>*</span></label>
            <FormulaFixedInputs />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>نوع منبع</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <label style={{ fontSize: 13 }}><input type="radio" name="sourceType" value="manual" defaultChecked /> دستی</label>
              <label style={{ fontSize: 13 }}><input type="radio" name="sourceType" value="api" /> API</label>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>مقدار دستی (اگر منبع دستی)</label>
            <input type="number" step="0.01" name="manualValue" style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>اسنپشات API (اگر منبع API)</label>
            <input type="number" step="0.01" name="apiSnapshotValue" style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={{ fontSize: 13 }}><input type="checkbox" name="isActive" defaultChecked /> فعال</label>
          </div>

          <button type="submit" style={btnStyle}>ذخیره فرمول</button>
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
