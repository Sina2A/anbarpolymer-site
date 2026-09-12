path = "src/components/PublicHeader.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

report = []

# ---- ۱: استفاده از wrapStyle جدا (topbarWrapStyle) فقط برای نوار بالایی ----
old1 = """      <div style={topbarStyle}>
        <div style={wrapStyle}>"""
new1 = """      <div style={topbarStyle}>
        <div style={topbarWrapStyle}>"""
n1 = content.count(old1)
content = content.replace(old1, new1, 1) if n1 == 1 else content
report.append(f"{'OK' if n1==1 else 'FAIL'} استفاده از topbarWrapStyle ({n1})")

# ---- ۲: تعریف topbarWrapStyle — همون wrapStyle ولی با ارتفاع کوچیک ----
old2 = """const wrapStyle: CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 72,
  gap: 24,
}"""
new2 = """const wrapStyle: CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '0 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 72,
  gap: 24,
}

const topbarWrapStyle: CSSProperties = {
  ...wrapStyle,
  height: 36,
}"""
n2 = content.count(old2)
content = content.replace(old2, new2, 1) if n2 == 1 else content
report.append(f"{'OK' if n2==1 else 'FAIL'} تعریف topbarWrapStyle ({n2})")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
