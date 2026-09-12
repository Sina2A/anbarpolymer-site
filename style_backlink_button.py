path = "src/components/PanelHeader.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

report = []

# ---- ۱: اضافه‌کردن import آیکون Home از lucide-react ----
old_import = "import { colors } from '@/lib/styles/tokens'"
new_import = "import { colors } from '@/lib/styles/tokens'\nimport { Home } from 'lucide-react'"
n1 = content.count(old_import)
content = content.replace(old_import, new_import, 1) if n1 == 1 else content
report.append(f"{'OK' if n1==1 else 'FAIL'} import Home ({n1})")

# ---- ۲: نسخه‌ی دسکتاپ — متن + آیکون داخل تگ a ----
old2 = """          <a href="/market" style={backToSiteStyle} className="panel-backtosite-desktop">
            ← بازگشت به سایت
          </a>"""
new2 = """          <a href="/market" style={backToSiteStyle} className="panel-backtosite-desktop">
            <Home size={14} />
            بازگشت به سایت
          </a>"""
n2 = content.count(old2)
content = content.replace(old2, new2, 1) if n2 == 1 else content
report.append(f"{'OK' if n2==1 else 'FAIL'} نسخه‌ی دسکتاپ ({n2})")

# ---- ۳: نسخه‌ی موبایل — متن + آیکون ----
old3 = '          <a href="/market" style={mobileBackToSiteStyle}>← بازگشت به سایت</a>'
new3 = """          <a href="/market" style={mobileBackToSiteStyle}>
            <Home size={14} />
            بازگشت به سایت
          </a>"""
n3 = content.count(old3)
content = content.replace(old3, new3, 1) if n3 == 1 else content
report.append(f"{'OK' if n3==1 else 'FAIL'} نسخه‌ی موبایل ({n3})")

# ---- ۴: استایل دسکتاپ — دقیقاً مثل دکمه‌ی خروج (قاب‌دار) ----
old4 = """const backToSiteStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.75)',
  fontSize: 12.5,
  fontWeight: 600,
  textDecoration: 'none',
  fontFamily: 'inherit',
}"""
new4 = """const backToSiteStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 8,
  padding: '6px 14px',
  fontSize: 12.5,
  color: '#ffffff',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 600,
  textDecoration: 'none',
}"""
n4 = content.count(old4)
content = content.replace(old4, new4, 1) if n4 == 1 else content
report.append(f"{'OK' if n4==1 else 'FAIL'} استایل دسکتاپ قاب‌دار ({n4})")

# ---- ۵: استایل موبایل — هماهنگ با mobileLogoutStyle ----
old5 = """const mobileBackToSiteStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.75)',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  paddingBottom: 8,
  borderBottom: '1px solid rgba(255,255,255,0.15)',
}"""
new5 = """const mobileBackToSiteStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  color: 'rgba(255,255,255,0.85)',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  paddingBottom: 8,
  borderBottom: '1px solid rgba(255,255,255,0.15)',
}"""
n5 = content.count(old5)
content = content.replace(old5, new5, 1) if n5 == 1 else content
report.append(f"{'OK' if n5==1 else 'FAIL'} استایل موبایل ({n5})")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
