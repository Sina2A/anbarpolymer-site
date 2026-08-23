'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  listing: any
  kycLevel: number
  isGuest: boolean
}

export default function ListingDetailModal({ listing, kycLevel, isGuest }: Props) {
  const [open, setOpen] = useState(false)

  const statusBg = listing.validityStatus === 'active' ? '#d1fae5' : '#fef3c7'
  const statusColor = listing.validityStatus === 'active' ? '#065f46' : '#92400e'
  const statusLabel = listing.validityStatus === 'active' ? 'آزاد' : 'در حال معامله'

  return (
    <>
      {/* ── Table row — clicking anywhere (except buttons) opens the modal ── */}
      <tr style={rowStyle} onClick={() => setOpen(true)} className="market-row">
        <td>{new Date(listing.createdAt).toLocaleDateString('fa-IR')}</td>
        <td>{listing.grade.category}</td>
        <td>{listing.grade.producer}</td>
        <td style={{ fontFamily: 'monospace' }}>{listing.grade.code}</td>
        <td style={{ fontFamily: 'monospace' }}>{listing.grade.mfi ?? '—'}</td>
        <td>{listing.grade.applicationType ?? '—'}</td>
        <td>
          <span style={{ fontWeight: 700 }}>{listing.quantityTon}</span> تن
        </td>
        <td style={{ fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
          {listing.askingPriceToman.toLocaleString('fa-IR')} تومان/کیلو
        </td>
        <td>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: statusBg,
              color: statusColor,
              borderRadius: 6,
              padding: '4px 10px',
              display: 'inline-block',
            }}
          >
            {statusLabel}
          </span>
        </td>
        <td style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Buy button — gated by user level. stopPropagation so it doesn't also open the modal */}
            {isGuest ? (
              <a href="/signup" style={btnDisabledStyle} onClick={(e) => e.stopPropagation()}>
                عضو شوید
              </a>
            ) : kycLevel < 1 ? (
              <a href="/verification" style={btnDisabledStyle} onClick={(e) => e.stopPropagation()}>
                احراز هویت
              </a>
            ) : (
              <span style={btnDisabledStyle} title="صفحه‌ی شروع معامله به‌زودی" onClick={(e) => e.stopPropagation()}>
                به‌زودی
              </span>
            )}
            {/* Info icon — «نمایش اطلاعات بار» */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpen(true)
              }}
              style={iconButtonStyle}
              title="نمایش اطلاعات بار"
              aria-label="نمایش اطلاعات بار"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 11V7.5" strokeLinecap="round" />
                <path d="M8 5.2h.01" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* ── Overlay + Dialog — portaled to <body> so it isn't nested inside <tbody> ── */}
      {open &&
        createPortal(
          <ListingDetailDialog
            listing={listing}
            kycLevel={kycLevel}
            isGuest={isGuest}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </>
  )
}

// Rendered via createPortal into <body> (see above) so the fixed overlay is not
// an invalid <div> child of <tbody>. Only mounts after a client-side click.
function ListingDetailDialog({
  listing,
  kycLevel,
  isGuest,
  onClose,
}: {
  listing: any
  kycLevel: number
  isGuest: boolean
  onClose: () => void
}) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: 11, color: '#9199a3', fontFamily: 'monospace', marginBottom: 4 }}>
              #{listing.id.slice(0, 8)}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#1b1e24' }}>
              {listing.grade.code} — {listing.grade.producer}
            </h3>
          </div>
          <button onClick={onClose} style={closeButtonStyle} aria-label="بستن">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          <div style={detailRowStyle}>
            <span style={labelStyle}>تاریخ ثبت</span>
            <span style={valueStyle}>{new Date(listing.createdAt).toLocaleDateString('fa-IR')}</span>
          </div>

          {listing.grade.datasheetUrl && (
            <div style={detailRowStyle}>
              <span style={labelStyle}>دیتاشیت فنی</span>
              <a href={listing.grade.datasheetUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                مشاهده PDF ←
              </a>
            </div>
          )}

          <div style={detailRowStyle}>
            <span style={labelStyle}>نوع ماده</span>
            <span style={valueStyle}>{listing.grade.category}</span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>کد گرید</span>
            <span style={{ ...valueStyle, fontFamily: 'monospace' }}>{listing.grade.code}</span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>MFI</span>
            <span style={{ ...valueStyle, fontFamily: 'monospace', direction: 'ltr' }}>
              {listing.grade.mfi ?? '—'}
              {listing.grade.mfiTestCondition ? ` (${listing.grade.mfiTestCondition})` : ''}
            </span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>تولیدکننده</span>
            <span style={valueStyle}>{listing.grade.producer}</span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>کشور مبدأ</span>
            <span style={valueStyle}>{listing.grade.originCountry === 'IR' ? 'ایران' : listing.grade.originCountry}</span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>کاربرد</span>
            <span style={valueStyle}>{listing.grade.applicationType ?? '—'}</span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>نوع بسته‌بندی</span>
            <span style={valueStyle}>{listing.packagingType}</span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>کیفیت بسته‌بندی / مواد</span>
            <span style={valueStyle}>{listing.packagingQuality} / {listing.materialQuality}</span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>محل بار</span>
            <span style={valueStyle}>{listing.city}، {listing.province}</span>
          </div>

          <div style={detailRowStyle}>
            <span style={labelStyle}>مقدار</span>
            <span style={valueStyle}>
              <b>{listing.quantityTon}</b> تن
            </span>
          </div>

          {/* Price — visible to everyone, including guests */}
          <div style={priceRowStyle}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1b1e24' }}>قیمت درخواستی</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#e65716', fontFamily: 'monospace', direction: 'ltr' }}>
              {listing.askingPriceToman.toLocaleString('fa-IR')} تومان/کیلو
            </span>
          </div>
        </div>

        {/* Footer — only the buy action is gated */}
        <div style={footerStyle}>
          {isGuest ? (
            <a href="/signup" style={buyButtonStyle}>
              برای خرید عضو شوید
            </a>
          ) : kycLevel < 1 ? (
            <a href="/verification" style={buyButtonStyle}>
              برای خرید احراز هویت کنید
            </a>
          ) : (
            <span
              style={{ ...buyButtonStyle, background: '#f7f8fa', color: '#6f7680', border: '1px solid #d8dde3', cursor: 'default' }}
              title="صفحه‌ی شروع معامله به‌زودی"
            >
              خرید — به‌زودی
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Styles ──
const rowStyle: React.CSSProperties = {
  borderTop: '1px solid #eceff3',
  transition: 'background .15s',
  cursor: 'pointer',
}
const btnDisabledStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #d8dde3',
  background: '#f7f8fa',
  color: '#6f7680',
  textDecoration: 'none',
  cursor: 'default',
  whiteSpace: 'nowrap',
}
const iconButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  padding: 0,
  borderRadius: 6,
  border: '1px solid #d8dde3',
  background: '#fff',
  color: '#1e357b',
  cursor: 'pointer',
  flexShrink: 0,
}
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}
const dialogStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '20px 24px',
  width: '100%',
  maxWidth: 460,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  fontFamily: "'Vazirmatn', Tahoma, sans-serif",
  direction: 'rtl',
}
const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 16,
  paddingBottom: 14,
  borderBottom: '1px solid #f1efe8',
}
const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#9199a3',
  cursor: 'pointer',
  padding: 4,
  display: 'flex',
  flexShrink: 0,
}
const bodyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
}
const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: '9px 0',
  borderBottom: '1px solid #f4f5f7',
  fontSize: 13,
}
const priceRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  background: '#fff4ee',
  margin: '8px -24px -4px',
  padding: '14px 24px',
}
const labelStyle: React.CSSProperties = {
  color: '#6f7680',
  flexShrink: 0,
}
const valueStyle: React.CSSProperties = {
  color: '#1b1e24',
  fontWeight: 600,
  textAlign: 'left',
}
const linkStyle: React.CSSProperties = {
  color: '#e65716',
  fontWeight: 700,
  textDecoration: 'underline',
  fontSize: 12.5,
}
const footerStyle: React.CSSProperties = {
  marginTop: 18,
  paddingTop: 16,
  borderTop: '1px solid #f1efe8',
}
const buyButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'center',
  background: '#1e357b',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '13px 0',
  fontSize: 14,
  fontWeight: 800,
  textDecoration: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
