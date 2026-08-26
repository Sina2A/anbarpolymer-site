import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import LogisticsNav from '@/components/LogisticsNav'

export const dynamic = 'force-dynamic'

// ── یادداشت مرحله‌ی بعد (نتیجه‌ی جست‌وجوی کد — پاک نشه) ──
// «دیدن گزارش راننده» الان فقط برای مدیر سایت بازه:
//   • src/app/admin-deals/page.tsx → بخش «تایم‌لاین رویدادها»: رندر رکوردهای DealConfirmation
//     (type=loading|unloading، driverName/driverPhone/vehiclePlate/vehicleType،
//      receiverName/receiverRole، checklistJson با CHECKLIST_LABELS، photoUrl، latitude/longitude)
//   • موقعیت زنده: Deal.currentLatitude / currentLongitude / locationUpdatedAt —
//     DriverForm.tsx هر ۱۲۰۰۰۰ms به /api/driver-location پست می‌کنه (فقط type='loading')
//   • نمایش نقشه: src/components/TransportMap.tsx (react-leaflet، dynamic ssr:false)،
//     که فعلاً فقط در src/app/transport/page.tsx برای خریدار/فروشنده استفاده می‌شه
//   • /transport-panel فعلی فقط locationUpdatedAt و driverSilenceFlaggedAt رو نشون می‌ده،
//     نه checklistJson / photoUrl / مختصات هر تاییدیه
// ────────────────────────────────────────────────────────

// ⚠️ این صفحه فعلاً فقط اسکلت/چیدمانه — هیچ کوئری Deal واقعی‌ای نداره.
// تنها کوئری Prisma اینجا «گیت دسترسی» شرکته که عیناً از /transport-panel فعلی کپی شده.
// ۵ ستونِ زیر placeholderن؛ اتصال به داده‌ی واقعی (مقدار بار، کرایه، راننده/پلاک،
// موقعیت زنده‌ی GPS، وضعیت/تایم‌لاین رویدادها) توی یه پرامپت جداگونه‌ی بعدی انجام می‌شه.
const PLACEHOLDER_ROWS = Array.from({ length: 10 }, (_, i) => ({
  n: i + 1,
  v1: `مقدار${i + 1}`,
  v2: `مقدار${i + 1}`,
  v3: `مقدار${i + 1}`,
  v4: `مقدار${i + 1}`,
  v5: `مقدار${i + 1}`,
}))

export default async function TransportCurrentPage() {
  const user = await getCurrentUser()

  const company = await prisma.transportCompany.findUnique({
    where: { managerUserId: user.id },
  })

  if (!company) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            پنل شرکت حمل‌ونقل — دسترسی ندارید
          </h1>
          <p style={{ fontSize: 13.5, color: '#4f5560' }}>این حساب به هیچ شرکت حمل‌ونقلی وصل نیست. با پشتیبانی انبار پلیمر تماس بگیرید.</p>
        </div>
      </div>
    )
  }

  // گیت دسترسی پنل — جدای از خودِ قرارداد حمل. اگه مدیر دسترسی رو قطع کرده باشه،
  // شرکت اصلاً محتوای پنل رو نمی‌بینه (عیناً همون منطق /transport-panel فعلی).
  if (!company.logisticsAccessEnabled) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            پنل شرکت حمل‌ونقل — دسترسی غیرفعال
          </h1>
          <p style={{ fontSize: 13.5, color: '#4f5560' }}>
            دسترسی پنل حمل‌ونقل برای <b>{company.name}</b> در حال حاضر غیرفعاله. برای فعال‌شدن با پشتیبانی انبار پلیمر تماس بگیرید.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div className="admin-page-wrap">
        <LogisticsNav currentUserName={company.name} activeSection="current" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>حمل‌ونقل‌های جاری</h1>
          <p style={{ fontSize: 13, color: '#9199a3', marginBottom: 20 }}>
            <b style={{ color: '#4f5560', fontWeight: 700 }}>{company.name}</b>
            {' — '}
            محموله‌های در حال انجام این شرکت حمل‌ونقل
          </p>

          <div style={tableCardStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f7f8fa', color: '#6f7680', textAlign: 'right' }}>
                  <th style={thStyle}>ردیف</th>
                  <th style={thStyle}>متغیر ۱</th>
                  <th style={thStyle}>متغیر ۲</th>
                  <th style={thStyle}>متغیر ۳</th>
                  <th style={thStyle}>متغیر ۴</th>
                  <th style={thStyle}>متغیر ۵</th>
                </tr>
              </thead>
              <tbody>
                {PLACEHOLDER_ROWS.map((row) => (
                  <tr key={row.n} style={{ borderTop: '1px solid #eceff3' }}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#6f7680' }}>{row.n}</td>
                    <td style={tdStyle}>{row.v1}</td>
                    <td style={tdStyle}>{row.v2}</td>
                    <td style={tdStyle}>{row.v3}</td>
                    <td style={tdStyle}>{row.v4}</td>
                    <td style={tdStyle}>{row.v5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#faf8f4', padding: '32px 20px', fontFamily: "'Vazirmatn', Tahoma, sans-serif", direction: 'rtl' }
const cardStyle: React.CSSProperties = { border: '1px solid #d8dde3', borderRadius: 12, padding: 18, marginBottom: 14, background: '#fff', boxShadow: '0 1px 4px rgba(27,30,36,.05)', maxWidth: 780, margin: '0 auto' }
const tableCardStyle: React.CSSProperties = { border: '1px solid #d8dde3', borderRadius: 12, background: '#fff', boxShadow: '0 1px 4px rgba(27,30,36,.05)', overflow: 'hidden' }
const thStyle: React.CSSProperties = { padding: '10px 12px', fontWeight: 700 }
const tdStyle: React.CSSProperties = { padding: '9px 12px', color: '#1b1e24' }
