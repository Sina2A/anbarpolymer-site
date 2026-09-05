import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { updatePriceFormulaAction, deletePriceFormulaAction } from '../../actions'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * فرمول‌ساز با شکل ثابت (ویرایش) — همون شکل صفحه‌ی افزودن:
 *   [قیمت پایه] × [ضریب] + [هزینه‌ی ثابت] = نتیجه
 * فرمول قدیمی (رشته‌ی متنی) رو سعی می‌کنیم با یه الگوی ساده parse کنیم؛
 * اگه فرمت قدیمی با این الگو نخونه، سه فیلد خالی می‌مونن و کارشناس از نو
 * پرشون می‌کنه (بدون خطا یا کرش).
 */
export default async function EditFormulaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ confirmDelete?: string }> }) {
  await getCurrentUser()
  const { id } = await params
  const sp = await searchParams
  const confirmingDelete = sp.confirmDelete === '1'
  const formula = await prisma.priceFormulaRule.findUnique({ where: { id } })
  if (!formula) notFound()
  const grades = await prisma.grade.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } })

  // تلاش برای parse فرمت "عدد * عدد + عدد" از متن قدیمی
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

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" style={btnStyle}>ذخیره تغییرات</button>
            {confirmingDelete ? (
              <>
                <form action={deletePriceFormulaAction} style={{ flex: 1 }}>
                  <input type="hidden" name="id" value={formula.id} />
                  <button type="submit" style={btnDeleteStyle}>بله، حذف کن</button>
                </form>
                <a href={`/admin-pricing/formula/${formula.id}`} style={{ fontSize: 12.5, color: '#4f5560' }}>انصراف</a>
              </>
            ) : (
              <a href="?confirmDelete=1" style={{ ...btnDeleteStyle, textDecoration: 'none', textAlign: 'center', display: 'block', flex: 1 }}>حذف</a>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function FormulaFixedInputs({
  defaultBase,
  defaultCoef,
  defaultFixed,
}: {
  defaultBase: string
  defaultCoef: string
  defaultFixed: string
}) {
  return (
    <div suppressHydrationWarning>
      <div style={formulaRowStyle}>
        <input type="number" step="0.01" id="fx-base" placeholder="قیمت پایه" style={numBoxStyle} defaultValue={defaultBase} />
        <span style={opStyle}>×</span>
        <input type="number" step="0.01" id="fx-coef" placeholder="ضریب" style={numBoxStyle} defaultValue={defaultCoef} />
        <span style={opStyle}>+</span>
        <input type="number" step="0.01" id="fx-fixed" placeholder="هزینه‌ی ثابت" style={numBoxStyle} defaultValue={defaultFixed} />
        <span style={opStyle}>=</span>
        <span id="fx-result" style={resultBoxStyle}>—</span>
      </div>
      <input type="hidden" name="formulaText" id="fx-hidden" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              function fmt(n) { return (Math.round(n * 100) / 100).toString(); }
              function recalc() {
                var b = parseFloat(document.getElementById('fx-base').value) || 0;
                var c = parseFloat(document.getElementById('fx-coef').value) || 0;
                var f = parseFloat(document.getElementById('fx-fixed').value) || 0;
                var result = b * c + f;
                document.getElementById('fx-result').textContent = fmt(result);
                document.getElementById('fx-hidden').value = fmt(b) + ' * ' + fmt(c) + ' + ' + fmt(f);
              }
              ['fx-base', 'fx-coef', 'fx-fixed'].forEach(function (id) {
                document.getElementById(id).addEventListener('input', recalc);
              });
              recalc();
            })();
          `,
        }}
      />
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

const warnBoxStyle: React.CSSProperties = {
  background: '#fef3c7',
  color: '#92400e',
  fontSize: 12,
  padding: '8px 12px',
  borderRadius: 7,
  marginBottom: 8,
}
const formulaRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  background: '#f7f8fa',
  border: '1px solid #eceff3',
  borderRadius: 10,
  padding: '14px 12px',
}
const numBoxStyle: React.CSSProperties = {
  width: 100,
  border: '1px solid #d8dde3',
  borderRadius: 7,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  textAlign: 'center',
}
const opStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: '#4f5560',
  userSelect: 'none',
}
const resultBoxStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: '#1e357b',
  minWidth: 60,
  textAlign: 'center',
}
