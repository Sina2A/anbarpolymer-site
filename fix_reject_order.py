path = "src/app/admin-orders/actions.ts"
with open(path, encoding="utf-8") as f:
    content = f.read()

# ---- رفع rejectOrder ----
old1 = """  const itemsWithWarehouse = order.items.filter((item) => item.warehouseId)
  await prisma.$transaction([
    ...itemsWithWarehouse.map((item) =>
      prisma.warehouseStock.update({
        where: { id: item.warehouseId as string },
        data: { quantityTon: { increment: item.quantity } },
      })
    ),
    prisma.order.update({ where: { id: orderId }, data: { status: 'rejected' } }),
  ])
  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'rejected',
    performedById: user.id,
    note: 'سفارش توسط کارشناس رد شد — موجودی به انبار برگشت',
  })"""

new1 = """  const itemsWithWarehouse = order.items.filter((item) => item.warehouseId && item.gradeId)
  await prisma.$transaction([
    // توجه: WarehouseStock کلید یکتای ترکیبی (warehouseId+gradeId) نداره، پس
    // باید از updateMany استفاده بشه، نه update با id مستقیم (که اصلاً به این
    // ترکیب اشاره نمی‌کرد و باعث خطای P2025 می‌شد).
    ...itemsWithWarehouse.map((item) =>
      prisma.warehouseStock.updateMany({
        where: { warehouseId: item.warehouseId as string, gradeId: item.gradeId as string },
        data: { quantityTon: { increment: item.quantity } },
      })
    ),
    prisma.order.update({ where: { id: orderId }, data: { status: 'rejected' } }),
  ])
  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'rejected',
    performedById: user.id,
    note: 'سفارش توسط کارشناس رد شد — موجودی به انبار برگشت',
  })"""

assert old1 in content, "FAIL: بلوک rejectOrder پیدا نشد"
content = content.replace(old1, new1, 1)
print("OK: rejectOrder با updateMany رفع شد")

# ---- رفع cancelProformaAction ----
old2 = """  const itemsWithWarehouse = order.items.filter((item) => item.warehouseId)
  await prisma.$transaction([
    ...itemsWithWarehouse.map((item) =>
      prisma.warehouseStock.update({
        where: { id: item.warehouseId as string },
        data: { quantityTon: { increment: item.quantity } },
      })
    ),
    prisma.order.update({ where: { id: orderId }, data: { status: 'rejected' } }),
  ])
  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'rejected',
    performedById: user.id,
    note: 'پیش‌فاکتور توسط کارشناس/ادمین ابطال شد — موجودی به انبار برگشت',"""

new2 = """  const itemsWithWarehouse = order.items.filter((item) => item.warehouseId && item.gradeId)
  await prisma.$transaction([
    ...itemsWithWarehouse.map((item) =>
      prisma.warehouseStock.updateMany({
        where: { warehouseId: item.warehouseId as string, gradeId: item.gradeId as string },
        data: { quantityTon: { increment: item.quantity } },
      })
    ),
    prisma.order.update({ where: { id: orderId }, data: { status: 'rejected' } }),
  ])
  await logStatusEvent({
    recordType: 'Order',
    recordId: orderId,
    newStageKey: 'rejected',
    performedById: user.id,
    note: 'پیش‌فاکتور توسط کارشناس/ادمین ابطال شد — موجودی به انبار برگشت',"""

assert old2 in content, "FAIL: بلوک cancelProformaAction پیدا نشد"
content = content.replace(old2, new2, 1)
print("OK: cancelProformaAction با updateMany رفع شد")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("DONE")
