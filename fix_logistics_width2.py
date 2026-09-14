path = "src/app/admin-logistics/page.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = "<div style={{ ...sharedPageWrapStyle, maxWidth: 1200, margin: '0 auto' }} className=\"admin-page-wrap\">"
new = "<div style={sharedPageWrapStyle} className=\"admin-page-wrap\">"
n = content.count(old)
if n == 1:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: محدودیت maxWidth:1200 دوباره حذف شد")
else:
    print(f"هشدار: {n} مورد پیدا شد")
