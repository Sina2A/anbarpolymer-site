import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { updateMarginGuidanceAction, deleteMarginGuidanceAction } from '../../actions'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditMarginPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ confirmDelete?: string }>
}) {
  await getCurrentUser()
  const { id } = await params
  const sp = await searchParams
  const confirmingDelete = sp.confirmDelete === '1'
  const margin = await prisma.marginGuidance.findUnique({ where: { id }, include: { grade: true } })
  if (!margin) notFound()

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <a href="/admin-pricing?tab=margins" style={backLink}>← بازگشت</a>
        <h1 style={h1Style}>ویرایش سطوح حاشیه — {margin.grade.code}</h1>

        <form action={updateMarginGuidanceAction} style={formCard}>
          <input type="hidden" name="id" value={margin.id} />

          <div style={fieldGroup}>
            <label style={labelStyle}>Floor (%) <span style={{ color: '#9b1c1c' }}>*</span></label>
            <input type="number" step="0.01" name="floorPercent" required style={inputStyle} defaultValue={margin.floorPercent} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Target (%) <span style={{ color: '#9b1c1c' }}>*</span></label>
            <input type="number" step="0.01" name="targetPercent" required style={inputStyle} defaultValue={margin.targetPercent} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Stretch (%) <span style={{ color: '#9b1c1c' }}>*</span></label>
            <input type="number" step="0.01" name="stretchPercent" required style={inputStyle} defaultValue={margin.stretchPercent} />
          </div>

          <div style={fieldGroup}>
            <label style={{ fontSize: 13 }}><input type="checkbox" name="isActive" defaultChecked={margin.isActive} /> فعال</label>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="submit" style={btnStyle}>ذخیره تغییرات</button>
            {confirmingDelete ? (
              <>
                <form action={deleteMarginGuidanceAction} style={{ flex: 1 }}>
                  <input type="hidden" name="id" value={margin.id} />
                  <button type="submit" style={btnDeleteStyle}>بله، حذف کن</button>
                </form>
                <a href={`/admin-pricing/margins/${margin.id}`} style={{ fontSize: 12.5, color: '#4f5560' }}>انصراف</a>
              </>
            ) : (
              <a href="?confirmDelete=1" style={{ ...btnDeleteStyle, textDecoration: 'none', textAlign: 'center', display: 'block', flex: 1 }}>حذف</a>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: '#faf8f4', padding: '32px 20px', fontFamily: "'Vazirmatn', Tahoma, sans-serif", direction: 'rtl' as const }
const backLink = { fontSize: 12.5, color: '#1e357b', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }
const h1Style = { fontSize: 20, fontWeight: 800, marginBottom: 24 }
const formCard = { background: '#fff', border: '1px solid #d8dde3', borderRadius: 12, padding: 24 }
const fieldGroup = { marginBottom: 18 }
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 6 }
const inputStyle = { width: '100%', border: '1px solid #d8dde3', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit' }
const btnStyle = { background: '#1e357b', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: 2 }
const btnDeleteStyle = { background: 'transparent', color: '#9b1c1c', border: '1px solid #9b1c1c', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }
