'use client'

import { useState } from 'react'

/**
 * فرمول‌ساز با شکل ثابت — نسخه‌ی درست (React state)، نه اسکریپت خام.
 * علت رفع: نسخه‌ی قبلی از <script dangerouslySetInnerHTML> استفاده می‌کرد که
 * بعد از هیدریت React قابل‌اعتماد اجرا نمی‌شه — فیلد مخفی formulaText همیشه
 * خالی می‌موند و createPriceFormulaAction با خطای «متن فرمول الزامی است» رد می‌شد.
 */
export default function FormulaFixedInputs({
  defaultBase = '',
  defaultCoef = '',
  defaultFixed = '',
}: {
  defaultBase?: string
  defaultCoef?: string
  defaultFixed?: string
}) {
  const [base, setBase] = useState(defaultBase)
  const [coef, setCoef] = useState(defaultCoef)
  const [fixed, setFixed] = useState(defaultFixed)

  const b = parseFloat(base) || 0
  const c = parseFloat(coef) || 0
  const f = parseFloat(fixed) || 0
  const result = b * c + f
  const fmt = (n: number) => (Math.round(n * 100) / 100).toString()
  const formulaText = `${fmt(b)} * ${fmt(c)} + ${fmt(f)}`

  return (
    <div>
      <div style={formulaRowStyle}>
        <input
          type="number"
          step="0.01"
          value={base}
          onChange={(e) => setBase(e.target.value)}
          placeholder="قیمت پایه"
          style={numBoxStyle}
        />
        <span style={opStyle}>×</span>
        <input
          type="number"
          step="0.01"
          value={coef}
          onChange={(e) => setCoef(e.target.value)}
          placeholder="ضریب"
          style={numBoxStyle}
        />
        <span style={opStyle}>+</span>
        <input
          type="number"
          step="0.01"
          value={fixed}
          onChange={(e) => setFixed(e.target.value)}
          placeholder="هزینه‌ی ثابت"
          style={numBoxStyle}
        />
        <span style={opStyle}>=</span>
        <span style={resultBoxStyle}>{fmt(result)}</span>
      </div>
      <input type="hidden" name="formulaText" value={formulaText} />
    </div>
  )
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
