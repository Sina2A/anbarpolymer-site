report = []

# ---- admin-logistics/page.tsx ----
path1 = "src/app/admin-logistics/page.tsx"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()
old1 = "if (!exists) pings.push({ latitude: d.currentLatitude, longitude: d.currentLongitude })"
new1 = "if (!exists) pings.push({ latitude: d.currentLatitude, longitude: d.currentLongitude, capturedAt: d.locationUpdatedAt ?? d.createdAt })"
n1 = c1.count(old1)
c1 = c1.replace(old1, new1, 1)
with open(path1, "w", encoding="utf-8") as f:
    f.write(c1)
report.append(f"{'OK' if n1==1 else 'هشدار'} {path1}: {n1} مورد رفع شد")

# ---- driver/t/[token]/page.tsx ----
path2 = "src/app/driver/t/[token]/page.tsx"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()
old2 = "if (!exists) pings.push({ latitude: deal.currentLatitude, longitude: deal.currentLongitude })"
new2 = "if (!exists) pings.push({ latitude: deal.currentLatitude, longitude: deal.currentLongitude, capturedAt: deal.locationUpdatedAt ?? deal.createdAt })"
n2 = c2.count(old2)
c2 = c2.replace(old2, new2, 1)
with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)
report.append(f"{'OK' if n2==1 else 'هشدار'} {path2}: {n2} مورد رفع شد")

print("\n".join(report))
