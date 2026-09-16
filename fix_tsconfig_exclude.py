import json

path = "tsconfig.json"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = '"exclude": ["node_modules"]'
new = '"exclude": ["node_modules", "src-backup-20260908-1309", "src-old-before-deploy-v2", "src-backup-*", "src-old-*"]'

n = content.count(old)
if n == 1:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: پوشه‌های بک‌آپ قدیمی + الگوی کلی برای بک‌آپ‌های آینده اضافه شد")
else:
    print(f"هشدار: {n} مورد پیدا شد — نیاز به بررسی دستی")
