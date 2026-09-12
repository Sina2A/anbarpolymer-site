path = "src/app/globals.css"
with open(path, encoding="utf-8") as f:
    content = f.read()

hover_rule = """
/* هاور کارت‌های دسترسی سریع پیشخوان — رنگ #1e357b با ۳۰٪ شفافیت،
   عمق سایه = نصف gap واقعی بین کارت‌ها (12px / 2 = 6px) */
.quick-action-card:hover {
  box-shadow: 0 0 6px 0 rgba(30, 53, 123, 0.3);
  border-color: #1e357b !important;
}
"""

if ".quick-action-card:hover" not in content:
    content = content.rstrip() + "\n" + hover_rule
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: قانون هاور دوباره اضافه شد")
else:
    print("SKIP: از قبل موجوده")
