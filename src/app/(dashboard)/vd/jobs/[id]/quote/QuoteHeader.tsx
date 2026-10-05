'use client'

interface QuoteHeaderProps {
  jobNo: string
  productName: string
  brandName?: string | null
  symptom?: string | null
  revise: boolean
  onBack: () => void
}

export default function QuoteHeader({
  jobNo,
  productName,
  brandName,
  symptom,
  revise,
  onBack,
}: QuoteHeaderProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: -20,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <button
        type="button"
        className="btn"
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
      >
        <span>←</span>
        <span>กลับไปหน้ารายการ</span>
      </button>

      <div style={{ textAlign: 'center', flex: 1, padding: '0 16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {revise ? 'แก้ไขใบเสนอราคา' : 'ประเมิน + เสนอราคา'}
          </span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--red-tint)',
              color: 'var(--red-dark)',
              border: '1px solid var(--red)',
            }}
          >
            {jobNo}
          </span>
        </div>
        <p
          style={{
            margin: '3px 0 0',
            fontSize: 12.5,
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>{productName}</span>
          {brandName && (
            <>
              <span>•</span>
              <span style={{ fontWeight: 500 }}>{brandName}</span>
            </>
          )}
          {symptom && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--coral)', fontWeight: 500 }}>
                อาการ: {symptom}
              </span>
            </>
          )}
        </p>
      </div>

      <div style={{ minWidth: 100 }} />
    </div>
  )
}
