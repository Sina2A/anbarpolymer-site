path = "src/app/globals.css"
with open(path, encoding="utf-8") as f:
    content = f.read()

report = []

# ---- ۱: هاور دکمه‌های toolbar ادیتور مقالات ----
rule1 = """
/* هاور دکمه‌های toolbar ادیتور مقالات */
.editor-toolbar-btn:hover:not(:disabled) {
  background: rgba(30, 53, 123, 0.12) !important;
}
"""
if ".editor-toolbar-btn:hover" not in content:
    content = content.rstrip() + "\n" + rule1
    report.append("OK: هاور toolbar ادیتور اضافه شد")
else:
    report.append("SKIP: هاور toolbar از قبل موجوده")

# ---- ۲: انیمیشن Shimmer برای Skeleton ----
rule2 = """
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
if "@keyframes shimmer" not in content:
    content = content.rstrip() + "\n" + rule2
    report.append("OK: انیمیشن shimmer اضافه شد")
else:
    report.append("SKIP: shimmer از قبل موجوده")

# ---- ۳: انیمیشن Pulse برای LoadingOverlay ----
rule3 = """
/* Pulse برای LoadingOverlay — نام جدا از هر pulse قدیمی دیگه */
@keyframes loadingPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
}
.pulse-animation {
  animation: loadingPulse 1.2s ease-in-out infinite;
}
"""
if ".pulse-animation" not in content:
    content = content.rstrip() + "\n" + rule3
    report.append("OK: انیمیشن pulse-animation اضافه شد (با keyframe جدا: loadingPulse)")
else:
    report.append("SKIP: pulse-animation از قبل موجوده")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
