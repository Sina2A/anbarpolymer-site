import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { updatePriceFormulaAction, deletePriceFormulaAction } from '../../actions'
import { notFound } from 'next/navigation'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'
import FormulaFixedInputs from '@/components/FormulaFixedInputs'

export const dynamic = 'force-dynamic'

export default async function EditFormulaPage({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser()
  const { id } = await params
  const formula = await prisma.priceFormulaRule.findUnique({ where: { id } })
  if (!formula) notFound()
  const grades = await prisma.grade.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })

  const match = formula.formulaText.match(/^\s*([\d.]+)\s*\*\s*([\d.]+)\s*\+\s*([\d.]+)\s*$/)
  const parsed = match ? { base: match[1], coef: match[2], fixed: match[3] } : null

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <a href="/admin-pricing?tab=formula" style={backLink}>← بازگشت</a>
        <h1 style={h1Style}>ویرایش فرمول قیمت</h1>

        <form action={updatePriceFormulaAction} style={formCard}>
          <input type="hidden" name="id" value={formula.id} />

          <div style={fieldGroup}>
            <label style={labelStyle}>گرید</label>
            <select name="gradeId" style={inputStyle} defaultValue={formula.gradeId || ''}>
              <option value="">عمومی (برای همه‌ی گریدها)</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.code}</option>)}
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>فرمول محاسبه <span style={{ color: '#9b1c1c' }}>*</span></label>
            {!parsed && (
              <div style={warnBoxStyle}>
                فرمول قبلی («{formula.formulaText}») با شکل جدید سازگار نبود — لطفاً سه عدد رو از نو وارد کن.
              </div>
            )}
            <FormulaFixedInputs
              defaultBase={parsed?.base ?? ''}
              defaultCoef={parsed?.coef ?? ''}
              defaultFixed={parsed?.fixed ?? ''}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>نوع منبع</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <label style={{ fontSize: 13 }}><input type="radio" name="sourceType" value="manual" defaultChecked={formula.sourceType === 'manual'} /> دستی</label>
              <label style={{ fontSize: 13 }}><input type="radio" name="sourceType" value="api" defaultChecked={formula.sourceType === 'api'} /> API</label>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>مقدار دستی</label>
            <input type="number" step="0.01" name="manualValue" style={inputStyle} defaultValue={formula.manualValue ?? ''} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>اسنپشات API</label>
            <input type="number" step="0.01" name="apiSnapshotValue" style={inputStyle} defaultValue={formula.apiSnapshotValue ?? ''} />
          </div>

          <div style={fieldGroup}>
            <label style={{ fontSize: 13 }}><input type="checkbox" name="isActive" defaultChecked={formula.isActive} /> فعال</label>
          </div>

          <button type="submit" style={btnStyle}>ذخیره تغییرات</button>
        </form>

        {/* فرم حذف — عمداً بیرون فرم اصلی، چون HTML فرم تودرتو رو قبول نمی‌کنه
            و باعث می‌شد کلیک روی «حذف» به‌جاش اکشن «ذخیره» رو صدا بزنه. */}
        <form action={deletePriceFormulaAction} style={deleteFormWrapStyle}>
          <input type="hidden" name="id" value={formula.id} />
          <ConfirmSubmitButton message="حذف شود؟" style={btnDeleteStyle}>حذف فرمول</ConfirmSubmitButton>
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
const warnBoxStyle: React.CSSProperties = {
  background: '#fef3c7',
  color: '#92400e',
  fontSize: 12,
  padding: '8px 12px',
  borderRadius: 7,
  marginBottom: 8,
}
