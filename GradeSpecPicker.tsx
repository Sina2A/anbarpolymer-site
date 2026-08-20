'use client'

// ویجت انتخاب و ورود مشخصات فنی گرید
//
// این کامپوننت کلاینتیه چون کاربر باید بتونه فیلدها رو تیک بزنه و بلافاصله
// جای ورود مقدارشون ظاهر بشه — این تعامل روی سرور ممکن نیست.
// فقط از src/lib/gradeSpecs.ts می‌خونه که عمداً prisma-free ــه.
//
// خروجی: input هایی با نام spec__<key> که مستقیم توی FormData فرم والد می‌رن
// و سمت سرور با readSpecsFromFormData خونده می‌شن. هیچ state ای به سرور
// پاس داده نمی‌شه — همون الگوی فرم‌های ساده‌ی بقیه‌ی پنل ادمین.
//
// نکته‌ی مهم: mfi و density اینجا نمایش داده نمی‌شن. اون دو تا ستون مستقل
// دیتابیس‌ان (برای فیلتر و موتور تطبیق) و توی خودِ فرم گرید و به‌صورت اجباری
// پر می‌شن. اگه اینجا هم می‌آوردیمشون، داده دوتایی و ناهماهنگ ذخیره می‌شد.

import { useMemo, useState } from 'react'
import {
  SPEC_FIELDS,
  SPEC_GROUPS,
  SPEC_INPUT_PREFIX,
  type SpecField,
  type SpecGroupKey,
} from '@/lib/gradeSpecs'

/** این دو تا ستون مستقل دیتابیس‌ان — از ویجت کنار گذاشته می‌شن تا داده دوتایی نشه. */
const EXCLUDED_KEYS = new Set(['mfi', 'density'])

const PICKABLE_FIELDS = SPEC_FIELDS.filter((f) => !EXCLUDED_KEYS.has(f.key))

type Props = {
  /**
   * مقادیر فعلی — توی فرم ویرایش از parseSpecs(grade.specsJson) میاد،
   * توی فرم گرید جدید خالیه.
   */
  initialValues?: Record<string, string>
  /** پیش‌فرض باز باشه یا بسته. توی فرم ویرایش بهتره باز باشه اگه مقدار داره. */
  defaultOpen?: boolean
}

const boxStyle: React.CSSProperties = {
  border: '1px solid #d9d9d9',
  borderRadius: 8,
  padding: 16,
  background: '#fafafa',
  marginTop: 16,
}

const groupTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#333',
  margin: '18px 0 8px',
  paddingBottom: 6,
  borderBottom: '1px solid #e5e5e5',
}

const chipStyle = (selected: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  margin: '0 0 6px 6px',
  borderRadius: 999,
  border: selected ? '1px solid #1a7f5a' : '1px solid #ccc',
  background: selected ? '#e8f5ef' : '#fff',
  color: selected ? '#12603f' : '#444',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: "'Vazirmatn', Tahoma, sans-serif",
  userSelect: 'none',
})

const valueRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 150px 110px',
  gap: 8,
  alignItems: 'center',
  padding: '6px 8px',
  background: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: 6,
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'Vazirmatn', Tahoma, sans-serif",
  boxSizing: 'border-box',
}

const searchStyle: React.CSSProperties = {
  ...inputStyle,
  padding: '8px 10px',
  marginBottom: 12,
  fontSize: 13,
}

