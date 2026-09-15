report = []

# ==================== ۱. فرم — اضافه‌کردن یوزرنیم/پسورد ====================
path1 = "src/app/admin-users/page.tsx"
with open(path1, encoding="utf-8") as f:
    c1 = f.read()

old1a = """          <input name="companyName" placeholder="نام و نام خانوادگی" required style={inputStyle} />
          <input name="phone" placeholder="شماره تماس" required style={inputStyle} />
          <select name="role" style={inputStyle}>"""
new1a = """          <input name="companyName" placeholder="نام و نام خانوادگی" required style={inputStyle} />
          <input name="phone" placeholder="شماره تماس" required style={inputStyle} />
          <input name="username" placeholder="یوزرنیم / نام کاربری" required style={{ ...inputStyle, fontWeight: 700, fontFamily: 'monospace', direction: 'ltr', textAlign: 'left' }} />
          <input name="password" type="password" placeholder="رمز عبور" required style={inputStyle} />
          <select name="role" style={inputStyle}>"""
n1a = c1.count(old1a)
c1 = c1.replace(old1a, new1a, 1) if n1a == 1 else c1
report.append(f"{'OK' if n1a==1 else 'FAIL'} فرم — فیلدهای جدید ({n1a})")

# ==================== ۲. جدول کارشناسان — نمایش یوزرنیم بولد ====================
old1b = """              <b style={{ fontSize: 14 }}>{u.companyName}</b>{' '}
              <span style={{ color: '#9199a3', fontSize: 12, fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}>— {u.phone}</span>"""
new1b = """              <b style={{ fontSize: 14 }}>{u.companyName}</b>{' '}
              <span style={{ color: '#9199a3', fontSize: 12, fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}>— {u.phone}</span>
              {u.username && (
                <span style={{ fontWeight: 700, fontSize: 12, fontFamily: 'monospace', direction: 'ltr', display: 'inline-block', marginRight: 8 }}>
                  @{u.username}
                </span>
              )}"""
n1b = c1.count(old1b)
c1 = c1.replace(old1b, new1b, 1) if n1b == 1 else c1
report.append(f"{'OK' if n1b==1 else 'FAIL'} جدول کارشناسان — نمایش یوزرنیم ({n1b})")

with open(path1, "w", encoding="utf-8") as f:
    f.write(c1)

# ==================== ۳. اکشن — اعتبارسنجی + هش واقعی ====================
path2 = "src/app/admin-users/actions.ts"
with open(path2, encoding="utf-8") as f:
    c2 = f.read()

old2a = "import crypto from 'crypto'"
new2a = """import crypto from 'crypto'
import { hashPassword } from '@/lib/auth'
import { getPasswordPolicy, validatePassword } from '@/lib/passwordPolicy'"""
n2a = c2.count(old2a)
c2 = c2.replace(old2a, new2a, 1) if n2a == 1 else c2
report.append(f"{'OK' if n2a==1 else 'FAIL'} import hashPassword/policy ({n2a})")

old2b = """export async function createStaffUser(formData: FormData) {
  const companyName = String(formData.get('companyName') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const role = String(formData.get('role') || 'staff')
  if (!companyName || !phone) return

  if (role === 'admin') {
    const err = await assertSingleAdmin(null)
    if (err) {
      // چون هنوز toast/پیام خطای سراسری نداریم، فعلاً کارشناس رو با نقش staff می‌سازیم
      // و پیام رو توی لاگ سرور می‌ذاریم — وقتی UI پیام خطا داشته باشیم اینجا اصلاح می‌شه.
      console.warn('createStaffUser blocked admin role:', err)
      await prisma.user.create({
        data: { companyName, phone, role: 'staff', passwordHash: crypto.randomBytes(16).toString('hex') },
      })
      revalidatePath('/admin-users')
      return
    }
  }

  await prisma.user.create({
    data: {
      companyName,
      phone,
      role,
      passwordHash: crypto.randomBytes(16).toString('hex'),
    },
  })
  revalidatePath('/admin-users')
}"""

