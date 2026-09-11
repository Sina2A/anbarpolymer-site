import re

report = []

# ---- ۱. globals.css — رنگ پیش‌فرض body برای صفحات عمومی بدون پس‌زمینه‌ی خاص ----
path = "src/app/globals.css"
with open(path, encoding="utf-8") as f:
    content = f.read()
old = "--bg:#faf7f1;"
new = "--bg:#f7f8fa;"
if old in content:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    report.append(f"OK  {path} — رنگ پیش‌فرض body به #f7f8fa تغییر کرد (اثر روی about/reports/services/grades/market)")
else:
    report.append(f"SKIP {path} — الگو پیدا نشد")

# ---- ۲. ۱۸ فایل پنل با colors.bgPage — جایگزینی مستقیم به colors.bgCard (سفید) ----
panel_files_with_token = [
    "src/app/custom-request/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/my-deals/[id]/page.tsx",
    "src/app/my-deals/page.tsx",
    "src/app/my-listings/page.tsx",
    "src/app/my-orders/page.tsx",
    "src/app/new-listing/page.tsx",
    "src/app/price-alerts/page.tsx",
    "src/app/proformas/[id]/page.tsx",
    "src/app/proformas/page.tsx",
    "src/app/purchase-requests/page.tsx",
    "src/app/rfq/page.tsx",
    "src/app/support/[id]/page.tsx",
    "src/app/support/page.tsx",
    "src/app/transport-panel/current/page.tsx",
    "src/app/transport-panel/history/page.tsx",
    "src/app/transport/page.tsx",
    "src/app/verification/page.tsx",
]

for path in panel_files_with_token:
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        report.append(f"FAIL {path} — فایل پیدا نشد")
        continue
    count = content.count("colors.bgPage")
    if count == 0:
        report.append(f"SKIP {path} — colors.bgPage پیدا نشد")
        continue
    content = content.replace("colors.bgPage", "colors.bgCard")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    report.append(f"OK  {path} — {count} مورد colors.bgPage -> colors.bgCard")

# ---- ۳. account/page.tsx — هگز مستقیم، تایید‌شده که واقعاً پس‌زمینه‌ی صفحه‌ست ----
path = "src/app/account/page.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()
old = "background: '#faf8f4',"
new = "background: '#ffffff',"
count = content.count(old)
if count == 1:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    report.append(f"OK  {path} — پس‌زمینه‌ی صفحه به سفید تغییر کرد")
elif count == 0:
    report.append(f"FAIL {path} — الگو پیدا نشد")
else:
    report.append(f"هشدار {path} — {count} مورد پیدا شد (نیاز به بررسی دستی)")

# ---- ۴. my-requests/page.tsx — رفع نقطه‌ای، بدون دست‌زدن به shared.ts ----
path = "src/app/my-requests/page.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()
old = "<div style={sharedPageStyle}>"
new = "<div style={{ ...sharedPageStyle, background: colors.bgCard }}>"
count = content.count(old)
if count == 1:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    report.append(f"OK  {path} — override نقطه‌ای اضافه شد (shared.ts دست‌نخورده موند)")
elif count == 0:
    report.append(f"FAIL {path} — الگو پیدا نشد")
else:
    report.append(f"هشدار {path} — {count} مورد پیدا شد")

print("\n".join(report))
print(f"\nمجموع: {len(report)} عملیات")
