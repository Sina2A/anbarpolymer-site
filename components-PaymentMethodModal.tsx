'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PaymentContactPanel from '@/components/PaymentContactPanel'

type Props = {
  entityType: 'deal' | 'order'
  entityId: string
  amountLabel: string        // مثلاً "۱۲٬۰۰۰٬۰۰۰ ریال"
  purposeLabel: string       // مثلاً "کارمزد فروش" یا "پرداخت کامل سفارش"
  onSuccess?: () => void
}

type Step = 1 | 2

export default function PaymentMethodModal({
  entityType,
  entityId,
  amountLabel,
  purposeLabel,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() {
    setStep(1)
    setFile(null)
    setError('')
    setDone(false)
    setOpen(true)
  }

  function handleClose() {
    if (loading) return
    setOpen(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(f.type)) {
      setError('فرمت مجاز نیست — فقط JPG، PNG یا PDF')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('حجم فایل بیشتر از ۵ مگابایته')
      return
    }
    setFile(f)
  }

  async function handleSubmit() {
    if (!file) {
      setError('لطفاً رسید پرداخت رو آپلود کن')
      return
    }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('entityType', entityType)
      formData.append('entityId', entityId)
      formData.append('receipt', file)

      const res = await fetch('/api/payment-receipt', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'خطا در ارسال — دوباره امتحان کن')
        return
      }
      setDone(true)
      router.refresh()
      onSuccess?.()
    } catch {
      setError('خطای شبکه — اتصال رو بررسی کن')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={handleOpen} style={triggerBtn}>
        آپلود رسید پرداخت
      </button>

      {open && (
        <div style={overlay} onClick={handleClose}>
          <div style={dialog} onClick={(e) => e.stopPropagation()}>
            {/* هدر */}
            <div style={dialogHeader}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>
                {purposeLabel}
              </span>
              <button onClick={handleClose} style={closeBtn} disabled={loading}>
                ✕
              </button>
            </div>

            {done ? (
              <DoneState onClose={handleClose} />
            ) : step === 1 ? (
              <StepOne
                amountLabel={amountLabel}
                purposeLabel={purposeLabel}
                onNext={() => setStep(2)}
                onClose={handleClose}
              />
            ) : (
              <StepTwo
                file={file}
                error={error}
                loading={loading}
                inputRef={inputRef}
                onFileChange={handleFileChange}
                onSubmit={handleSubmit}
                onBack={() => setStep(1)}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── مرحله ۱: انتخاب روش ─────────────────────────────────────────────────────
function StepOne({
  amountLabel,
  purposeLabel,
  onNext,
  onClose,
}: {
  amountLabel: string
  purposeLabel: string
  onNext: () => void
  onClose: () => void
}) {
  return (
    <div>
      <div style={amountBox}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{purposeLabel}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e' }}>{amountLabel}</div>
      </div>

      <p style={{ fontSize: 13, color: '#4f5560', marginBottom: 16 }}>
        روش پرداخت را انتخاب کنید:
      </p>

      {/* فعلاً فقط انتقال بانکی — درگاه آنلاین بعداً اضافه می‌شه */}
      <button type="button" onClick={onNext} style={methodBtn}>
        <span style={{ fontSize: 18, marginLeft: 10 }}>🏦</span>
        انتقال بانکی (واریز مستقیم)
        <span style={methodArrow}>←</span>
      </button>

      <button type="button" onClick={onClose} style={cancelBtn}>
        انصراف
      </button>
    </div>
  )
}

// ── مرحله ۲: آپلود رسید ──────────────────────────────────────────────────────
function StepTwo({
  file,
  error,
  loading,
  inputRef,
  onFileChange,
  onSubmit,
  onBack,
}: {
  file: File | null
  error: string
  loading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
  onBack: () => void
}) {
  return (
    <div>
      <PaymentContactPanel />

      <p style={{ fontSize: 12.5, color: '#4f5560', marginBottom: 12 }}>
        بعد از واریز، رسید (عکس یا PDF) رو اینجا آپلود کنید تا کارشناس تایید کنه:
      </p>

      {/* ناحیه‌ی آپلود */}
      <div
        style={uploadArea}
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#146c3a' }}>✓ {file.name}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              {(file.size / 1024).toFixed(0)} کیلوبایت — کلیک کن تا عوض کنی
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              کلیک کن یا فایل رو اینجا بکش
            </div>
            <div style={{ fontSize: 11, color: '#9199a3', marginTop: 4 }}>
              JPG، PNG یا PDF — حداکثر ۵ مگابایت
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button type="button" onClick={onBack} style={cancelBtn} disabled={loading}>
          بازگشت
        </button>
        <button
          type="button"
          onClick={onSubmit}
          style={{ ...submitBtn, opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          {loading ? 'در حال ارسال…' : 'ثبت رسید'}
        </button>
      </div>
    </div>
  )
}

// ── وضعیت موفق ───────────────────────────────────────────────────────────────
function DoneState({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>رسید ثبت شد</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        کارشناس حسابداری پرداخت شما رو بررسی و تایید می‌کنه.
      </div>
      <button type="button" onClick={onClose} style={submitBtn}>
        بستن
      </button>
    </div>
  )
}

// ── استایل‌ها ─────────────────────────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}
const dialog: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '20px 24px',
  width: '100%',
  maxWidth: 440,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  fontFamily: "'Vazirmatn', Tahoma, sans-serif",
  direction: 'rtl',
}
const dialogHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
  paddingBottom: 12,
  borderBottom: '1px solid #f1efe8',
}
const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 16,
  cursor: 'pointer',
  color: '#9199a3',
  padding: '2px 6px',
}
const amountBox: React.CSSProperties = {
  background: '#faf8f4',
  border: '1px solid #e8e4db',
  borderRadius: 10,
  padding: '14px 16px',
  marginBottom: 16,
  textAlign: 'center',
}
const methodBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '14px 16px',
  border: '1px solid #d8dde3',
  borderRadius: 10,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13.5,
  fontWeight: 600,
  color: '#1a1a2e',
  marginBottom: 10,
  transition: 'border-color 0.15s',
}
const methodArrow: React.CSSProperties = {
  marginRight: 'auto',
  color: '#9199a3',
  fontSize: 14,
}
const cancelBtn: React.CSSProperties = {
  flex: 1,
  padding: '10px 0',
  border: '1px solid #d8dde3',
  borderRadius: 8,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  color: '#4f5560',
}
const submitBtn: React.CSSProperties = {
  flex: 2,
  padding: '10px 0',
  border: 'none',
  borderRadius: 8,
  background: '#e65716',
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
}
const uploadArea: React.CSSProperties = {
  border: '2px dashed #c5d0dc',
  borderRadius: 10,
  padding: '20px 16px',
  textAlign: 'center',
  cursor: 'pointer',
  background: '#f8fafc',
}
const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#a8241a',
  fontWeight: 700,
  marginTop: 8,
}
const triggerBtn: React.CSSProperties = {
  padding: '9px 18px',
  background: '#e65716',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: "'Vazirmatn', Tahoma, sans-serif",
}