export default function GradeSpecPicker({ initialValues = {}, defaultOpen = false }: Props) {
  // فیلدهایی که کاربر انتخاب کرده. اگه مقدار اولیه داشتیم، یعنی از قبل انتخاب شده.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(Object.keys(initialValues).filter((k) => !EXCLUDED_KEYS.has(k))),
  )
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...initialValues }))
  const [query, setQuery] = useState('')

  const normalizedQuery = query.trim().toLowerCase()

  const visibleByGroup = useMemo(() => {
    const map = new Map<SpecGroupKey, SpecField[]>()
    for (const group of SPEC_GROUPS) {
      const fields = PICKABLE_FIELDS.filter((f) => {
        if (f.group !== group.key) return false
        if (!normalizedQuery) return true
        return (
          f.label.toLowerCase().includes(normalizedQuery) ||
          f.key.toLowerCase().includes(normalizedQuery) ||
          f.standard.toLowerCase().includes(normalizedQuery)
        )
      })
      if (fields.length > 0) map.set(group.key, fields)
    }
    return map
  }, [normalizedQuery])

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        // مقدارش رو هم پاک می‌کنیم تا فیلدِ تیک‌برداشته مقدار قدیمی رو نبره سرور
        setValues((v) => {
          const nv = { ...v }
          delete nv[key]
          return nv
        })
      } else {
        next.add(key)
      }
      return next
    })
  }

  function clearAll() {
    setSelected(new Set())
    setValues({})
  }

  const selectedFields = PICKABLE_FIELDS.filter((f) => selected.has(f.key))

  return (
    <details open={defaultOpen || selectedFields.length > 0} style={boxStyle}>
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 14,
          color: '#222',
          fontFamily: "'Vazirmatn', Tahoma, sans-serif",
        }}
      >
        مشخصات فنی تکمیلی
        {selectedFields.length > 0 ? ` — ${selectedFields.length} فیلد انتخاب شده` : ' (اختیاری)'}
      </summary>

      <p style={{ fontSize: 12, color: '#666', margin: '10px 0 12px', lineHeight: 1.9 }}>
        هر تعداد از فیلدهای زیر را که برای این گرید اندازه‌گیری شده انتخاب کنید و مقدارش را وارد کنید.
        فیلدهای انتخاب‌نشده اصلاً ذخیره نمی‌شوند. شاخص جریان مذاب (MFI) و چگالی در بالای همین فرم و
        به‌صورت اجباری وارد می‌شوند و اینجا تکرار نشده‌اند.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="جست‌وجو در میان فیلدها — مثلاً: ضربه، کششی، ASTM D638"
        style={searchStyle}
      />

      {/* ---- بخش ورود مقدار: فقط فیلدهای انتخاب‌شده ---- */}
      {selectedFields.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <strong style={{ fontSize: 13, color: '#12603f' }}>
              مقادیر ({selectedFields.length})
            </strong>
            <button
              type="button"
              onClick={clearAll}
              style={{
                border: '1px solid #d9534f',
                background: '#fff',
                color: '#d9534f',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: "'Vazirmatn', Tahoma, sans-serif",
              }}
            >
              پاک کردن همه
            </button>
          </div>

          {selectedFields.map((f) => (
            <div key={f.key} style={valueRowStyle}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{f.label}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{f.standard}</div>
              </div>
              <input
                type="text"
                inputMode="decimal"
                name={SPEC_INPUT_PREFIX + f.key}
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder="مقدار"
                style={inputStyle}
              />
              <span style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                {f.unit || '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ---- بخش انتخاب فیلد ---- */}
      {visibleByGroup.size === 0 ? (
        <p style={{ fontSize: 13, color: '#999', padding: '12px 0' }}>
          فیلدی با این عبارت پیدا نشد.
        </p>
      ) : (
        SPEC_GROUPS.filter((g) => visibleByGroup.has(g.key)).map((group) => (
          <div key={group.key}>
            <div style={groupTitleStyle}>{group.label}</div>
            <div>
              {visibleByGroup.get(group.key)!.map((f) => {
                const isSel = selected.has(f.key)
                return (
                  <label key={f.key} style={chipStyle(isSel)} title={`${f.standard}${f.unit ? ` — ${f.unit}` : ''}`}>
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggle(f.key)}
                      style={{ margin: 0, cursor: 'pointer' }}
                    />
                    {f.label}
                    {f.unit ? (
                      <span style={{ color: '#999', fontSize: 11 }}>({f.unit})</span>
                    ) : null}
                  </label>
                )
              })}
            </div>
          </div>
        ))
      )}
    </details>
  )
}
