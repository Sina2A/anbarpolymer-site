report = []

# ---- ۱: RecentItemsList.tsx — description از string به ReactNode ----
path1 = "src/components/RecentItemsList.tsx"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()

old1a = "import type { CSSProperties } from 'react'"
new1a = "import type { CSSProperties, ReactNode } from 'react'"
n1a = c1.count(old1a)
c1 = c1.replace(old1a, new1a, 1) if n1a == 1 else c1

old1b = """type RecentItem = {
  id: string
  description: string
  status: string
  date: Date
}"""
new1b = """type RecentItem = {
  id: string
  description: ReactNode
  status: string
  date: Date
}"""
n1b = c1.count(old1b)
c1 = c1.replace(old1b, new1b, 1) if n1b == 1 else c1

with open(path1, "w", encoding="utf-8") as f:
    f.write(c1)
report.append(f"{'OK' if n1a==1 else 'FAIL'} import ReactNode ({n1a})")
report.append(f"{'OK' if n1b==1 else 'FAIL'} type description->ReactNode ({n1b})")

# ---- ۲: dashboard/page.tsx — استفاده از <bdi> برای بخش عدد+واحد ----
path2 = "src/app/dashboard/page.tsx"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

# آگهی‌های اخیر — کد گرید — عدد تن
old2a = "description: `${l.grade.code} — ${l.quantityTon} تن`,"
new2a = "description: (<>{l.grade.code} — <bdi>{l.quantityTon} تن</bdi></>),"
n2a = c2.count(old2a)
c2 = c2.replace(old2a, new2a, 1) if n2a == 1 else c2

# معامله‌های اخیر — کد گرید — عدد (بدون واحد، ولی همون منطق بی‌دی لازم داره)
old2b = "description: `${d.materialListing?.grade.code ?? 'معامله'} — ${d.quantity}`,"
new2b = "description: (<>{d.materialListing?.grade.code ?? 'معامله'} — <bdi>{d.quantity}</bdi></>),"
n2b = c2.count(old2b)
c2 = c2.replace(old2b, new2b, 1) if n2b == 1 else c2

with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)
report.append(f"{'OK' if n2a==1 else 'FAIL'} آگهی‌های اخیر -> <bdi> ({n2a})")
report.append(f"{'OK' if n2b==1 else 'FAIL'} معامله‌های اخیر -> <bdi> ({n2b})")

print("\n".join(report))
