files = [
    "src/app/my-tasks/page.tsx",
    "src/app/admin-pricing/page.tsx",
    "src/app/admin-articles/[id]/page.tsx",
    "src/app/admin-articles/page.tsx",
    "src/app/admin-logs/page.tsx",
    "src/app/admin-disputes/page.tsx",
    "src/app/admin-grades/page.tsx",
    "src/app/admin-users/page.tsx",
    "src/app/admin-material-listings/page.tsx",
    "src/app/admin-orders/page.tsx",
    "src/app/admin-kyc/[companyId]/page.tsx",
    "src/app/admin-kyc/page.tsx",
    "src/app/admin-support/[id]/page.tsx",
    "src/app/admin-support/page.tsx",
    "src/app/admin-deals/page.tsx",
    "src/app/admin-payments/page.tsx",
    "src/app/admin-buyers/page.tsx",
    "src/app/admin-contact/page.tsx",
    "src/app/admin-logistics/page.tsx",
    "src/app/admin-warehouses/page.tsx",
]

old = "currentUserName={currentUser.companyName}"
new = "currentUserName={currentUser.companyName} currentUsername={currentUser.username}"

report = []
for path in files:
    try:
        with open(path, encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        report.append(f"FAIL {path}: فایل پیدا نشد")
        continue
    count = content.count(old)
    if count == 0:
        report.append(f"SKIP {path}: الگو پیدا نشد (شاید قبلاً عوض شده)")
        continue
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    report.append(f"OK {path}: {count} مورد")

print("\n".join(report))
ok_count = sum(1 for r in report if r.startswith("OK"))
print(f"\nمجموع موفق: {ok_count} از {len(files)}")
