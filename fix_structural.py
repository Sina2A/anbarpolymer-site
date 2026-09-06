# ---- رفع ۱: custom-request-flow — syntax درست OR ----
path = "tests/custom-request-flow.spec.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()
old = "await expect(buyer.locator('text=پاسخ‌داده‌شده, text=بسته').first()).toBeVisible({ timeout: 10_000 });"
new = "await expect(buyer.locator('text=پاسخ‌داده‌شده').or(buyer.locator('text=بسته')).first()).toBeVisible({ timeout: 10_000 });"
if old in content:
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: custom-request-flow.spec.ts — syntax OR درست شد")
else:
    print("FAIL: custom-request-flow.spec.ts — الگو پیدا نشد")

# ---- رفع ۲: rfq-flow — تمایز با شناسه‌ی سفارش، نه فیلتر متنی عمومی ----
path = "tests/rfq-flow.spec.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

old_func = """async function findOurOrderInAdmin(admin: import('@playwright/test').Page) {
  // Disambiguate by the latin grade code (rendered inside the order card).
  const card = admin.locator('div').filter({ hasText: TEST_GRADE_CODE }).filter({ hasText: 'در انتظار قیمت\u200cگذاری' }).first();
  await card.waitFor({ timeout: 15_000 });
  const orderId = await card.locator('input[name="orderId"]').first().getAttribute('value');
  return { card, orderId: orderId! };
}"""

new_func = """async function findOurOrderInAdmin(admin: import('@playwright/test').Page, orderShortId: string) {
  // Disambiguate by the exact order's short id (shown as "سفارش #<id>") — the
  // generic grade+status filter breaks once multiple pending test orders coexist
  // (e.g. load-test.spec.ts leaves 5 pending orders forever in the same run).
  const card = admin.locator('div').filter({ hasText: orderShortId }).first();
  await card.waitFor({ timeout: 15_000 });
  return { card, orderId: orderShortId };
}"""

if old_func in content:
    content = content.replace(old_func, new_func, 1)
    print("OK: rfq-flow.spec.ts — تابع findOurOrderInAdmin با شناسه‌ی دقیق بازنویسی شد")
else:
    print("FAIL: rfq-flow.spec.ts — تابع پیدا نشد")

# اضافه‌کردن گرفتن شناسه‌ی سفارش بعد از ثبت، و پاس‌دادنش به تابع بالا
old_call1 = """  await expect(buyer.locator('text=در حال ثبت اولیه').first()).toBeVisible({ timeout: 15_000 });
  const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
  created.push(`Order via RFQ (priced scenario): header "${myOrderHeader?.trim()}"`);

  const adminCtx = await browser.newContext({
    baseURL: 'http://185.164.73.143:3001',
    storageState: '.auth/admin.json',
  });
  const admin = await adminCtx.newPage();
  await admin.goto('/admin-orders');
  await expect(admin, 'admin /admin-orders must not redirect to /login').not.toHaveURL(/\\/login/);
  const { card, orderId } = await findOurOrderInAdmin(admin);"""

new_call1 = """  await expect(buyer.locator('text=در حال ثبت اولیه').first()).toBeVisible({ timeout: 15_000 });
  const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
  const orderShortId = myOrderHeader!.trim().replace('سفارش ', '');
  created.push(`Order via RFQ (priced scenario): header "${myOrderHeader?.trim()}"`);

  const adminCtx = await browser.newContext({
    baseURL: 'http://185.164.73.143:3001',
    storageState: '.auth/admin.json',
  });
  const admin = await adminCtx.newPage();
  await admin.goto('/admin-orders');
  await expect(admin, 'admin /admin-orders must not redirect to /login').not.toHaveURL(/\\/login/);
  const { card, orderId } = await findOurOrderInAdmin(admin, orderShortId);"""

if old_call1 in content:
    content = content.replace(old_call1, new_call1, 1)
    print("OK: rfq-flow.spec.ts — سناریوی A با شناسه‌ی دقیق صدا زده می‌شه")
else:
    print("FAIL: rfq-flow.spec.ts — بلوک سناریوی A پیدا نشد")

old_call2 = """  await expect(buyer.locator('text=در حال ثبت اولیه').first()).toBeVisible({ timeout: 15_000 });
  const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
  created.push(`Order via RFQ (reject scenario): header "${myOrderHeader?.trim()}"`);

  const adminCtx = await browser.newContext({
    baseURL: 'http://185.164.73.143:3001',
    storageState: '.auth/admin.json',
  });
  const admin = await adminCtx.newPage();
  await admin.goto('/admin-orders');
  await expect(admin, 'admin /admin-orders must not redirect to /login').not.toHaveURL(/\\/login/);
  const { card } = await findOurOrderInAdmin(admin);"""

new_call2 = """  await expect(buyer.locator('text=در حال ثبت اولیه').first()).toBeVisible({ timeout: 15_000 });
  const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
  const orderShortId = myOrderHeader!.trim().replace('سفارش ', '');
  created.push(`Order via RFQ (reject scenario): header "${myOrderHeader?.trim()}"`);

  const adminCtx = await browser.newContext({
    baseURL: 'http://185.164.73.143:3001',
    storageState: '.auth/admin.json',
  });
  const admin = await adminCtx.newPage();
  await admin.goto('/admin-orders');
  await expect(admin, 'admin /admin-orders must not redirect to /login').not.toHaveURL(/\\/login/);
  const { card } = await findOurOrderInAdmin(admin, orderShortId);"""

if old_call2 in content:
    content = content.replace(old_call2, new_call2, 1)
    print("OK: rfq-flow.spec.ts — سناریوی B با شناسه‌ی دقیق صدا زده می‌شه")
else:
    print("FAIL: rfq-flow.spec.ts — بلوک سناریوی B پیدا نشد")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
