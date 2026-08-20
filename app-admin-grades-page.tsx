// پنل مدیریت گریدها — نسخه‌ی کامل
//
// نسبت به نسخه‌ی قبلی این‌ها اضافه شده:
//  ۱. فرم ویرایش گرید موجود (updateGradeAction از قبل بود ولی هیچ UI ای نداشت)
//  ۲. جست‌وجو و فیلتر روی جدول (کد/تولیدکننده/نوع، وضعیت، منشا)
//  ۳. ویجت مشخصات فنی ۷۲تایی داخل هر دو فرم (جدید و ویرایش)
//  ۴. MFI و چگالی اجباری (required در UI + اعتبارسنجی سمت سرور)
//  ۵. آپلود عکس محصول و دیتاشیت PDF + حذفشون
//  ۶. ایمپورت انبوه CSV با گزارش نتیجه
//
// فیلتر روی سرور انجام می‌شه (searchParams) نه روی کلاینت، چون تعداد گریدها
// می‌تونه زیاد بشه و نمی‌خوایم همه‌شون رو به مرورگر بفرستیم.

import prisma from '@/lib/prisma'
import { getAllSectionAccess } from '@/lib/permissions'
import { getCurrentUser } from '@/lib/currentUser'
import {
  createGradeAction,
  updateGradeAction,
  toggleGradeActiveAction,
  uploadGradeImageAction,
  uploadGradeDatasheetAction,
  clearGradeMediaAction,
  importGradesCsvAction,
} from './actions'
import AdminNav, { PartialAccessBanner } from '@/components/AdminNav'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'
import GradeSpecPicker from '@/components/GradeSpecPicker'
import { parseSpecs, SPEC_FIELD_BY_KEY, CSV_ALL_COLUMNS } from '@/lib/gradeSpecs'

export const dynamic = 'force-dynamic'

const CATEGORY_OPTIONS = ['پلی‌پروپیلن', 'پلی‌اتیلن', 'پی‌وی‌سی', 'پلی‌اتیلن ترفتالات', 'پلی‌استایرن', 'ABS', 'پلی‌استایرن انبساطی', 'سایر']
const POLYMER_FAMILY_OPTIONS = ['PP', 'HDPE', 'LDPE', 'LLDPE', 'PVC', 'PET', 'PS', 'EPS', 'ABS', 'سایر']
const APPLICATION_OPTIONS = ['تزریقی (Injection)', 'اکستروژن (Extrusion)', 'بادی (Blow Molding)', 'فیلم (Film)', 'الیاف/رشته‌ای (Fiber/Raffia)', 'لوله (Pipe)', 'مستربچ (Masterbatch)', 'سایر']

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

