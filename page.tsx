import prisma from '@/lib/prisma'
import { getCurrentUserOrNull } from '@/lib/currentUser'
import ListingDetailModal from '@/components/ListingDetailModal'

export const dynamic = 'force-dynamic'

const POLYMER_FAMILY_OPTIONS = ['PP', 'HDPE', 'LDPE', 'LLDPE', 'PVC', 'PET', 'PS', 'EPS', 'ABS', 'سایر']

function one(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const q = one(sp.q)?.trim() || ''
  const family = one(sp.family)?.trim() || ''
  const category = one(sp.category)?.trim() || ''
  const applicationType = one(sp.applicationType)?.trim() || ''
  const producer = one(sp.producer)?.trim() || ''
  const province = one(sp.province)?.trim() || ''

  // ── Check auth/KYC level ──
  const user = await getCurrentUserOrNull()
  let kycLevel = 0
  if (user) {
    const comp = await prisma.company.findUnique({
      where: { userId: user.id },
      select: { kyc: { select: { level: true } } },
    })
    kycLevel = comp?.kyc?.level ?? 0
  }

  // ── Build where ──
  const where: Record<string, unknown> = { validityStatus: 'active' }

  if (q) {
    ;(where as any).OR = [
      { grade: { code: { contains: q, mode: 'insensitive' } } },
      { grade: { producer: { contains: q, mode: 'insensitive' } } },
      { grade: { category: { contains: q, mode: 'insensitive' } } },
    ]
  }
  if (family) where.grade = { ...((where.grade as any) || {}), polymerFamily: family }
  if (category) where.grade = { ...((where.grade as any) || {}), category }
  if (applicationType) where.grade = { ...((where.grade as any) || {}), applicationType }
  if (producer) where.grade = { ...((where.grade as any) || {}), producer }
  if (province) where.province = province

  // ── Query ──
  // NOTE: do NOT include `user` here — the full listing is passed to the
  // <ListingDetailModal> client component and would serialize User.passwordHash
  // (and phone/email) into the public page payload. The modal never uses it.
  const listings = await prisma.materialListing.findMany({
    where: where as any,
    include: { grade: true },
    orderBy: { createdAt: 'desc' },
  })

  // ── Filter options ──
  const [allCategories, allApplicationTypes, allProducers, allProvinces] = await Promise.all([
    prisma.grade.findMany({
      where: { isActive: true },
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    }),
    prisma.grade.findMany({
      where: { isActive: true, applicationType: { not: null } },
      distinct: ['applicationType'],
      select: { applicationType: true },
      orderBy: { applicationType: 'asc' },
    }),
    prisma.grade.findMany({
      where: { isActive: true },
      distinct: ['producer'],
      select: { producer: true },
      orderBy: { producer: 'asc' },
    }),
    prisma.materialListing.findMany({
      where: { validityStatus: 'active' },
      distinct: ['province'],
      select: { province: true },
      orderBy: { province: 'asc' },
    }),
  ])

  const categories = allCategories.map((r) => r.category)
  const applicationTypes = allApplicationTypes.map((r) => r.applicationType).filter((v): v is string => !!v)
  const producers = allProducers.map((r) => r.producer)
  const provinces = allProvinces.map((r) => r.province)

  return (
    <>
      <style>{`
        .market-table tbody tr:hover {
          background: #f7f8fa;
        }
      `}</style>
      <div className="topbar">
        <div className="wrap">
          <span>پشتیبانی فروش شنبه تا چهارشنبه ۸:۳۰ تا ۱۷:۳۰</span>
          <a className="phone" href="tel:+982191234567">
            021-91234567
          </a>
        </div>
      </div>
      <header className="site-header">
        <div className="wrap">
          <a href="/" className="logo">
            <span className="dot"></span> انبار پلیمر
          </a>
          <nav className="main-nav">
            <a href="/">صفحه اصلی</a>
            <a href="/grades">گریدها</a>
            <a href="/rfq">استعلام قیمت</a>
            <a href="/market" className="active">
              بازار صنعتی
            </a>
            <a href="/reports">گزارش بازار</a>
            <a href="/services">خدمات سازمانی</a>
            <a href="/about">درباره ما</a>
            <a href="/contact">تماس با ما</a>
          </nav>
          <div className="header-actions">
            {user ? (
              <a href="/dashboard" className="acct-btn">
                پیشخوان
              </a>
            ) : (
              <a href="/login" className="acct-btn">
                ورود / ثبت‌نام
              </a>
            )}
          </div>
        </div>
      </header>

      <section>
        <div className="wrap">
          <div className="eyebrow">خرید و فروش مواد اولیه</div>
          <div className="sec-title">بازار صنعتی پلیمر</div>
          <div className="sec-sub" style={{ marginBottom: 20 }}>
            آگهی‌های فروش مواد اولیه پلیمری از تولیدکنندگان و فروشندگان سراسر کشور —{' '}
            <b style={{ color: 'var(--cyan)' }}>{listings.length} آگهی فعال</b>
          </div>

          {/* ── Guest CTA ── */}
          {!user && (
            <div style={guestBanner}>
              برای مشاهده‌ی جزئیات کامل، قیمت و خرید،{' '}
              <a href="/signup" style={{ color: '#e65716', fontWeight: 700, textDecoration: 'underline' }}>
                عضو شوید ←
              </a>
            </div>
          )}

          {/* ── Filters ── */}
          <form method="GET" action="/market" style={filterFormStyle}>
            <input
              name="q"
              defaultValue={q}
              placeholder="جستجو: کد گرید، تولیدکننده، دسته…"
              style={inputStyle}
            />

            {/* Quick chips */}
            <div style={chipRow}>
              {POLYMER_FAMILY_OPTIONS.map((f) => (
                <a
                  key={f}
                  href={`/market?family=${encodeURIComponent(f)}`}
                  style={{
                    ...chipStyle,
                    background: family === f ? '#fff4ee' : '#f1efe8',
                    color: family === f ? '#e65716' : '#5a5340',
                    fontWeight: family === f ? 700 : 400,
                  }}
                >
                  {f}
                </a>
              ))}
            </div>

            <select name="category" defaultValue={category} style={selectStyle}>
              <option value="">همه‌ی دسته‌ها</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select name="applicationType" defaultValue={applicationType} style={selectStyle}>
              <option value="">همه‌ی کاربردها</option>
              {applicationTypes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select name="producer" defaultValue={producer} style={selectStyle}>
              <option value="">همه‌ی تولیدکنندگان</option>
              {producers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select name="province" defaultValue={province} style={selectStyle}>
              <option value="">همه‌ی استان‌ها</option>
              {provinces.map((pr) => (
                <option key={pr} value={pr}>
                  {pr}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-sm" style={{ whiteSpace: 'nowrap' }}>
              اعمال فیلتر
            </button>
            {(q || family || category || applicationType || producer || province) && (
              <a href="/market" className="btn btn-sm btn-outline" style={{ whiteSpace: 'nowrap' }}>
                پاک کردن
              </a>
            )}
          </form>

          {/* ── Table ── */}
          {listings.length === 0 ? (
            <div style={emptyStyle}>هیچ آگهی فعالی با این فیلتر یافت نشد.</div>
          ) : (
            <div style={tableWrap}>
              <table style={tableStyle} className="market-table">
                <thead>
                  <tr>
                    <th>تاریخ ثبت</th>
                    <th>نوع ماده</th>
                    <th>تولیدکننده</th>
                    <th>کد گرید</th>
                    <th>MFI</th>
                    <th>کاربرد</th>
                    <th>مقدار</th>
                    <th>قیمت</th>
                    <th>وضعیت</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <ListingDetailModal key={listing.id} listing={listing} kycLevel={kycLevel} isGuest={!user} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap">
          <div className="footer-cols">
            <div>
              <a href="/" className="logo" style={{ marginBottom: 14, display: 'flex' }}>
                <span className="dot"></span> انبار پلیمر
              </a>
              <p style={{ color: 'var(--ink-dim)', fontSize: 13, maxWidth: 280 }}>
                واردکننده و فروشنده مستقیم مواد اولیه پلیمری برای کارخانه‌های تولیدی سراسر کشور.
              </p>
            </div>
            <div>
              <h5>محصولات</h5>
              <ul>
                <li>
                  <a href="/grades">پلی‌پروپیلن</a>
                </li>
                <li>
                  <a href="/grades">پلی‌اتیلن</a>
                </li>
                <li>
                  <a href="/grades">پی‌وی‌سی</a>
                </li>
                <li>
                  <a href="/grades">پلی‌اتیلن ترفتالات</a>
                </li>
              </ul>
            </div>
            <div>
              <h5>خدمات</h5>
              <ul>
                <li>
                  <a href="/rfq">استعلام قیمت آنلاین</a>
                </li>
                <li>
                  <a href="/market">بازار صنعتی</a>
                </li>
                <li>
                  <a href="/services">فروش سازمانی</a>
                </li>
                <li>
                  <a href="/reports">گزارش بازار</a>
                </li>
              </ul>
            </div>
            <div>
              <h5>اطلاعات تماس</h5>
              <ul>
                <li>تهران، خیابان ولیعصر، پلاک ۱۲۴</li>
                <li>انبار یزد — شهرک صنعتی یزد</li>
                <li style={{ direction: 'ltr', textAlign: 'right' }}>021-91234567</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>انبار پلیمر © ۱۴۰۵ — تمام حقوق محفوظ است</span>
          </div>
        </div>
      </footer>
    </>
  )
}

// ── Styles ──
const guestBanner: React.CSSProperties = {
  background: '#fef3c7',
  color: '#92400e',
  borderRadius: 8,
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 20,
  textAlign: 'center',
}
const filterFormStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginBottom: 20,
  padding: 12,
  background: '#f8f9fb',
  border: '1px solid #eceff3',
  borderRadius: 10,
}
const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d8dde3',
  borderRadius: 8,
  fontSize: 13,
  outline: 'none',
}
const chipRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
}
const chipStyle: React.CSSProperties = {
  fontSize: 11,
  borderRadius: 20,
  padding: '4px 12px',
  textDecoration: 'none',
  transition: 'background .15s',
  cursor: 'pointer',
}
const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #d8dde3',
  borderRadius: 8,
  fontSize: 13,
  background: '#fff',
  minWidth: 140,
}
const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: '#9199a3',
  fontSize: 13,
  border: '1px dashed #d8dde3',
  borderRadius: 10,
}
const tableWrap: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 12,
  border: '1px solid #d8dde3',
  background: '#fff',
}
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 12.5,
  fontFamily: "'Vazirmatn', Tahoma, sans-serif",
  direction: 'rtl',
}
