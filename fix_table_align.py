report = []

# ---- SupplyTableRow.tsx ----
path1 = "src/components/SupplyTableRow.tsx"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()

# ۱. سلول MFI (inline style)
old1a = "<div style={{ ...cellStyle, fontFamily: 'monospace', direction: 'ltr' }}>{listing.grade.mfi ?? '—'}</div>"
new1a = "<div style={{ ...cellStyle, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{listing.grade.mfi ?? '—'}</div>"
n1a = c1.count(old1a)
c1 = c1.replace(old1a, new1a, 1) if n1a == 1 else c1

# ۲. monoCellStyle (برای ثبت)
old1b = """const monoCellStyle: React.CSSProperties = {
  ...cellStyle,
  direction: 'ltr',"""
new1b = """const monoCellStyle: React.CSSProperties = {
  ...cellStyle,
  direction: 'ltr',
  textAlign: 'right',"""
n1b = c1.count(old1b)
c1 = c1.replace(old1b, new1b, 1) if n1b == 1 else c1

# ۳. priceNumStyle (برای قیمت)
old1c = """const priceNumStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  direction: 'ltr',"""
new1c = """const priceNumStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  direction: 'ltr',
  textAlign: 'right',"""
n1c = c1.count(old1c)
c1 = c1.replace(old1c, new1c, 1) if n1c == 1 else c1

with open(path1, "w", encoding="utf-8") as f:
    f.write(c1)
report.append(f"{'OK' if n1a==1 else 'FAIL'} Supply/MFI ({n1a})")
report.append(f"{'OK' if n1b==1 else 'FAIL'} Supply/monoCellStyle ({n1b})")
report.append(f"{'OK' if n1c==1 else 'FAIL'} Supply/priceNumStyle ({n1c})")

# ---- DemandTableRow.tsx ----
path2 = "src/components/DemandTableRow.tsx"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

old2a = """const monoCellStyle: React.CSSProperties = {
  ...cellStyle,
  direction: 'ltr',"""
new2a = """const monoCellStyle: React.CSSProperties = {
  ...cellStyle,
  direction: 'ltr',
  textAlign: 'right',"""
n2a = c2.count(old2a)
c2 = c2.replace(old2a, new2a, 1) if n2a == 1 else c2

old2b = """const priceNumStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  direction: 'ltr',"""
new2b = """const priceNumStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  direction: 'ltr',
  textAlign: 'right',"""
n2b = c2.count(old2b)
c2 = c2.replace(old2b, new2b, 1) if n2b == 1 else c2

with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)
report.append(f"{'OK' if n2a==1 else 'FAIL'} Demand/monoCellStyle ({n2a})")
report.append(f"{'OK' if n2b==1 else 'FAIL'} Demand/priceNumStyle ({n2b})")

print("\n".join(report))
