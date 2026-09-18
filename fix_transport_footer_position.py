path = "src/app/globals.css"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = """.transport-shipments-page {
  width: min(100%, 1240px);
  margin: 0 auto;
  padding: 34px clamp(14px, 2vw, 24px) 50px;
}"""
new = """.transport-shipments-page {
  width: min(100%, 1240px);
  flex: 1;
  margin: 0 auto;
  padding: 34px clamp(14px, 2vw, 24px) 50px;
}"""

n = content.count(old)
if n == 1:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: flex: 1 به .transport-shipments-page اضافه شد — فوتر حالا باید بچسبه به پایین")
else:
    print(f"هشدار: {n} مورد پیدا شد — نیاز به بررسی دستی")
