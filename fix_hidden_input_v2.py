path = "tests/rfq-flow.spec.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

old_func = """async function findOurOrderInAdmin(admin: import('@playwright/test').Page, orderShortId: string) {
  // Disambiguate by the exact order's short id (shown as "سفارش #<id>") — the
  // generic grade+status filter breaks once multiple pending test orders coexist
  // (e.g. load-test.spec.ts leaves 5 pending orders forever in the same run).
  const card = admin.locator('div').filter({ hasText: orderShortId }).last();
  await card.waitFor({ timeout: 15_000 });
  return { card, orderId: orderShortId };
}"""

new_func = """async function findOurOrderInAdmin(admin: import('@playwright/test').Page, orderShortId: string) {
  // admin-orders/page.tsx has NO wrapping div per order — pricing and reject
  // are two SEPARATE sibling <form> elements, both containing the same
  // <input type="hidden" name="orderId" value={order.id}>. We match by that
  // hidden input's value (a prefix match, since we only have the short id),
  // then disambiguate the two forms by their distinct content:
  //   - pricing form has <input type="number"> price fields
  //   - reject form has no number inputs, only the reject button
  const hiddenInputSel = `input[name="orderId"][value^="${orderShortId}"]`;
  const matchingForms = admin.locator('form').filter({ has: admin.locator(hiddenInputSel) });
  const pricingForm = matchingForms.filter({ has: admin.locator('input[type="number"]') }).first();
  const rejectForm = matchingForms.filter({ hasNot: admin.locator('input[type="number"]') }).first();
  await pricingForm.waitFor({ timeout: 15_000 });
  return { card: pricingForm, rejectForm, orderId: orderShortId };
}"""

assert old_func in content, "FAIL: findOurOrderInAdmin پیدا نشد"
content = content.replace(old_func, new_func, 1)
print("OK: findOurOrderInAdmin با تشخیص hidden input بازنویسی شد")

old_scenario_b = """  const { card } = await findOurOrderInAdmin(admin, orderShortId);
  admin.once('dialog', (d) => d.accept());
  await Promise.all([
    admin.waitForLoadState('networkidle'),
    card.locator('button:has-text("رد این سفارش")').click(),
  ]);"""

new_scenario_b = """  const { rejectForm } = await findOurOrderInAdmin(admin, orderShortId);
  await rejectForm!.waitFor({ timeout: 10_000 });
  admin.once('dialog', (d) => d.accept());
  await Promise.all([
    admin.waitForLoadState('networkidle'),
    rejectForm!.locator('button:has-text("رد این سفارش")').click(),
  ]);"""

assert old_scenario_b in content, "FAIL: بلوک سناریوی B پیدا نشد"
content = content.replace(old_scenario_b, new_scenario_b, 1)
print("OK: سناریوی B از rejectForm جدا استفاده می‌کنه")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("DONE")
