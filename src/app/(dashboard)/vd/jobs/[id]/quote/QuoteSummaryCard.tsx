'use client'

import { fmtBaht } from '@/lib/constants'
import { QuoteTotals } from './types'

interface QuoteSummaryCardProps {
  totals: QuoteTotals
  busy: boolean
  readOnly: boolean
  isSent: boolean
  revise: boolean
  onSubmit: () => void
}

export default function QuoteSummaryCard({
  totals,
  busy,
  readOnly,
  isSent,
  revise,
  onSubmit,
}: QuoteSummaryCardProps) {
  const isZeroTotal = totals.total === 0

  return (
    <div
      className="pcard"
      style={{
        position: 'sticky',
        top: 85,
        padding: '20px 22px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
          สรุปยอดค่าบริการ
        </h3>
        <span style={{ fontSize: 11.5, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 10, color: 'var(--text-2)' }}>
          VAT 7%
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
        <div className="summary-row" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-2)' }}>ค่าอะไหล่และค่าแรง</span>
          <span style={{ fontWeight: 600 }}>{fmtBaht(totals.partsTotal)}</span>
        </div>

        <div className="summary-row" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-2)' }}>ค่าตรวจเช็ค (เปิดเครื่อง)</span>
          <span style={{ fontWeight: 600 }}>
            {totals.openFee === 0 ? '฿0 (ฟรี)' : fmtBaht(totals.openFee)}
          </span>
        </div>

        <div className="summary-row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text)' }}>รวมก่อน VAT</span>
          <span style={{ fontWeight: 600 }}>{fmtBaht(totals.subtotal)}</span>
        </div>

        <div className="summary-row" style={{ padding: '4px 0', borderBottom: '1px dashed var(--border-strong)' }}>
          <span style={{ color: 'var(--text-2)' }}>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
          <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{fmtBaht(totals.vat)}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: 6,
            paddingTop: 10,
            borderTop: '2px solid var(--border-strong)',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>ยอดสุทธิรวมทั้งสิ้น</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>
            {fmtBaht(totals.total)}
          </span>
        </div>
      </div>

      {isZeroTotal && (
        <div
          style={{
            marginTop: 14,
            padding: '8px 12px',
            borderRadius: 6,
            background: 'var(--green-tint)',
            border: '1px solid var(--green)',
            color: '#065f46',
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          ✓ ยอดรวม ฿0 ระบบจะอนุมัติงานและย้ายไปขั้นตอน &quot;กำลังซ่อม&quot; อัตโนมัติ
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        style={{
          marginTop: 18,
          fontSize: 14.5,
          fontWeight: 600,
          padding: '12px 16px',
          boxShadow: '0 2px 6px rgba(200, 16, 46, 0.25)',
        }}
        disabled={busy || readOnly || isSent}
        onClick={onSubmit}
      >
        {busy ? 'กำลังบันทึกและส่ง…' : revise ? 'บันทึกและส่งใบเสนอราคาแก้ไข' : 'ส่งใบเสนอราคา'}
      </button>

      {readOnly && (
        <p className="hint" style={{ marginTop: 10, textAlign: 'center', fontSize: 12 }}>
          🔒 โหมดดูข้อมูลเท่านั้น (Read-only)
        </p>
      )}
    </div>
  )
}