new2b = """export async function createStaffUser(formData: FormData) {
  const companyName = String(formData.get('companyName') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const username = String(formData.get('username') || '').trim()
  const password = String(formData.get('password') || '')
  const role = String(formData.get('role') || 'staff')
  if (!companyName || !phone || !username || !password) return

  // پسورد رو صریح از فرم می‌گیریم (نه تصادفی) — طبق همون قاعده‌ای که برای
  // ساخت شرکت حمل‌ونقل استفاده شد: سیاست مرکزی پسورد + هش واقعی.
  const policy = await getPasswordPolicy()
  const validation = validatePassword(password, policy)
  if (!validation.valid) {
    console.warn('createStaffUser blocked weak password:', validation.errors)
    return
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUsername) {
    console.warn('createStaffUser blocked duplicate username:', username)
    return
  }

  const passwordHash = hashPassword(password)

  if (role === 'admin') {
    const err = await assertSingleAdmin(null)
    if (err) {
      // چون هنوز toast/پیام خطای سراسری نداریم، فعلاً کارشناس رو با نقش staff می‌سازیم
      // و پیام رو توی لاگ سرور می‌ذاریم — وقتی UI پیام خطا داشته باشیم اینجا اصلاح می‌شه.
      console.warn('createStaffUser blocked admin role:', err)
      try {
        await prisma.user.create({
          data: { companyName, phone, username, role: 'staff', passwordHash, passwordChangedAt: new Date() },
        })
      } catch (e: any) {
        if (e?.code === 'P2002') { console.warn('createStaffUser race: duplicate username'); return }
        throw e
      }
      revalidatePath('/admin-users')
      return
    }
  }

  try {
    await prisma.user.create({
      data: {
        companyName,
        phone,
        username,
        role,
        passwordHash,
        passwordChangedAt: new Date(),
      },
    })
  } catch (e: any) {
    if (e?.code === 'P2002') { console.warn('createStaffUser race: duplicate username'); return }
    throw e
  }
  revalidatePath('/admin-users')
}"""

n2b = c2.count(old2b)
c2 = c2.replace(old2b, new2b, 1) if n2b == 1 else c2
report.append(f"{'OK' if n2b==1 else 'FAIL'} createStaffUser — بازنویسی کامل ({n2b})")

with open(path2, "w", encoding="utf-8") as f:
    f.write(c2)

# ==================== ۴. AdminNav.tsx — پراپ و نمایش یوزرنیم بولد ====================
path3 = "src/components/AdminNav.tsx"
with open(path3, encoding="utf-8") as f:
    c3 = f.read()

old3a = """export default function AdminNav({
  currentUserName,
  isAdmin,
  accessMap,
  activeSection,
}: {
  currentUserName: string
  isAdmin: boolean
  accessMap: Record<string, AccessLevel>
  activeSection?: string
}) {"""
new3a = """export default function AdminNav({
  currentUserName,
  currentUsername,
  isAdmin,
  accessMap,
  activeSection,
}: {
  currentUserName: string
  currentUsername?: string | null
  isAdmin: boolean
  accessMap: Record<string, AccessLevel>
  activeSection?: string
}) {"""
n3a = c3.count(old3a)
c3 = c3.replace(old3a, new3a, 1) if n3a == 1 else c3
report.append(f"{'OK' if n3a==1 else 'FAIL'} AdminNav — پراپ جدید ({n3a})")

old3b = """        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
          {currentUserName}
        </div>
        <div style={{ fontSize: 11, color: colors.textMuted }}>
          {isAdmin ? 'مدیر' : 'کارشناس'}
        </div>"""
new3b = """        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
          {currentUserName}
        </div>
        {currentUsername && (
          <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right', color: colors.textMuted }}>
            @{currentUsername}
          </div>
        )}
        <div style={{ fontSize: 11, color: colors.textMuted }}>
          {isAdmin ? 'مدیر' : 'کارشناس'}
        </div>"""
n3b = c3.count(old3b)
c3 = c3.replace(old3b, new3b, 1) if n3b == 1 else c3
report.append(f"{'OK' if n3b==1 else 'FAIL'} AdminNav — نمایش یوزرنیم بولد ({n3b})")

with open(path3, "w", encoding="utf-8") as f:
    f.write(c3)

print("\n".join(report))
