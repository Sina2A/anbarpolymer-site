path = "src/app/my-tasks/page.tsx"
with open(path, "w", encoding="utf-8") as f:
    f.write(r"""import prisma from '@/lib/prisma'
import { SECTION_KEYS, getAllSectionAccess } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/currentUser'
import { isTerminalStage, getStageDef, RecordType } from '@/lib/workflow'
import AdminNav from '@/components/AdminNav'
import { pageStyle, pageWrapStyle, contentStyle, h1Style, subTitleStyle, cardStyle, badgeStyle, emptyStateStyle } from '@/lib/styles/shared'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
const BRAND_COLOR = '#e65716'

const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  Order: 'سفارش',
  MaterialListing: 'درخواست فروش مواد اولیه',
  SupportTicket: 'تیکت پشتیبانی',
}

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const currentUser = await getCurrentUser()

  const isAdmin = currentUser.role === 'admin'
  const myAccess = isAdmin ? null : await getAllSectionAccess(currentUser.id)

  // مدیر روی همه‌ی بخش‌ها دسترسی edit داره (بدون نیاز به ردیف Permission)؛ کارشناس فقط طبق جدول دسترسی‌هاش
  const mySections = isAdmin
    ? new Set(SECTION_KEYS.map((s) => s.key))
    : new Set(Object.entries(myAccess || {}).filter(([, level]) => level === 'edit' || level === 'full').map(([key]) => key))

  const allEvents = await prisma.statusEvent.findMany({ orderBy: { createdAt: 'asc' } })
  const latestByRecord = new Map<string, (typeof allEvents)[number]>()
  for (const ev of allEvents) {
    latestByRecord.set(`${ev.recordType}:${ev.recordId}`, ev)
  }

  const myTasks = Array.from(latestByRecord.values()).filter((ev) => {
    const recordType = ev.recordType as RecordType
    if (isTerminalStage(recordType, ev.stageKey)) return false
    const stageDef = getStageDef(recordType, ev.stageKey)
    if (!stageDef?.responsibleSection) return false
    return mySections.has(stageDef.responsibleSection)
  })

  const bySection = new Map<string, typeof myTasks>()
  for (const task of myTasks) {
    const recordType = task.recordType as RecordType
    const stageDef = getStageDef(recordType, task.stageKey)
    const section = stageDef?.responsibleSection ?? 'other'
    if (!bySection.has(section)) bySection.set(section, [])
    bySection.get(section)!.push(task)
  }

  // مرتب‌سازی نزولی بر اساس تاریخ ثبت — جدیدترین رکورد بالاترین ردیف
  for (const tasks of bySection.values()) {
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // ساخت لینک صفحه‌بندی — فقط پارامتر همون بخش عوض می‌شه، صفحه‌ی بخش‌های دیگه دست‌نخورده می‌مونه
  function buildPageHref(sectionKey: string, page: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(sp)) {
      if (typeof value === 'string') params.set(key, value)
    }
    params.set(`page_${sectionKey}`, String(page))
    return `/my-tasks?${params.toString()}`
  }

  return (
    <div style={pageStyle}>
      <div style={pageWrapStyle}>
        <AdminNav currentUserName={currentUser.companyName} currentUsername={currentUser.username} isAdmin={isAdmin} accessMap={myAccess || {}} activeSection="tasks" />

        <div style={contentStyle}>
          <h1 style={h1Style}>کارهای منتظر من</h1>
          <p style={subTitleStyle}>
            رکوردهایی که الان توی مرحله‌ای هستن که مسئولیتش با یکی از بخش‌های شماست.
          </p>

          {myTasks.length === 0 && (
            <div style={emptyStateStyle}>
              هیچ کار منتظری نیست 🎉
            </div>
          )}

          {SECTION_KEYS.filter((sec) => bySection.has(sec.key)).map((sec) => {
            const allTasks = bySection.get(sec.key)!
            const totalPages = Math.max(1, Math.ceil(allTasks.length / PAGE_SIZE))
            const rawPage = parseInt(String(sp[`page_${sec.key}`] ?? '1'), 10)
            const currentPage = Number.isFinite(rawPage) && rawPage >= 1 && rawPage <= totalPages ? rawPage : 1
            const pageTasks = allTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

            return (
              <div key={sec.key} style={cardStyle}>
                <h3 style={{ fontSize: 14.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {sec.label}
                  <span style={badgeStyle('danger')}>{allTasks.length}</span>
                </h3>

                {totalPages > 1 && (
                  <div style={paginationRow}>
                    <a
                      href={buildPageHref(sec.key, Math.max(1, currentPage - 1))}
                      style={currentPage === 1 ? paginationBtnDisabled : paginationBtn}
                    >
                      → قبلی
                    </a>

                    <div style={paginationNumbersRow}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <a
                          key={pageNum}
                          href={buildPageHref(sec.key, pageNum)}
                          style={pageNum === currentPage ? paginationNumActive : paginationNum}
                        >
                          {pageNum.toLocaleString('fa-IR')}
                        </a>
                      ))}
                    </div>

                    <a
                      href={buildPageHref(sec.key, Math.min(totalPages, currentPage + 1))}
                      style={currentPage === totalPages ? paginationBtnDisabled : paginationBtn}
                    >
                      بعدی ←
                    </a>
                  </div>
                )}

                {pageTasks.map((task) => (
                  <div key={task.id} style={taskRow}>
                    <div>
                      <span style={badgeStyle('info')}>{RECORD_TYPE_LABELS[task.recordType as RecordType]}</span>
                      <span style={{ fontSize: 11.5, color: '#9199a3', fontFamily: 'monospace', marginRight: 8 }}>#{task.recordId.slice(0, 8)}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{task.currentStage}</div>
                    <div style={{ fontSize: 11.5, color: '#9199a3', marginTop: 4 }}>از {new Date(task.createdAt).toLocaleDateString('fa-IR')} منتظره</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const taskRow: React.CSSProperties = { borderTop: '1px solid #eceff3', padding: '12px 4px' }

const paginationRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 16,
  paddingBottom: 14,
  borderBottom: '1px solid #eceff3',
}
const paginationNumbersRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 6,
}
const paginationBtn: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  color: BRAND_COLOR,
  textDecoration: 'none',
  padding: '6px 14px',
  border: `1.5px solid ${BRAND_COLOR}`,
  borderRadius: 8,
  whiteSpace: 'nowrap',
}
const paginationBtnDisabled: React.CSSProperties = {
  ...paginationBtn,
  color: '#c2c8d0',
  borderColor: '#e3e8ee',
  pointerEvents: 'none',
  cursor: 'not-allowed',
}
const paginationNum: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 700,
  color: BRAND_COLOR,
  textDecoration: 'none',
  minWidth: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `1.5px solid ${BRAND_COLOR}`,
  borderRadius: 8,
}
const paginationNumActive: React.CSSProperties = {
  ...paginationNum,
  background: BRAND_COLOR,
  color: '#fff',
}
""")
print("OK: my-tasks/page.tsx با پیجینیشن شماره‌دار به‌روزرسانی شد")
