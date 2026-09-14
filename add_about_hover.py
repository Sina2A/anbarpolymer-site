report = []

# ---- ۱: اضافه‌کردن className به کارت‌ها ----
path1 = "src/app/about/page.tsx"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()

old1 = "<article style={valueCardStyle}>"
new1 = '<article style={valueCardStyle} className="about-hover-card">'
n1 = c1.count(old1)
c1 = c1.replace(old1, new1, -1)
report.append(f"OK: className به {n1} کارت ارزش اضافه شد")

old2 = "<article style={principleCardStyle}>"
new2 = '<article style={principleCardStyle} className="about-hover-card">'
n2 = c1.count(old2)
c1 = c1.replace(old2, new2, -1)
report.append(f"OK: className به {n2} کارت اصول اضافه شد")

with open(path1, "w", encoding="utf-8") as f:
    f.write(c1)

# ---- ۲: قانون هاور توی globals.css ----
path2 = "src/app/globals.css"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

if ".about-hover-card:hover" not in c2:
    c2 = c2.rstrip() + """
/* هاور کارت‌های ارزش/اصول صفحه‌ی درباره‌ما */
.about-hover-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.about-hover-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(23, 32, 51, 0.08);
  border-color: #e65716 !important;
}
"""
    with open(path2, "w", encoding="utf-8") as f:
        f.write(c2)
    report.append("OK: قانون هاور به globals.css اضافه شد")
else:
    report.append("SKIP: از قبل موجوده")

print("\n".join(report))
