report = []

# ---- رفع ۱: حذف لینک از dashboard/page.tsx ----
path1 = "src/app/dashboard/page.tsx"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()

old1 = '            <a href="/market" style={backLinkStyle}>← بازگشت به سایت</a>\n'
n1 = c1.count(old1)
if n1 == 1:
    c1 = c1.replace(old1, "", 1)
    with open(path1, "w", encoding="utf-8") as f:
        f.write(c1)
    report.append(f"OK {path1}: لینک حذف شد ({n1})")
else:
    report.append(f"FAIL {path1}: {n1} مورد پیدا شد")

# ---- رفع ۲: اضافه‌کردن لینک به PanelHeader.tsx (دسکتاپ + موبایل) ----
path2 = "src/components/PanelHeader.tsx"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

# نسخه‌ی دسکتاپ — قبل از نام کاربر
old2a = """        <div style={actionsStyle}>
          <span style={userNameStyle} className="panel-user-desktop">
            {currentUserName}
          </span>"""
new2a = """        <div style={actionsStyle}>
          <a href="/market" style={backToSiteStyle} className="panel-backtosite-desktop">
            ← بازگشت به سایت
          </a>

          <span style={userNameStyle} className="panel-user-desktop">
            {currentUserName}
          </span>"""
n2a = c2.count(old2a)
c2 = c2.replace(old2a, new2a, 1) if n2a == 1 else c2

# نسخه‌ی موبایل — بالای منوی موبایل
old2b = """        <div style={mobileMenuStyle}>
          <div style={mobileUserStyle}>{currentUserName}</div>"""
new2b = """        <div style={mobileMenuStyle}>
          <a href="/market" style={mobileBackToSiteStyle}>← بازگشت به سایت</a>
          <div style={mobileUserStyle}>{currentUserName}</div>"""
n2b = c2.count(old2b)
c2 = c2.replace(old2b, new2b, 1) if n2b == 1 else c2

# اضافه‌کردن استایل‌های جدید در انتهای فایل
new_styles = """
const backToSiteStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.75)',
  fontSize: 12.5,
  fontWeight: 600,
  textDecoration: 'none',
  fontFamily: 'inherit',
}

const mobileBackToSiteStyle: CSSProperties = {
  color: 'rgba(255,255,255,0.75)',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  paddingBottom: 8,
  borderBottom: '1px solid rgba(255,255,255,0.15)',
}
"""
c2 = c2.rstrip() + "\n" + new_styles

with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)

report.append(f"{'OK' if n2a==1 else 'FAIL'} {path2}: نسخه‌ی دسکتاپ ({n2a})")
report.append(f"{'OK' if n2b==1 else 'FAIL'} {path2}: نسخه‌ی موبایل ({n2b})")
report.append(f"OK {path2}: استایل‌های جدید اضافه شد")

print("\n".join(report))
