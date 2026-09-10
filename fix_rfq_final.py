path = "tests/rfq-flow.spec.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

# ---- رفع ۱: تابع findOurOrderInAdmin — تشخیص دقیق با orderShortId ----
old_func = """async function findOurOrderInAdmin(admin: import('@playwright/test').Page) {
  // Disambiguate by the latin grade code (rendered inside the order card).
  const card = admin.locator('div').filter({ hasText: TEST_GRADE_CODE }).filter({ hasText: 'در انتظار قیمت\u200cگذاری' }).first();
  await card.waitFor({ timeout: 15_000 });
  const orderId = await card.locator('input[name="orderId"]').first().getAttribute('value');
  return { card, orderId: orderId! };
}"""

new_func = """async function findOurOrderInAdmin(admin: import('@playwright/test').Page, orderShortId: string) {
  // admin-orders has NO wrapping div per order — pricing form and reject form
  // are two SEPARATE sibling <form> elements, both containing
  // <input type="hidden" name="orderId" value={order.id}>. Matching by the
  // exact order's own short id (prefix match) is immune to any number of
  // leftover/accumulated test orders sharing the same grade+status text.
  const hiddenSel = `input[name="orderId"][value^="${orderShortId}"]`;
  const forms = admin.locator('form').filter({ has: admin.locator(hiddenSel) });
  const pricingForm = forms.filter({ has: admin.locator('input[type="number"]') }).first();
  const rejectForm = forms.filter({ hasNot: admin.locator('input[type="number"]') }).first();
  await pricingForm.waitFor({ timeout: 15_000 });
  return { card: pricingForm, rejectForm, orderId: orderShortId };
}"""

assert old_func in content, "FAIL: تابع findOurOrderInAdmin پیدا نشد"
content = content.replace(old_func, new_func, 1)
print("OK: findOurOrderInAdmin با orderShortId بازسازی شد")

# ---- رفع ۲: سناریوی A — استخراج orderShortId و پاس‌دادنش ----
old_a = """  const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
  created.push(`Order via RFQ (priced scenario): header "${myOrderHeader?.trim()}"`);

  const adminCtx = await browser.newContext({
    baseURL: 'http://185.164.73.143:3001',
    storageState: '.auth/admin.json',
  });
  const admin = await adminCtx.newPage();
  await admin.goto('/admin-orders');
  await expect(admin, 'admin /admin-orders must not redirect to /login').not.toHaveURL(/\\/login/);
  const { card, orderId } = await findOurOrderInAdmin(admin);"""

new_a = """  const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
  const orderShortId = myOrderHeader!.trim().replace('سفارش ', '').replace('#', '');
  created.push(`Order via RFQ (priced scenario): header "${myOrderHeader?.trim()}"`);

  const adminCtx = await browser.newContext({
    baseURL: 'http://185.164.73.143:3001',
    storageState: '.auth/admin.json',
  });
  const admin = await adminCtx.newPage();
  await admin.goto('/admin-orders');
  await expect(admin, 'admin /admin-orders must not redirect to /login').not.toHaveURL(/\\/login/);
  const { card, orderId } = await findOurOrderInAdmin(admin, orderShortId);"""

assert old_a in content, "FAIL: بلوک سناریوی A پیدا نشد"
content = content.replace(old_a, new_a, 1)
print("OK: سناریوی A با orderShortId صدا زده می‌شه")

# ---- رفع ۳: سناریوی B — همون کار + استفاده از rejectForm نه card ----
old_b = """  const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
  created.push(`Order via RFQ (reject scenario): header "${myOrderHeader?.trim()}"`);

  const adminCtx = await browser.newContext({
    baseURL: 'http://185.164.73.143:3001',
    storageState: '.auth/admin.json',
  });
  const admin = await adminCtx.newPage();
  await admin.goto('/admin-orders');
  await expect(admin, 'admin /admin-orders must not redirect to /login').not.toHaveURL(/\\/login/);
  const { card } = await findOurOrderInAdmin(admin);
  admin.once('dialog', (d) => d.accept());
  await Promise.all([
    admin.waitForLoadState('networkidle'),
    card.locator('button:has-text("رد این سفارش")').click(),
  ]);"""

new_b = """  const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
  const orderShortId = myOrderHeader!.trim().replace('سفارش ', '').replace('#', '');
  created.push(`Order via RFQ (reject scenario): header "${myOrderHeader?.trim()}"`);

  const adminCtx = await browser.newContext({
    baseURL: 'http://185.164.73.143:3001',
    storageState: '.auth/admin.json',
  });
  const admin = await adminCtx.newPage();
  await admin.goto('/admin-orders');
  await expect(admin, 'admin /admin-orders must not redirect to /login').not.toHaveURL(/\\/login/);
  const { rejectForm } = await findOurOrderInAdmin(admin, orderShortId);
  await rejectForm!.waitFor({ timeout: 10_000 });
  admin.once('dialog', (d) => d.accept());
  await Promise.all([
    admin.waitForLoadState('networkidle'),
    rejectForm!.locator('button:has-text("رد این سفارش")').click(),
  ]);"""

assert old_b in content, "FAIL: بلوک سناریوی B پیدا نشد"
content = content.replace(old_b, new_b, 1)
print("OK: سناریوی B با rejectForm صدا زده می‌شه")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("DONE")
