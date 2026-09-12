path = "src/app/globals.css"
with open(path, encoding="utf-8") as f:
    content = f.read()

font_faces_block = """/* ── Self-hosted fonts ── */
@font-face {
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/vazirmatn-400.ttf') format('truetype');
}
@font-face {
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/vazirmatn-500.ttf') format('truetype');
}
@font-face {
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/vazirmatn-600.ttf') format('truetype');
}
@font-face {
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/vazirmatn-700.ttf') format('truetype');
}
@font-face {
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('/fonts/vazirmatn-800.ttf') format('truetype');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/jetbrainsmono-400.ttf') format('truetype');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/jetbrainsmono-500.ttf') format('truetype');
}
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/jetbrainsmono-600.ttf') format('truetype');
}

"""

report = []

# رفع ۱: اضافه‌کردن @font-face اگه واقعاً غایبه
if "@font-face" not in content:
    content = font_faces_block + content
    report.append("OK: 8 بلوک @font-face به ابتدای فایل اضافه شد")
else:
    report.append("SKIP: @font-face از قبل موجوده (غیرمنتظره — بررسی دستی لازمه)")

# رفع ۲: --bg به مقدار درست
old_bg = "--bg:#faf7f1;"
new_bg = "--bg:#f7f8fa;"
count_bg = content.count(old_bg)
if count_bg == 1:
    content = content.replace(old_bg, new_bg, 1)
    report.append("OK: --bg به #f7f8fa رفع شد")
elif count_bg == 0:
    report.append("SKIP: --bg قدیمی پیدا نشد (شاید از قبل درست بود)")
else:
    report.append(f"هشدار: {count_bg} مورد --bg قدیمی پیدا شد")

# رفع ۳: حذف @import گوگل اگه دوباره برگشته باشه
if "fonts.googleapis.com" in content:
    import re
    content = re.sub(r"@import url\('https://fonts\.googleapis\.com[^']*'\);\n?", "", content)
    report.append("OK: @import گوگل که برگشته بود دوباره حذف شد")
else:
    report.append("SKIP: @import گوگل وجود نداشت (خوبه)")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
