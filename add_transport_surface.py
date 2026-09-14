report = []

# ---- ۱: currentUser.ts — دوتا گیت جدید ----
path1 = "src/lib/currentUser.ts"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()

old1 = """  if (process.env.SURFACE === 'admin' && user.role !== 'staff' && user.role !== 'admin') {
    const h = await headers()
    const hostname = (h.get('host') || '').split(':')[0] || 'localhost'
    const proto = h.get('x-forwarded-proto') || 'http'
    redirect(`${proto}://${hostname}:3000/dashboard`)
  }
  return user
}"""

new1 = """  if (process.env.SURFACE === 'admin' && user.role !== 'staff' && user.role !== 'admin') {
    const h = await headers()
    const hostname = (h.get('host') || '').split(':')[0] || 'localhost'
    const proto = h.get('x-forwarded-proto') || 'http'
    redirect(`${proto}://${hostname}:3000/dashboard`)
  }
  // گیت SURFACE=transport — فقط transport_manager (و admin برای دیباگ) اجازه‌ی عبور دارن.
  if (process.env.SURFACE === 'transport' && user.role !== 'transport_manager' && user.role !== 'admin') {
    const h = await headers()
    const hostname = (h.get('host') || '').split(':')[0] || 'localhost'
    const proto = h.get('x-forwarded-proto') || 'http'
    redirect(`${proto}://${hostname}:3000/login`)
  }
  // گیت متقارن — transport_manager نباید روی سطح public بمونه، مستقیم به پنل خودش (پورت جدا) هدایت می‌شه.
  if (process.env.SURFACE === 'public' && user.role === 'transport_manager') {
    const h = await headers()
    const hostname = (h.get('host') || '').split(':')[0] || 'localhost'
    const proto = h.get('x-forwarded-proto') || 'http'
    const transportPort = process.env.TRANSPORT_PORT || '4000'
    redirect(`${proto}://${hostname}:${transportPort}/transport-panel`)
  }
  return user
}"""

n1 = c1.count(old1)
if n1 == 1:
    c1 = c1.replace(old1, new1, 1)
    with open(path1, "w", encoding="utf-8") as f:
        f.write(c1)
    report.append(f"OK {path1}: دوتا گیت جدید اضافه شد")
else:
    report.append(f"FAIL {path1}: {n1} مورد پیدا شد")

# ---- ۲: login/actions.ts — ریدایرکت transport_manager به پورت ۴۰۰۰ ----
path2 = "src/app/login/actions.ts"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

old2 = """  if (user.role === 'transport_manager') {
    const requestHeaders = await headers()
    const host = requestHeaders.get('host')?.split(':')[0] ?? 'localhost'
    const proto = requestHeaders.get('x-forwarded-proto') || 'http'
    redirect(`${proto}://${host}:3000/transport-panel`)
  }"""
new2 = """  if (user.role === 'transport_manager') {
    const requestHeaders = await headers()
    const host = requestHeaders.get('host')?.split(':')[0] ?? 'localhost'
    const proto = requestHeaders.get('x-forwarded-proto') || 'http'
    const transportPort = process.env.TRANSPORT_PORT || '4000'
    redirect(`${proto}://${host}:${transportPort}/transport-panel`)
  }"""
n2 = c2.count(old2)
if n2 == 1:
    c2 = c2.replace(old2, new2, 1)
    with open(path2, "w", encoding="utf-8") as f:
        f.write(c2)
    report.append(f"OK {path2}: ریدایرکت به پورت ۴۰۰۰ تغییر کرد")
else:
    report.append(f"FAIL {path2}: {n2} مورد پیدا شد")

print("\n".join(report))
