path = "src/components/PanelHeader.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

report = []

# ---- ارتفاع صریح و یکسان روی دکمه‌ی خروج ----
old1 = """const logoutBtnStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 8,
  padding: '6px 14px',
  fontSize: 12.5,
  color: '#ffffff',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 600,
}"""
new1 = """const logoutBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 30,
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 8,
  padding: '0 14px',
  fontSize: 12.5,
  color: '#ffffff',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 600,
  boxSizing: 'border-box',
}"""
n1 = content.count(old1)
content = content.replace(old1, new1, 1) if n1 == 1 else content
report.append(f"{'OK' if n1==1 else 'FAIL'} logoutBtnStyle ({n1})")

# ---- همون ارتفاع صریح روی دکمه‌ی بازگشت به سایت ----
old2 = """const backToSiteStyle: CSSProperties = {
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
new2 = """const backToSiteStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 30,
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 8,
  padding: '0 14px',
  fontSize: 12.5,
  color: '#ffffff',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 600,
  textDecoration: 'none',
  boxSizing: 'border-box',
}"""
n2 = content.count(old2)
content = content.replace(old2, new2, 1) if n2 == 1 else content
report.append(f"{'OK' if n2==1 else 'FAIL'} backToSiteStyle ({n2})")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
