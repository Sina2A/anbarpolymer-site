import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { getAllSectionAccess } from '@/lib/permissions'
import type { AccessLevel } from '@/lib/sections'
import AdminNav, { PartialAccessBanner } from '@/components/AdminNav'
import { updateListingStatusAction } from './actions'
import {
  pageStyle, pageWrapStyle, contentStyle,
  h1Style, subTitleStyle,
  cardStyle,
  tableStyle, theadRowStyle, thStyle, tdStyle,
  badgeStyle, btnPrimaryStyle, btnDangerStyle, btnSmallStyle,
  emptyStateStyle,
} from '@/lib/styles/shared'
import { colors, spacing, fontSize } from '@/lib/styles/tokens'

export const dynamic = 'force-dynamic'

export default async function AdminMaterialListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const currentUser = await getCurrentUser()
  const isAdmin = currentUser.role === 'admin'
  const myAccess = isAdmin ? null : await getAllSectionAccess(currentUser.id)

  const level: AccessLevel = isAdmin ? 'full' : ((myAccess?.['material-listings'] as AccessLevel) ?? 'none')
  const hasAccess = level !== 'none'
  const canEdit = level === 'edit' || level === 'full'

  const listings = hasAccess
    ? await prisma.materialListing.findMany({
        include: {
          grade: { select: { code: true, category: true, producer: true } },
          user: { select: { companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    : []

  const statusLabels: Record<string, string> = {
    active: 'آزاد',
    reserved: 'رزرو شده',
    needs_reverification: 'نیاز به بازبینی',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده',
  }

  // نگاشت وضعیت‌های واقعی به ۵ نوع بج مشترک (success/warning/danger/info/neutral)
  const statusBadgeKind: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    active: 'success',
    reserved: 'warning',
    needs_reverification: 'danger',
    completed: 'info',
    cancelled: 'neutral',
  }

  const feedback =
    typeof params.updated === 'string'
      ? 'وضعیت آگهی تغییر یافت.'
      : null

  return (
    <div style={pageStyle}>
      <div style={pageWrapStyle} className="admin-page-wrap">
        <AdminNav
          currentUserName={currentUser.companyName}
          isAdmin={isAdmin}
          accessMap={myAccess || {}}
          activeSection="material-listings"
        />

        <div style={contentStyle}>
          <h1 style={h1Style}>شبکه عرضه مواد اولیه</h1>
          <p style={subTitleStyle}>نمای مدیریتی آگهی‌های MaterialListing فروشندگان — {listings.length} آگهی</p>

          <PartialAccessBanner level={level} sectionLabel="شبکه عرضه مواد اولیه" />

          {!hasAccess && <div style={emptyStateStyle}>به بخش «شبکه عرضه مواد اولیه» دسترسی نداری.</div>}

          {hasAccess && (
            <>
              {feedback && (
                <div style={{ ...badgeStyle('success'), padding: '10px 16px', marginBottom: spacing.lg, display: 'block' }}>
                  {feedback}
                </div>
              )}

              {listings.length === 0 ? (
                <div style={emptyStateStyle}>هیچ آگهی‌ای ثبت نشده.</div>
              ) : (
                <div style={cardStyle}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr style={theadRowStyle}>
                          <th style={thStyle}>تاریخ ثبت</th>
                          <th style={thStyle}>فروشنده</th>
                          <th style={thStyle}>کد گرید</th>
                          <th style={thStyle}>دسته</th>
                          <th style={thStyle}>تولیدکننده</th>
                          <th style={thStyle}>مقدار (تن)</th>
                          <th style={thStyle}>قیمت (تومان/کیلو)</th>
                          <th style={thStyle}>استان</th>
                          <th style={thStyle}>وضعیت</th>
                          <th style={thStyle}>مرحله‌ی اداری</th>
                          {canEdit && <th style={thStyle}>عملیات</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {listings.map((listing) => {
                          const badgeKind = statusBadgeKind[listing.validityStatus] || 'success'
                          const canToggle = listing.validityStatus === 'active' || listing.validityStatus === 'reserved'
                          const toggleLabel = listing.validityStatus === 'active' ? 'توقف' : 'فعالسازی'
                          return (
                            <tr key={listing.id} className="stripe-row-hover">
                              <td style={{ ...tdStyle, fontSize: fontSize.xs, color: colors.textSecondary }}>
                                {new Date(listing.createdAt).toLocaleDateString('fa-IR')}
                              </td>
                              <td style={tdStyle}>{listing.user.companyName}</td>
                              <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700 }}>
                                {listing.grade.code}
                              </td>
                              <td style={tdStyle}>{listing.grade.category}</td>
                              <td style={tdStyle}>{listing.grade.producer}</td>
                              <td style={{ ...tdStyle, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                                {listing.quantityTon.toLocaleString('en-US')}
                              </td>
                              <td style={{ ...tdStyle, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                                {listing.askingPriceToman.toLocaleString('fa-IR')}
                              </td>
                              <td style={tdStyle}>{listing.province}</td>
                              <td style={tdStyle}>
                                <span style={badgeStyle(badgeKind)}>
                                  {statusLabels[listing.validityStatus] || listing.validityStatus}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, fontSize: fontSize.xs, color: colors.textSecondary }}>
                                {listing.bureaucracyStage}
                              </td>
                              {canEdit && (
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                                  {canToggle && (
                                    <form action={updateListingStatusAction} style={{ display: 'inline' }}>
                                      <input type="hidden" name="id" value={listing.id} />
                                      <input type="hidden" name="action" value="toggle" />
                                      <button type="submit" style={{ ...btnPrimaryStyle, ...btnSmallStyle }}>
                                        {toggleLabel}
                                      </button>
                                    </form>
                                  )}
                                  {listing.validityStatus !== 'cancelled' && listing.validityStatus !== 'completed' && (
                                    <form action={updateListingStatusAction} style={{ display: 'inline', marginInlineStart: spacing.xs }}>
                                      <input type="hidden" name="id" value={listing.id} />
                                      <input type="hidden" name="action" value="cancel" />
                                      <button type="submit" style={{ ...btnDangerStyle, ...btnSmallStyle, background: colors.dangerText, color: '#fff', border: 'none' }}>
                                        حذف به دلیل تخلف
                                      </button>
                                    </form>
                                  )}
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
