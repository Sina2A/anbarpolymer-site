import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/currentUser'
import { updateBenchinoPriceAction, deleteBenchinoPriceAction } from '../../actions'
import { notFound } from 'next/navigation'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

export const dynamic = 'force-dynamic'

export default async function EditBenchinoPage({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser()
  const { id } = await params
  const price = await prisma.globalBenchmarkPrice.findUnique({ where: { id }, include: { grade: true } })
  if (!price) notFound()

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <a href="/admin-pricing?tab=publish&subtab=benchino" style={backLink}>← بازگشت</a>
        <h1 style={h1Style}>ویرایش قیمت مرجع — {price.grade.code}</h1>

        <form action={updateBenchinoPriceAction} style={formCard}>
          <input type="hidden" name="id" value={price.id} />

          <div style={fieldGroup}>
            <label style={labelStyle}>نوع منبع</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <label style={{ fontSize: 13 }}><input type="radio" name="sourceType" value="manual" defaultChecked /> دستی</label>
              <label style={{ fontSize: 13 }}><input type="radio" name="sourceType" value="api" /> API</label>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>قیمت دستی (USD/ton)</label>
            <input type="number" step="0.01" name="manualValue" style={inputStyle} defaultValue={price.priceUsd} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>اسنپشات API (USD/ton)</label>
            <input type="number" step="0.01" name="apiSnapshotValue" style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>برچسب منبع</label>
            <input type="text" name="sourceLabel" style={inputStyle} defaultValue={price.sourceLabel || ''} />
          </div>

          <button type="submit" style={btnStyle}>ذخیره تغییرات</button>
        </form>

        <form action={deleteBenchinoPriceAction} style={deleteFormWrapStyle}>
          <input type="hidden" name="id" value={price.id} />
          <ConfirmSubmitButton message="حذف شود؟" style={btnDeleteStyle}>حذف</ConfirmSubmitButton>
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
const btnStyle = { background: '#1e357b', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }
const btnDeleteStyle = { background: 'transparent', color: '#9b1c1c', border: '1px solid #9b1c1c', borderRadius: 8, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }
const deleteFormWrapStyle: React.CSSProperties = { marginTop: 12 }
