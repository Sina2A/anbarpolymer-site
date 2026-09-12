import os

# ---- ساخت کامپوننت جدید PrintButton.tsx ----
print_button_content = """'use client'

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} style={btnStyle}>
      چاپ
    </button>
  )
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #ddd0ba', // colors.border
  background: '#faf7f1', // colors.bg
  borderRadius: 8,
  padding: '7px 12px',
  fontSize: 12,
  cursor: 'pointer',
  color: '#83765f', // colors.textMuted
  fontFamily: "'Vazirmatn', Tahoma, sans-serif",
}
"""

path_new = "src/components/PrintButton.tsx"
with open(path_new, "w", encoding="utf-8") as f:
    f.write(print_button_content)
print(f"OK: {path_new} ساخته شد")

# ---- رفع صفحه‌ی سرور — جایگزینی onClick خام با کامپوننت جدید ----
path_page = "src/app/reports/[id]/page.tsx"
with open(path_page, encoding="utf-8") as f:
    content = f.read()

old_import = "import CopyLinkButton from '@/components/CopyLinkButton'"
new_import = "import CopyLinkButton from '@/components/CopyLinkButton'\nimport PrintButton from '@/components/PrintButton'"
n_import = content.count(old_import)
content = content.replace(old_import, new_import, 1) if n_import == 1 else content

old_button = """                  <button onClick={() => typeof window !== 'undefined' && window.print()} style={iconBtnStyle}>
                    چاپ
                  </button>"""
new_button = "                  <PrintButton />"
n_button = content.count(old_button)
content = content.replace(old_button, new_button, 1) if n_button == 1 else content

with open(path_page, "w", encoding="utf-8") as f:
    f.write(content)

print(f"{'OK' if n_import==1 else 'FAIL'} import PrintButton ({n_import})")
print(f"{'OK' if n_button==1 else 'FAIL'} جایگزینی دکمه ({n_button})")
