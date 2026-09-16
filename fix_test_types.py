path = "tests/public-about.spec.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

report = []

# رفع ۱: import نوع Browser رسمی
old1 = "import { test, expect } from '@playwright/test';"
new1 = "import { test, expect, type Browser } from '@playwright/test';"
n1 = content.count(old1)
content = content.replace(old1, new1, 1) if n1 == 1 else content
report.append(f"{'OK' if n1==1 else 'FAIL (شاید import متفاوته)'} import Browser ({n1})")

# رفع ۲: امضای تابع openAbout
old2 = "async function openAbout(browser: Parameters<typeof test>[0]['browser']) {"
new2 = "async function openAbout(browser: Browser) {"
n2 = content.count(old2)
content = content.replace(old2, new2, 1) if n2 == 1 else content
report.append(f"{'OK' if n2==1 else 'FAIL'} امضای openAbout ({n2})")

# رفع ۳: نوع element
old3 = "const family = await locator.evaluate(element => getComputedStyle(element).fontFamily);"
new3 = "const family = await locator.evaluate((element: Element) => getComputedStyle(element).fontFamily);"
n3 = content.count(old3)
content = content.replace(old3, new3, 1) if n3 == 1 else content
report.append(f"{'OK' if n3==1 else 'FAIL'} نوع element ({n3})")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("\n".join(report))
