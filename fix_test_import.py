path = "tests/public-about.spec.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = "import { test, expect, type Page } from '@playwright/test';"
new = "import { test, expect, type Page, type Browser } from '@playwright/test';"
n = content.count(old)
if n == 1:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: import Browser اضافه شد")
else:
    print(f"هشدار: {n} مورد پیدا شد")