export default async function AdminGradesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const q = one(sp.q).trim()
  const statusFilter = one(sp.status)      // '' | 'active' | 'inactive'
  const originFilter = one(sp.origin)      // '' | 'IR' | 'foreign'
  const categoryFilter = one(sp.category)
  const editId = one(sp.edit)

  const importedCount = one(sp.imported)
  const updatedCount = one(sp.updated)
  const skippedCount = one(sp.skipped)
  const skipReasons = one(sp.reasons)
  const mediaMsg = one(sp.media)

  const currentUser = await getCurrentUser()
  const isAdmin = currentUser.role === 'admin'
  const myAccess = isAdmin ? null : await getAllSectionAccess(currentUser.id)
  const access = isAdmin ? 'full' : myAccess?.grades ?? 'none'

  if (access === 'none') {
    return (
      <div style={{ display: 'flex', gap: 24, padding: '32px 24px', fontFamily: "'Vazirmatn', Tahoma, sans-serif", direction: 'rtl', maxWidth: 1100, margin: '0 auto' }}>
        <AdminNav currentUserName={currentUser.companyName} isAdmin={isAdmin} accessMap={myAccess || {}} activeSection="grades" />
        <div style={{ flex: 1 }}>دسترسی به این بخش نداری — از مدیر بخواه دسترسیت رو تنظیم کنه.</div>
      </div>
    )
  }

  const canEdit = access === 'edit' || access === 'full'

  // --- فیلترها روی دیتابیس اعمال می‌شن، نه توی مرورگر
  const where: any = {}
  if (q) {
    where.OR = [
      { code: { contains: q, mode: 'insensitive' } },
      { producer: { contains: q, mode: 'insensitive' } },
      { category: { contains: q, mode: 'insensitive' } },
      { polymerFamily: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (statusFilter === 'active') where.isActive = true
  if (statusFilter === 'inactive') where.isActive = false
  if (originFilter === 'IR') where.originCountry = 'IR'
  if (originFilter === 'foreign') where.originCountry = { not: 'IR' }
  if (categoryFilter) where.category = categoryFilter

  const [grades, totalCount] = await Promise.all([
    prisma.grade.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { producer: 'asc' }, { code: 'asc' }],
      include: { _count: { select: { materialListings: true, orderItems: true } } },
    }),
    prisma.grade.count(),
  ])

  const editingGrade = editId ? await prisma.grade.findUnique({ where: { id: editId } }) : null
  const hasFilter = Boolean(q || statusFilter || originFilter || categoryFilter)

  return (
    <div style={{ display: 'flex', gap: 24, padding: '32px 24px', fontFamily: "'Vazirmatn', Tahoma, sans-serif", direction: 'rtl', maxWidth: 1200, margin: '0 auto' }}>
      <AdminNav currentUserName={currentUser.companyName} isAdmin={isAdmin} accessMap={myAccess || {}} activeSection="grades" />

      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>مدیریت گریدها و مشخصات فنی</h1>
        <p style={{ color: '#6f7680', fontSize: 13.5, marginBottom: 20, lineHeight: 1.9 }}>
          این کاتالوگ داخلی سایته — وقتی فروشنده آگهی ثبت می‌کنه یا خریدار سفارش می‌ده، اسم محصول از همین لیست انتخاب می‌شه،
          نه با تایپ آزاد. مجموعاً {totalCount} گرید ثبت شده
          {hasFilter && ` — ${grades.length} مورد با فیلتر فعلی`}.
        </p>
        {access !== 'full' && <PartialAccessBanner level={access} sectionLabel="مدیریت گریدها" />}

        {/* ---------- بنر نتیجه‌ی ایمپورت ---------- */}
        {(importedCount || updatedCount || skippedCount) && (
          <div style={{ ...bannerStyle, background: '#eef7f1', borderColor: '#bfe0cc' }}>
            <strong>نتیجه‌ی ورود گروهی:</strong>{' '}
            {importedCount || 0} گرید جدید اضافه شد، {updatedCount || 0} گرید به‌روزرسانی شد
            {Number(skippedCount) > 0 && `، ${skippedCount} خط رد شد`}.
            {skipReasons && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#8a5a00', background: '#fff8e6', padding: 8, borderRadius: 6, lineHeight: 2 }}>
                دلیل رد شدن: {skipReasons}
              </div>
            )}
          </div>
        )}
        {mediaMsg && (
          <div style={{ ...bannerStyle, background: '#eef2fb', borderColor: '#c9d5f0' }}>
            {mediaMsg === 'image' && 'تصویر محصول ذخیره شد.'}
            {mediaMsg === 'datasheet' && 'دیتاشیت فنی ذخیره شد.'}
            {mediaMsg === 'cleared' && 'فایل حذف شد.'}
          </div>
        )}

        {/* ---------- فرم ویرایش (فقط وقتی ?edit=... توی آدرسه) ---------- */}
        {canEdit && editingGrade && (
          <div style={{ ...cardStyle, borderColor: '#1e357b', borderWidth: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, margin: 0 }}>
                ویرایش گرید <span style={{ fontFamily: 'monospace', color: '#1e357b' }}>{editingGrade.code}</span>
              </h3>
              <a href="/admin-grades" style={{ fontSize: 12.5, color: '#9b1c1c', textDecoration: 'none' }}>انصراف ✕</a>
            </div>

            <form action={updateGradeAction}>
              <input type="hidden" name="id" value={editingGrade.id} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input name="code" defaultValue={editingGrade.code} placeholder="کد گرید *" required style={inputStyle} />
                <input name="producer" defaultValue={editingGrade.producer} placeholder="تولیدکننده *" required style={inputStyle} />

                <select name="category" required style={inputStyle} defaultValue={editingGrade.category}>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="polymerFamily" style={inputStyle} defaultValue={editingGrade.polymerFamily ?? ''}>
                  <option value="">خانواده‌ی پلیمر (فنی، اختیاری)</option>
                  {POLYMER_FAMILY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select name="applicationType" style={inputStyle} defaultValue={editingGrade.applicationType ?? ''}>
                  <option value="">نوع کاربرد (اختیاری)</option>
                  {APPLICATION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="originCountry" style={inputStyle} defaultValue={editingGrade.originCountry}>
                  <option value="IR">تولید داخلی (ایران)</option>
                  <option value="foreign">وارداتی (خارجی)</option>
                </select>

                <input name="mfi" type="number" step="0.01" required defaultValue={editingGrade.mfi ?? ''} placeholder="MFI (g/10min) *" style={inputStyle} />
                <input name="mfiTestCondition" defaultValue={editingGrade.mfiTestCondition ?? ''} placeholder="شرط تست MFI (مثلاً 230°C/2.16kg)" style={inputStyle} />

                <input name="density" type="number" step="0.001" required defaultValue={editingGrade.density ?? ''} placeholder="چگالی (g/cm³) *" style={inputStyle} />
                <input name="packagingType" defaultValue={editingGrade.packagingType ?? ''} placeholder="نوع بسته‌بندی" style={inputStyle} />

                <textarea name="description" defaultValue={editingGrade.description ?? ''} placeholder="توضیحات آزاد" rows={2} style={{ ...inputStyle, gridColumn: '1 / -1', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              <GradeSpecPicker initialValues={parseSpecs(editingGrade.specsJson)} defaultOpen />

              <button type="submit" style={{ ...btnStyle, width: '100%', marginTop: 14 }}>ذخیره‌ی تغییرات</button>
            </form>

            {/* ---------- آپلود رسانه — جدا از فرم اصلی، چون فرم تودرتو غیرمجازه ---------- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px dashed #d8dde3' }}>
              <div>
                <div style={mediaLabelStyle}>تصویر محصول</div>
                {editingGrade.imageUrl ? (
                  <div style={{ marginBottom: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editingGrade.imageUrl} alt={editingGrade.code} style={{ maxWidth: 120, maxHeight: 90, borderRadius: 6, border: '1px solid #e5e5e5', display: 'block', marginBottom: 6 }} />
                    <form action={clearGradeMediaAction}>
                      <input type="hidden" name="id" value={editingGrade.id} />
                      <input type="hidden" name="kind" value="image" />
                      <ConfirmSubmitButton message="تصویر این گرید حذف بشه؟" style={linkBtnStyle}>حذف تصویر</ConfirmSubmitButton>
                    </form>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#9199a3', marginBottom: 8 }}>تصویری ثبت نشده.</div>
                )}
                <form action={uploadGradeImageAction}>
                  <input type="hidden" name="id" value={editingGrade.id} />
                  <input type="hidden" name="code" value={editingGrade.code} />
                  <input type="file" name="imageFile" accept="image/*" required style={fileInputStyle} />
                  <button type="submit" style={smallBtnStyle}>آپلود تصویر</button>
                </form>
              </div>

              <div>
                <div style={mediaLabelStyle}>دیتاشیت فنی (PDF)</div>
                {editingGrade.datasheetUrl ? (
                  <div style={{ marginBottom: 8 }}>
                    <a href={editingGrade.datasheetUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: '#1e357b' }}>مشاهده‌ی دیتاشیت فعلی ↗</a>
                    <form action={clearGradeMediaAction} style={{ marginTop: 6 }}>
                      <input type="hidden" name="id" value={editingGrade.id} />
                      <input type="hidden" name="kind" value="datasheet" />
                      <ConfirmSubmitButton message="دیتاشیت این گرید حذف بشه؟" style={linkBtnStyle}>حذف دیتاشیت</ConfirmSubmitButton>
                    </form>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#9199a3', marginBottom: 8 }}>دیتاشیتی ثبت نشده.</div>
                )}
                <form action={uploadGradeDatasheetAction}>
                  <input type="hidden" name="id" value={editingGrade.id} />
                  <input type="hidden" name="code" value={editingGrade.code} />
                  <input type="file" name="datasheetFile" accept="application/pdf" required style={fileInputStyle} />
                  <button type="submit" style={smallBtnStyle}>آپلود دیتاشیت</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ---------- فرم افزودن ---------- */}
        {canEdit && !editingGrade && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>افزودن گرید جدید</h3>
            <form action={createGradeAction}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input name="code" placeholder="کد گرید (مثلاً PP H110MA) *" required style={inputStyle} />
                <input name="producer" placeholder="تولیدکننده *" required style={inputStyle} />

                <select name="category" required style={inputStyle} defaultValue="">
                  <option value="" disabled>نوع ماده (دسته‌ی نمایشی) *</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="polymerFamily" style={inputStyle} defaultValue="">
                  <option value="">خانواده‌ی پلیمر (فنی، اختیاری)</option>
                  {POLYMER_FAMILY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <select name="applicationType" style={inputStyle} defaultValue="">
                  <option value="">نوع کاربرد (اختیاری)</option>
                  {APPLICATION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="originCountry" style={inputStyle} defaultValue="IR">
                  <option value="IR">تولید داخلی (ایران)</option>
                  <option value="foreign">وارداتی (خارجی)</option>
                </select>

                <input name="mfi" type="number" step="0.01" required placeholder="MFI — شاخص جریان ذوب (g/10min) *" style={inputStyle} />
                <input name="mfiTestCondition" placeholder="شرط تست MFI (مثلاً 230°C/2.16kg)" style={inputStyle} />

                <input name="density" type="number" step="0.001" required placeholder="چگالی/دانسیته (g/cm³) *" style={inputStyle} />
                <input name="packagingType" placeholder="نوع بسته‌بندی (مثلاً کیسه ۲۵کیلویی)" style={inputStyle} />

                <textarea name="description" placeholder="توضیحات آزاد (کاربرد خاص، نکات فنی، و غیره)" rows={2} style={{ ...inputStyle, gridColumn: '1 / -1', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              <GradeSpecPicker />

              <button type="submit" style={{ ...btnStyle, width: '100%', marginTop: 14 }}>افزودن گرید</button>
            </form>
            <p style={{ fontSize: 11.5, color: '#9199a3', marginTop: 10, lineHeight: 1.9 }}>
              تصویر محصول و دیتاشیت بعد از ساخت گرید و از طریق دکمه‌ی «ویرایش» آپلود می‌شن.
            </p>
          </div>
        )}

        {/* ---------- ورود گروهی از فایل ---------- */}
        {canEdit && (
          <details style={cardStyle}>
            <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>ورود گروهی گریدها از فایل (Excel/CSV)</summary>
            <p style={{ fontSize: 12.5, color: '#6f7680', margin: '12px 0', lineHeight: 2 }}>
              فایل اکسل خودت رو با «Save As → CSV UTF-8» ذخیره کن و اینجا آپلود کن.
              ستون <code style={codeStyle}>code</code> اجباریه — اگه گریدی با اون کد وجود داشته باشه <strong>به‌روزرسانی</strong> می‌شه،
              وگرنه <strong>ساخته</strong> می‌شه. برای گرید جدید، ستون‌های <code style={codeStyle}>producer</code>،{' '}
              <code style={codeStyle}>category</code>، <code style={codeStyle}>mfi</code> و <code style={codeStyle}>density</code> هم لازمن.
              سلول خالی یعنی «دست نزن» — با فایل نمی‌شه مقداری رو پاک کرد.
              علاوه بر ستون‌های پایه، هر کدوم از {CSV_ALL_COLUMNS.length - 11} مشخصه‌ی فنی رو می‌تونی به‌عنوان ستون اضافه کنی
              (با همون نام انگلیسی، مثل <code style={codeStyle}>tensileStrengthYield</code>).
            </p>
            <details style={{ marginBottom: 12 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12.5, color: '#1e357b' }}>نمایش همه‌ی نام ستون‌های مجاز</summary>
              <div style={{ fontSize: 11, color: '#6f7680', marginTop: 8, lineHeight: 2.2, fontFamily: 'monospace', direction: 'ltr', textAlign: 'left', maxHeight: 200, overflow: 'auto', background: '#f7f8fa', padding: 10, borderRadius: 6 }}>
                {CSV_ALL_COLUMNS.join(', ')}
              </div>
            </details>
            <form action={importGradesCsvAction} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" name="csvFile" accept=".csv,text/csv" required style={fileInputStyle} />
              <button type="submit" style={btnStyle}>شروع ورود گروهی</button>
            </form>
          </details>
        )}

        {/* ---------- جست‌وجو و فیلتر ---------- */}
        <form method="get" style={{ ...cardStyle, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
          <input name="q" defaultValue={q} placeholder="جست‌وجو در کد، تولیدکننده، نوع ماده…" style={inputStyle} />
          <select name="category" defaultValue={categoryFilter} style={inputStyle}>
            <option value="">همه‌ی نوع‌ها</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="status" defaultValue={statusFilter} style={inputStyle}>
            <option value="">فعال و غیرفعال</option>
            <option value="active">فقط فعال</option>
            <option value="inactive">فقط غیرفعال</option>
          </select>
          <select name="origin" defaultValue={originFilter} style={inputStyle}>
            <option value="">داخلی و وارداتی</option>
            <option value="IR">فقط داخلی</option>
            <option value="foreign">فقط وارداتی</option>
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" style={btnStyle}>اعمال</button>
            {hasFilter && <a href="/admin-grades" style={{ ...btnStyle, background: '#eceff3', color: '#4a5160', textDecoration: 'none', display: 'inline-block' }}>پاک</a>}
          </div>
        </form>

        {/* ---------- جدول ---------- */}
        <div style={{ border: '1px solid #d8dde3', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7f8fa', color: '#6f7680', textAlign: 'right' }}>
                <th style={thStyle}>کد گرید</th>
                <th style={thStyle}>تولیدکننده</th>
                <th style={thStyle}>نوع ماده</th>
                <th style={thStyle}>MFI</th>
                <th style={thStyle}>چگالی</th>
                <th style={thStyle}>مشخصات فنی</th>
                <th style={thStyle}>فایل‌ها</th>
                <th style={thStyle}>منشا</th>
                <th style={thStyle}>استفاده‌شده در</th>
                <th style={thStyle}>وضعیت</th>
                {canEdit && <th style={thStyle}></th>}
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9199a3', padding: 24 }}>
                    {hasFilter ? 'با این فیلترها گریدی پیدا نشد.' : 'هنوز هیچ گریدی ثبت نشده.'}
                  </td>
                </tr>
              ) : grades.map((g) => (
                <GradeRow key={g.id} grade={g} canEdit={canEdit} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function GradeRow({ grade: g, canEdit }: { grade: any; canEdit: boolean }) {
  const usageCount = g._count.materialListings + g._count.orderItems
  const specs = parseSpecs(g.specsJson)
  const specKeys = Object.keys(specs)

  return (
    <tr style={{ borderTop: '1px solid #eceff3', opacity: g.isActive ? 1 : 0.5 }}>
      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700 }}>{g.code}</td>
      <td style={tdStyle}>{g.producer}</td>
      <td style={tdStyle}>{g.category}{g.polymerFamily && <span style={{ color: '#9199a3' }}> ({g.polymerFamily})</span>}</td>
      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{g.mfi ?? '—'}</td>
      <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{g.density ?? '—'}</td>
      <td style={tdStyle}>
        {specKeys.length === 0 ? (
          <span style={{ color: '#c3c8d0' }}>—</span>
        ) : (
          <span
            title={specKeys.map((k) => `${SPEC_FIELD_BY_KEY[k]?.label ?? k}: ${specs[k]}`).join('\n')}
            style={{ fontSize: 11, fontWeight: 700, color: '#146c3a', background: '#eef7f1', padding: '2px 8px', borderRadius: 999, cursor: 'help' }}
          >
            {specKeys.length} مورد
          </span>
        )}
      </td>
      <td style={tdStyle}>
        <span style={{ display: 'inline-flex', gap: 6 }}>
          <span title={g.imageUrl ? 'تصویر دارد' : 'بدون تصویر'} style={{ fontSize: 11, color: g.imageUrl ? '#146c3a' : '#c3c8d0' }}>
            {g.imageUrl ? 'تصویر' : '—'}
          </span>
          {g.datasheetUrl ? (
            <a href={g.datasheetUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1e357b' }}>دیتاشیت</a>
          ) : null}
        </span>
      </td>
      <td style={tdStyle}>{g.originCountry === 'IR' ? 'داخلی' : 'وارداتی'}</td>
      <td style={tdStyle}>{usageCount > 0 ? `${usageCount} مورد` : '—'}</td>
      <td style={tdStyle}>
        <span style={{ fontSize: 11, fontWeight: 700, color: g.isActive ? '#146c3a' : '#9199a3' }}>
          {g.isActive ? 'فعال' : 'غیرفعال'}
        </span>
      </td>
      {canEdit && (
        <td style={tdStyle}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href={`/admin-grades?edit=${g.id}`} style={{ fontSize: 11.5, fontWeight: 700, color: '#1e357b', textDecoration: 'none' }}>ویرایش</a>
            <form action={toggleGradeActiveAction}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="value" value={(!g.isActive).toString()} />
              <ConfirmSubmitButton
                message={g.isActive
                  ? `«${g.code}» غیرفعال بشه؟ ${usageCount > 0 ? `توجه: ${usageCount} رکورد بهش ارجاع دارن، ولی حذف نمی‌شه، فقط از لیست انتخاب جدید خارج می‌شه.` : ''}`
                  : `«${g.code}» دوباره فعال بشه؟`}
                style={{ background: 'none', border: 'none', color: g.isActive ? '#9b1c1c' : '#146c3a', fontSize: 11.5, cursor: 'pointer', fontWeight: 700, padding: 0 }}
              >
                {g.isActive ? 'غیرفعال کن' : 'فعال کن'}
              </ConfirmSubmitButton>
            </form>
          </div>
        </td>
      )}
    </tr>
  )
}

const cardStyle: React.CSSProperties = { border: '1px solid #d8dde3', borderRadius: 12, padding: 20, marginBottom: 20, background: '#fff', boxShadow: '0 1px 4px rgba(27,30,36,.05)' }
const inputStyle: React.CSSProperties = { border: '1px solid #d8dde3', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }
const btnStyle: React.CSSProperties = { background: '#1e357b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const smallBtnStyle: React.CSSProperties = { background: '#1e357b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6 }
const linkBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#9b1c1c', fontSize: 11.5, cursor: 'pointer', fontWeight: 700, padding: 0 }
const fileInputStyle: React.CSSProperties = { fontSize: 12, fontFamily: 'inherit', display: 'block' }
const mediaLabelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#333' }
const bannerStyle: React.CSSProperties = { border: '1px solid', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, lineHeight: 1.9 }
const codeStyle: React.CSSProperties = { background: '#f0f2f5', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11.5, direction: 'ltr', display: 'inline-block' }
const thStyle: React.CSSProperties = { padding: '10px 12px', fontWeight: 700 }
const tdStyle: React.CSSProperties = { padding: '9px 12px', verticalAlign: 'middle' }
