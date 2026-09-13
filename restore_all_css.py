path = "src/app/globals.css"
with open(path, encoding="utf-8") as f:
    content = f.read()

report = []

# ---- ۱: ۸ بلوک @font-face ----
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
if "@font-face" not in content:
    content = font_faces_block + content
    report.append("OK: 8 بلوک @font-face اضافه شد")
else:
    report.append("SKIP: @font-face از قبل هست")

# ---- ۲: --bg درست ----
if "--bg:#faf7f1;" in content:
    content = content.replace("--bg:#faf7f1;", "--bg:#f7f8fa;", 1)
    report.append("OK: --bg رفع شد")
else:
    report.append("SKIP: --bg از قبل درست بود")

# ---- ۳: هاور کارت‌های داشبورد ----
if ".quick-action-card:hover" not in content:
    content = content.rstrip() + """
/* هاور کارت‌های دسترسی سریع پیشخوان */
.quick-action-card:hover {
  box-shadow: 0 0 6px 0 rgba(30, 53, 123, 0.3);
  border-color: #1e357b !important;
}
"""
    report.append("OK: هاور quick-action-card اضافه شد")
else:
    report.append("SKIP: quick-action-card:hover از قبل هست")

# ---- ۴: هاور toolbar ادیتور مقالات ----
if ".editor-toolbar-btn:hover" not in content:
    content = content.rstrip() + """
/* هاور دکمه‌های toolbar ادیتور مقالات */
.editor-toolbar-btn:hover:not(:disabled) {
  background: rgba(30, 53, 123, 0.12) !important;
}
"""
    report.append("OK: هاور editor-toolbar-btn اضافه شد")
else:
    report.append("SKIP: editor-toolbar-btn:hover از قبل هست")

# ---- ۵: انیمیشن Shimmer برای Skeleton ----
if "@keyframes shimmer" not in content:
    content = content.rstrip() + """
/* Shimmer برای Skeleton loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer-line {
  background: linear-gradient(90deg, #e3e8ee 25%, #f0f2f5 50%, #e3e8ee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}
"""
    report.append("OK: shimmer اضافه شد")
else:
    report.append("SKIP: shimmer از قبل هست")

# ---- ۶: انیمیشن Pulse برای LoadingOverlay ----
if ".pulse-animation" not in content:
    content = content.rstrip() + """
/* Pulse برای LoadingOverlay */
@keyframes loadingPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}
.pulse-animation {
  animation: loadingPulse 1.2s ease-in-out infinite;
}
"""
    report.append("OK: pulse-animation اضافه شد")
else:
    report.append("SKIP: pulse-animation از قبل هست")

# ---- ۷: حذف @import گوگل اگه برگشته باشه ----
if "fonts.googleapis.com" in content:
    import re
    content = re.sub(r"@import url\('https://fonts\.googleapis\.com[^']*'\);\n?", "", content)
    report.append("OK: @import گوگل حذف شد")
else:
    report.append("SKIP: @import گوگل نبود")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
