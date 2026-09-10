path = "tests/button-health.spec.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = """    const row = buyer.locator('div').filter({ hasText: TEST_GRADE_CODE }).filter({ has: buyer.locator('button:has-text("افزودن")') }).last();
    await row.waitFor({ timeout: 15_000 });
    await row.locator('button:has-text("افزودن")').click();
    await Promise.all([
      buyer.waitForURL(/\\/my-orders/),
      buyer.click('button:has-text("ثبت درخواست قیمت")'),
    ]);

    const adminCtx = await browser.newContext({
      baseURL: 'http://185.164.73.143:3001',
      storageState: '.auth/admin.json',
    });
    const admin = await adminCtx.newPage();
    await admin.goto('/admin-orders');
    await expect(admin).not.toHaveURL(/\\/login/);
    const card = admin.locator('div').filter({ hasText: TEST_GRADE_CODE }).filter({ hasText: 'در انتظار قیمت\u200cگذاری' }).first();
    await card.waitFor({ timeout: 15_000 });

    // Dismiss → should stay pending
    admin.once('dialog', (d) => d.dismiss());
    await card.locator('button:has-text("ثبت قیمت\u200cها و ارسال به مشتری")').click();
    await admin.waitForTimeout(800);
    await expect(admin.locator('text=در انتظار قیمت\u200cگذاری').first()).toBeVisible({ timeout: 10_000 });

    // Clean up: reject it so its locked stock is returned (only touches isolated test stock)
    admin.once('dialog', (d) => d.accept());
    await card.locator('button:has-text("رد این سفارش")').click();"""

new = """    const row = buyer.locator('div').filter({ hasText: TEST_GRADE_CODE }).filter({ has: buyer.locator('button:has-text("افزودن")') }).last();
    await row.waitFor({ timeout: 15_000 });
    await row.locator('button:has-text("افزودن")').click();
    await Promise.all([
      buyer.waitForURL(/\\/my-orders/),
      buyer.click('button:has-text("ثبت درخواست قیمت")'),
    ]);
    // Capture our exact order's short id (avoids ambiguity when multiple
    // pending test orders share the same grade+status text).
    const myOrderHeader = await buyer.locator('text=/^سفارش #/').first().textContent();
    const orderShortId = myOrderHeader!.trim().replace('سفارش ', '').replace('#', '');

    const adminCtx = await browser.newContext({
      baseURL: 'http://185.164.73.143:3001',
      storageState: '.auth/admin.json',
    });
    const admin = await adminCtx.newPage();
    await admin.goto('/admin-orders');
    await expect(admin).not.toHaveURL(/\\/login/);
    // <form> can't nest — matching the hidden orderId input is unambiguous
    // regardless of how many other pending test orders exist on the page.
    const hiddenSel = `input[name="orderId"][value^="${orderShortId}"]`;
    const forms = admin.locator('form').filter({ has: admin.locator(hiddenSel) });
    const card = forms.filter({ has: admin.locator('input[type="number"]') }).first();
    const rejectForm = forms.filter({ hasNot: admin.locator('input[type="number"]') }).first();
    await card.waitFor({ timeout: 15_000 });

    // Dismiss → should stay pending
    admin.once('dialog', (d) => d.dismiss());
    await card.locator('button:has-text("ثبت قیمت\u200cها و ارسال به مشتری")').click();
    await admin.waitForTimeout(800);
    await expect(admin.locator('text=در انتظار قیمت\u200cگذاری').first()).toBeVisible({ timeout: 10_000 });

    // Clean up: reject it so its locked stock is returned (only touches isolated test stock)
    admin.once('dialog', (d) => d.accept());
    await rejectForm!.locator('button:has-text("رد این سفارش")').click();"""

assert old in content, "FAIL: بلوک admin-orders price submit پیدا نشد"
content = content.replace(old, new, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("OK: تست admin-orders price submit با شناسه‌ی دقیق سفارش رفع شد")
