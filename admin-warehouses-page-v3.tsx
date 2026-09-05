import { Fragment } from 'react'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { getAllSectionAccess } from '@/lib/permissions'
import type { AccessLevel } from '@/lib/sections'
import AdminNav, { PartialAccessBanner } from '@/components/AdminNav'
import {
  createWarehouseAction,
  upsertStockAction,
  deleteStockAction,
  requestDeleteWarehouseAction,
  approveWarehouseDeletionAction,
  rejectWarehouseDeletionAction,
} from './actions'
import {
  pageStyle, pageWrapStyle, contentStyle,
  h1Style, subTitleStyle,
  cardStyle, cardHeaderStyle, cardTitleStyle,
  tableStyle, theadRowStyle, thStyle, tdStyle,
  badgeStyle, btnPrimaryStyle, btnSecondaryStyle, btnDangerStyle, btnSmallStyle,
  inputStyle, labelStyle, emptyStateStyle,
} from '@/lib/styles/shared'
import { colors, spacing, radius, fontSize } from '@/lib/styles/tokens'

export const dynamic = 'force-dynamic'

export default async function AdminWarehousesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const currentUser = await getCurrentUser()
  const isAdmin = currentUser.role === 'admin'
  const myAccess = isAdmin ? null : await getAllSectionAccess(currentUser.id)

  const level: AccessLevel = isAdmin ? 'full' : ((myAccess?.warehouses as AccessLevel) ?? 'none')
  const hasAccess = level !== 'none'
  const canEdit = level === 'edit' || level === 'full'

  const warehouses = hasAccess
    ? await prisma.warehouse.findMany({
        include: {
          stock: {
            include: { grade: { select: { code: true, category: true } } },
            orderBy: { updatedAt: 'desc' },
          },
          _count: { select: { stock: true, orderItems: true } },
          deletionRequestedBy: { select: { companyName: true } },
        },
        orderBy: { name: 'asc' },
      })
    : []

  const pendingDeletions = warehouses.filter((w) => w.deletionRequestedById)

  const activeGrades = canEdit
    ? await prisma.grade.findMany({
        where: { isActive: true },
        select: { id: true, code: true, category: true },
        orderBy: { code: 'asc' },
      })
    : []

  const editingStockId = typeof params.editing === 'string' ? params.editing : null
  const confirmDeleteId = typeof params.confirmDelete === 'string' ? params.confirmDelete : null
  const confirmDeleteWarehouseId = typeof params.confirmDeleteWarehouse === 'string' ? params.confirmDeleteWarehouse : null

  const feedback =
    typeof params.created === 'string'
      ? 'انبار جدید ثبت شد.'
      : typeof params.updated === 'string'
        ? 'انبار ویرایش شد.'
        : typeof params.stock === 'string'
          ? 'موجودی ذخیره شد.'
          : typeof params.deleted === 'string'
            ? 'ردیف موجودی حذف شد.'
            : typeof params.deletionRequested === 'string'
              ? 'درخواست حذف انبار برای مدیر ارسال شد. منتظر باشید...'
              : typeof params.deletionRejected === 'string'
                ? 'درخواست حذف رد شد.'
                : typeof params.deletedWarehouse === 'string'
                  ? 'انبار حذف شد.'
                  : null

  return (
    <div style={pageStyle}>
      <div style={pageWrapStyle} className="admin-page-wrap">
        <AdminNav
          currentUserName={currentUser.companyName}
          isAdmin={isAdmin}
          accessMap={myAccess || {}}
          activeSection="warehouses"
        />

        <div style={contentStyle}>
          <h1 style={h1Style}>انبارها و موجودی</h1>
          <p style={subTitleStyle}>مدیریت انبارهای انبار پلیمر و موجودی هر گرید در هر انبار</p>

          <PartialAccessBanner level={level} sectionLabel="انبارها و موجودی" />

          {!hasAccess && <div style={emptyStateStyle}>به بخش «انبارها و موجودی» دسترسی نداری.</div>}

          {hasAccess && (
            <>
              {feedback && (
                <div style={{ ...badgeStyle('success'), padding: '10px 16px', marginBottom: spacing.lg, display: 'block' }}>
                  {feedback}
                </div>
              )}

              {/* فقط مدیر واقعی این بخش رو می‌بینه */}
              {isAdmin && pendingDeletions.length > 0 && (
                <div style={{ ...cardStyle, borderColor: colors.dangerText, marginBottom: spacing.lg }}>
                  <div style={cardHeaderStyle}>
                    <b style={{ fontSize: fontSize.md, color: colors.dangerText }}>
                      ⚠️ درخواست‌های حذف در انتظار تایید ({pendingDeletions.length})
                    </b>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    {pendingDeletions.map((wh) => (
                      <div
                        key={wh.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: spacing.sm,
                          padding: spacing.sm,
                          background: colors.bgPage,
                          borderRadius: radius.sm,
                        }}
                      >
                        <div style={{ fontSize: fontSize.sm }}>
                          <b>{wh.name}</b>
                          <span style={{ color: colors.textMuted, marginInlineStart: spacing.sm }}>
                            درخواست‌دهنده: {wh.deletionRequestedBy?.companyName ?? '—'} — {wh._count.stock} ردیف موجودی، {wh._count.orderItems} سفارش
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: spacing.xs }}>
                          {confirmDeleteWarehouseId === wh.id ? (
                            <>
                              <form action={approveWarehouseDeletionAction} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={wh.id} />
                                <button type="submit" style={{ ...btnDangerStyle, ...btnSmallStyle, background: colors.dangerText, color: '#fff', border: 'none' }}>
                                  بله، برای همیشه حذف کن
                                </button>
                              </form>
                              <a href="?" style={cancelLinkStyle}>انصراف</a>
                            </>
                          ) : (
                            <>
                              <a href={`?confirmDeleteWarehouse=${wh.id}`} style={{ ...btnDangerStyle, ...btnSmallStyle, background: colors.dangerText, color: '#fff', border: 'none', textDecoration: 'none', display: 'inline-block' }}>
                                تایید نهایی و حذف
                              </a>
                              <form action={rejectWarehouseDeletionAction} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={wh.id} />
                                <button type="submit" style={{ ...btnSecondaryStyle, ...btnSmallStyle }}>رد درخواست</button>
                              </form>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canEdit && (
                <details style={{ marginBottom: spacing.lg }}>
                  <summary style={{ ...btnPrimaryStyle, display: 'inline-block', listStyle: 'none', cursor: 'pointer' }}>
                    + افزودن انبار جدید
                  </summary>
                  <form action={createWarehouseAction} style={formCardStyle}>
                    <div style={formGridStyle}>
                      <label style={fieldLabelStyle}>
                        نام انبار *
                        <input name="name" required maxLength={120} style={inputStyle} />
                      </label>
                      <label style={fieldLabelStyle}>
                        شهر *
                        <input name="city" required maxLength={80} style={inputStyle} />
                      </label>
                      <label style={fieldLabelStyle}>
                        آدرس
                        <input name="address" maxLength={250} style={inputStyle} />
                      </label>
                      <label style={fieldLabelStyle}>
                        عرض جغرافیایی
                        <input name="latitude" type="number" step="any" style={inputStyle} />
                      </label>
                      <label style={fieldLabelStyle}>
                        طول جغرافیایی
                        <input name="longitude" type="number" step="any" style={inputStyle} />
                      </label>
                    </div>
                    <label style={{ ...fieldLabelStyle, marginTop: spacing.sm, display: 'block' }}>
                      توضیحات
                      <textarea name="description" maxLength={500} rows={2} style={inputStyle} />
                    </label>
                    <div style={{ marginTop: spacing.md }}>
                      <button type="submit" style={btnPrimaryStyle}>ذخیره انبار</button>
                    </div>
                  </form>
                </details>
              )}

              {warehouses.length === 0 ? (
                <div style={emptyStateStyle}>هیچ انباری ثبت نشده.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                  {warehouses.map((wh) => {
                    const isPending = !!wh.deletionRequestedById
                    return (
                    <div key={wh.id} style={cardStyle}>
                      <div style={{ ...cardHeaderStyle, alignItems: 'flex-start', flexWrap: 'wrap', gap: spacing.md }}>
                        <div>
                          <h3 style={cardTitleStyle}>{wh.name}</h3>
                          <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 }}>
                            {wh.city}
                            {wh.address && <> — {wh.address}</>}
                          </div>
                          {isPending && !isAdmin && (
                            <span style={{ ...badgeStyle('warning'), marginTop: spacing.xs, display: 'inline-block' }}>
                              ⏳ درخواست حذف در انتظار تایید مدیر
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, fontSize: fontSize.sm, color: colors.textMuted }}>
                          <span><b style={{ color: colors.textPrimary }}>{wh._count.stock}</b> گرید</span>
                          <span>•</span>
                          <span><b style={{ color: colors.textPrimary }}>{wh._count.orderItems}</b> سفارش</span>
                          {canEdit && !isPending && confirmDeleteWarehouseId === wh.id && (
                            <>
                              <form action={requestDeleteWarehouseAction} style={{ display: 'inline' }}>
                                <input type="hidden" name="id" value={wh.id} />
                                <button type="submit" style={{ ...btnDangerStyle, ...btnSmallStyle }}>
                                  {isAdmin ? 'بله، حذف کن' : 'بله، درخواست بفرست'}
                                </button>
                              </form>
                              <a href="?" style={cancelLinkStyle}>انصراف</a>
                            </>
                          )}
                          {canEdit && !isPending && confirmDeleteWarehouseId !== wh.id && (
                            <a href={`?confirmDeleteWarehouse=${wh.id}`} style={dangerLinkStyle}>
                              {isAdmin ? 'حذف انبار' : 'درخواست حذف'}
                            </a>
                          )}
                        </div>
                      </div>

                      {wh.description && (
                        <div style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 1.7 }}>
                          {wh.description}
                        </div>
                      )}

                      {wh.stock.length === 0 ? (
                        <div style={emptyStateStyle}>هیچ موجودی‌ای در این انبار ثبت نشده.</div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={tableStyle}>
                            <thead>
                              <tr style={theadRowStyle}>
                                <th style={thStyle}>کد گرید</th>
                                <th style={thStyle}>دسته</th>
                                <th style={thStyle}>مقدار (تن)</th>
                                <th style={thStyle}>قیمت (ریال/کیلو)</th>
                                <th style={thStyle}>بچ</th>
                                <th style={thStyle}>آخرین بروزرسانی</th>
                                {canEdit && <th style={thStyle}>عملیات</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {wh.stock.map((st) => {
                                const isEditing = editingStockId === st.id
                                const isConfirmingDelete = confirmDeleteId === st.id
                                return (
                                  <Fragment key={st.id}>
                                    <tr className="stripe-row-hover">
                                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700 }}>
                                        {st.grade.code}
                                      </td>
                                      <td style={tdStyle}>{st.grade.category}</td>
                                      <td style={{ ...tdStyle, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                                        {st.quantityTon.toLocaleString('en-US')}
                                      </td>
                                      <td style={{ ...tdStyle, fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                                        {st.priceRial.toLocaleString('en-US')}
                                      </td>
                                      <td style={{ ...tdStyle, fontFamily: 'monospace', color: colors.textSecondary }}>
                                        {st.batch || '—'}
                                      </td>
                                      <td style={{ ...tdStyle, fontSize: fontSize.xs, color: colors.textSecondary }}>
                                        {new Date(st.updatedAt).toLocaleDateString('fa-IR')}
                                      </td>
                                      {canEdit && (
                                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                                          <a href={`?editing=${st.id}`} style={actionLinkStyle}>ویرایش</a>
                                          {isConfirmingDelete ? (
                                            <>
                                              <form action={deleteStockAction} style={{ display: 'inline' }}>
                                                <input type="hidden" name="id" value={st.id} />
                                                <button type="submit" style={{ ...btnDangerStyle, ...btnSmallStyle, border: 'none', background: 'none', marginInlineStart: spacing.sm }}>
                                                  تایید حذف
                                                </button>
                                              </form>
                                              <a href="?" style={cancelLinkStyle}>انصراف</a>
                                            </>
                                          ) : (
                                            <a href={`?confirmDelete=${st.id}`} style={dangerLinkStyle}>حذف</a>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                    {isEditing && (
                                      <tr style={{ background: colors.bgPage }}>
                                        <td colSpan={canEdit ? 7 : 6} style={{ padding: `${spacing.md}px ${spacing.sm}px` }}>
                                          <form action={upsertStockAction} style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, alignItems: 'flex-end' }}>
                                            <input type="hidden" name="warehouseId" value={wh.id} />
                                            <input type="hidden" name="gradeId" value={st.gradeId} />
                                            <div style={{ fontSize: fontSize.sm, fontWeight: 700, width: '100%' }}>
                                              ویرایش موجودی: {st.grade.code} ({st.grade.category})
                                            </div>
                                            <label style={fieldLabelStyle}>
                                              مقدار (تن)
                                              <input name="quantityTon" type="number" step="0.01" defaultValue={st.quantityTon} required style={{ ...inputStyle, width: 110 }} />
                                            </label>
                                            <label style={fieldLabelStyle}>
                                              قیمت (ریال/کیلو)
                                              <input name="priceRial" type="number" step="1" defaultValue={st.priceRial} required style={{ ...inputStyle, width: 110 }} />
                                            </label>
                                            <label style={fieldLabelStyle}>
                                              بچ
                                              <input name="batch" defaultValue={st.batch || ''} style={{ ...inputStyle, width: 110 }} />
                                            </label>
                                            <button type="submit" style={btnPrimaryStyle}>ذخیره</button>
                                            <a href="?" style={cancelLinkStyle}>لغو</a>
                                          </form>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {activeGrades.length > 0 && canEdit && (
                        <details style={{ marginTop: spacing.md }}>
                          <summary style={{ ...btnSecondaryStyle, display: 'inline-block', listStyle: 'none', cursor: 'pointer' }}>
                            + افزودن موجودی
                          </summary>
                          <form action={upsertStockAction} style={formCardStyle}>
                            <input type="hidden" name="warehouseId" value={wh.id} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, alignItems: 'flex-end' }}>
                              <label style={{ ...fieldLabelStyle, flex: '1 1 180px' }}>
                                گرید *
                                <select name="gradeId" required style={inputStyle}>
                                  <option value="">— انتخاب گرید —</option>
                                  {activeGrades.map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.code} ({g.category})
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label style={fieldLabelStyle}>
                                مقدار (تن) *
                                <input name="quantityTon" type="number" step="0.01" required style={{ ...inputStyle, width: 110 }} />
                              </label>
                              <label style={fieldLabelStyle}>
                                قیمت (ریال/کیلو) *
                                <input name="priceRial" type="number" step="1" required style={{ ...inputStyle, width: 110 }} />
                              </label>
                              <label style={fieldLabelStyle}>
                                بچ
                                <input name="batch" style={{ ...inputStyle, width: 110 }} />
                              </label>
                              <button type="submit" style={btnPrimaryStyle}>ذخیره</button>
                            </div>
                          </form>
                        </details>
                      )}
                    </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const formCardStyle: React.CSSProperties = {
  background: colors.bgPage,
  border: `1px solid ${colors.borderSubtle}`,
  borderRadius: radius.md,
  padding: spacing.lg,
  marginTop: spacing.md,
}
const formGridStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing.md,
}
const fieldLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: fontSize.xs,
  fontWeight: 700,
  color: colors.textSecondary,
  flex: '1 1 180px',
  minWidth: 160,
}
const actionLinkStyle: React.CSSProperties = {
  color: colors.navy,
  fontSize: fontSize.xs,
  marginInlineEnd: spacing.sm,
}
const dangerLinkStyle: React.CSSProperties = {
  color: colors.dangerText,
  fontSize: fontSize.xs,
}
const cancelLinkStyle: React.CSSProperties = {
  color: colors.textMuted,
  fontSize: fontSize.xs,
  marginInlineStart: spacing.xs,
}
