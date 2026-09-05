import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { createPriceFormulaAction } from '../../actions'

export const dynamic = 'force-dynamic'

/**
 * فرمول‌ساز با شکل ثابت — طبق تصمیم: عملگرها قفل و ثابتن، کارشناس فقط
 * سه عدد رو پر می‌کنه:
 *   [قیمت پایه] × [ضریب] + [هزینه‌ی ثابت] = نتیجه
 * موقع ثبت، این سه عدد به‌صورت یه رشته‌ی متنی استاندارد (مثلاً "25 * 1.05 + 10000")
 * ساخته و توی همون فیلد formulaText قدیمی ذخیره می‌شن — موتور محاسبه‌ی فعلی
 * دست‌نخورده می‌مونه، فقط رابط ورودی عوض شده.
 */
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

/**
 * سه فیلد عددی + عملگرهای ثابت (نه dropdown، فقط متن قفل‌شده) — خروجی نهایی
 * توی یه input مخفی به اسم formulaText ساخته می‌شه، دقیقاً هم‌نام فیلد قدیمی
 * که createPriceFormulaAction انتظارش رو داره.
 *
 * نکته: چون این باید هم پیش‌نمایش زنده داشته باشه هم موقع submit مقدار
 * بسازه، به یه کامپوننت کلاینتی کوچیک نیاز داره.
 */
function FormulaFixedInputs() {
  return (
    <div suppressHydrationWarning>
      <div style={formulaRowStyle}>
        <input
          type="number"
          step="0.01"
          id="fx-base"
          placeholder="قیمت پایه"
          style={numBoxStyle}
          onChange={undefined}
        />
        <span style={opStyle}>×</span>
        <input type="number" step="0.01" id="fx-coef" placeholder="ضریب" style={numBoxStyle} />
        <span style={opStyle}>+</span>
        <input type="number" step="0.01" id="fx-fixed" placeholder="هزینه‌ی ثابت" style={numBoxStyle} />
        <span style={opStyle}>=</span>
        <span id="fx-result" style={resultBoxStyle}>—</span>
      </div>
      <input type="hidden" name="formulaText" id="fx-hidden" />
      {/* اسکریپت کوچیک — بدون نیاز به کامپوننت کلاینتی جدا، چون فقط محاسبه‌ی
          نمایشی و ساختن رشته‌ی نهایی موقع submit لازمه */}
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
const btnStyle = { background: '#1e357b', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }

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
