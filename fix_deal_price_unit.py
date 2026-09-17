report = []

# ---- my-deals/page.tsx — دوتا مورد ----
path1 = "src/app/my-deals/page.tsx"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()

old1 = "toLocaleString('fa-IR')} ریال`"
new1 = "toLocaleString('fa-IR')} تومان/کیلو`"
n1 = c1.count(old1)
c1 = c1.replace(old1, new1, -1)
with open(path1, "w", encoding="utf-8") as f:
    f.write(c1)
report.append(f"{'OK' if n1==2 else 'هشدار'} {path1}: {n1} مورد رفع شد (انتظار: ۲)")

# ---- admin-deals/page.tsx — یه مورد ----
path2 = "src/app/admin-deals/page.tsx"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

old2 = "toLocaleString('fa-IR')} ریال`"
new2 = "toLocaleString('fa-IR')} تومان/کیلو`"
n2 = c2.count(old2)
c2 = c2.replace(old2, new2, -1)
with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)
report.append(f"{'OK' if n2==1 else 'هشدار'} {path2}: {n2} مورد رفع شد (انتظار: ۱)")

print("\n".join(report))
