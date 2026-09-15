path = "src/components/PublicHeader.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = """              <span
                style={{
                  position: 'absolute',
                  bottom: -1,
                  left: indicator.left,
                  width: indicator.width,
                  height: 2,
                  background: colors.orange,
                  borderRadius: 2,
                  transition: 'left 0.3s ease, width 0.3s ease',
                }}
              />"""
new = """              <span
                data-nav-indicator="true"
                style={{
                  position: 'absolute',
                  bottom: -1,
                  left: indicator.left,
                  width: indicator.width,
                  height: 2,
                  background: colors.orange,
                  borderRadius: 2,
                  transition: 'left 0.3s ease, width 0.3s ease',
                }}
              />"""
n = content.count(old)
if n == 1:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: data-nav-indicator اضافه شد")
else:
    print(f"هشدار: {n} مورد پیدا شد")
