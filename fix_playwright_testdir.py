path = "playwright.config.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = """export default defineConfig({
  timeout: 30_000,"""
new = """export default defineConfig({
  testDir: './tests',
  timeout: 30_000,"""

n = content.count(old)
if n == 1:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: testDir: './tests' اضافه شد — الان فقط داخل پوشه‌ی tests جست‌وجو می‌کنه")
else:
    print(f"هشدار: {n} مورد پیدا شد")
