'use client'

import { useEffect, useRef } from 'react'
import { logoutAction } from '@/app/logout/actions'

// ناوبری مخصوص نقش «مدیر شرکت حمل‌ونقل» — جدا از UserNav (کاربر عادی) و AdminNav (مدیر سایت).
// عمداً فقط دو آیتم داره؛ الگوی بصری و رفتار دراپ‌دون موبایل عیناً از UserNav گرفته شده
// (همون کلاس‌های CSS: .user-nav / .user-nav-toggle / .user-nav-body).
export default function LogisticsNav({
  currentUserName,
  activeSection,
}: {
  currentUserName: string
  activeSection?: string
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const handleResize = () => {
      if (detailsRef.current) {
        detailsRef.current.open = window.innerWidth >= 900
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const items = [
    { key: 'current', label: 'حمل‌ونقل‌های جاری', href: '/transport-panel/current' },
    { key: 'history', label: 'حمل‌ونقل‌های گذشته', href: '/transport-panel/history' },
  ]

  const activeLabel = items.find((i) => i.key === activeSection)?.label ?? 'پنل حمل‌ونقل'

  return (
    <details className="user-nav" ref={detailsRef}>
      <summary className="user-nav-toggle">
        <span>☰ {activeLabel}</span>
        <span className="user-nav-caret">▾</span>
      </summary>

      <div className="user-nav-body">
        <div
          style={{
            paddingBottom: 12,
            marginBottom: 10,
            borderBottom: '1px solid #eceff3',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {currentUserName}
          <span
            style={{
              fontSize: 9.5,
              fontFamily: 'monospace',
              background: '#eef4fd',
              color: '#1e357b',
              borderRadius: 4,
              padding: '1px 6px',
              marginRight: 6,
            }}
          >
            یوزر لجیستیک
          </span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map((item) => (
            <a
              key={item.key}
              href={item.href}
              style={{
                display: 'block',
                padding: '9px 8px',
                borderRadius: 6,
                fontSize: 13,
                textDecoration: 'none',
                color: item.key === activeSection ? '#e65716' : '#4f5560',
                background: item.key === activeSection ? '#fff4ee' : 'transparent',
                fontWeight: item.key === activeSection ? 700 : 400,
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ── خروج از حساب — پایین‌ترین آیتم، جدا از بقیه با خط جداکننده ── */}
        <div style={logoutDividerStyle} />
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 8px',
              borderRadius: 6,
              fontSize: 13,
              textDecoration: 'none',
              color: '#9b1c1c',
              background: 'transparent',
              border: 'none',
              textAlign: 'right',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            خروج از حساب
          </button>
        </form>
      </div>
    </details>
  )
}

const logoutDividerStyle: React.CSSProperties = { height: 1, background: '#eceff3', margin: '10px 0' }
