'use client'

import { fmtBaht } from '@/lib/constants'
import { useBranding } from '@/lib/hooks/useBranding'

export interface QuoteDocData {
  quoteNo: string
  jobNo: string
  customer: string | null
  product: string
  branchName?: string | null
  branchAddress?: string | null
  vendorLabel?: string | null
  logoUrl?: string | null
  companyName?: string | null
  taxId?: string | null
  lines: Array<{ description: string; amount: number; type?: string; partWarrantyDays?: number; partWaitDays?: number }>
  subtotal: number
  vatAmount: number
  total: number
  repairDays: number
  repairWarrantyDays: number
  vendorNote?: string | null
  status?: string
}

/** เอกสารใบเสนอราคา (05 §2.3) — หัว "ศูนย์บริการซ่อมไทวัสดุ" + โลโก้ + ที่อยู่สาขาที่เปิดงาน */
export default function QuoteDoc({ q }: { q: QuoteDocData }) {
  const { branding } = useBranding()
  const logoSrc = q.logoUrl || branding.logoUrl
  const company = q.companyName || branding.companyName
  const taxId = q.taxId || branding.taxId

  return (
    <div className="print-area">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={company}
            style={{ width: 120, height: 'auto', maxHeight: 42, objectFit: 'contain' }}
          />
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>ศูนย์บริการซ่อมไทวัสดุ</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-mute)', margin: '1px 0 0' }}>{company} · เลขผู้เสียภาษี {taxId}</p>
            {(q.branchName || q.branchAddress) && (
              <p style={{ fontSize: 11, color: 'var(--text-mute)', margin: '2px 0 0' }}>
                {[q.branchName, q.branchAddress].filter(Boolean).join(' — ')}
              </p>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'inherit' }}>ใบเสนอราคา</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>Quotation</div>
        </div>
      </div>
      <div className="grid2" style={{ fontSize: 12.5, marginBottom: 10 }}>
        <div><span style={{ color: 'var(--text-2)' }}>เลขที่ใบเสนอราคา:</span> <b>{q.quoteNo}</b></div>
        <div><span style={{ color: 'var(--text-2)' }}>เลขที่ใบแจ้งซ่อม:</span> <b>{q.jobNo}</b></div>
        <div><span style={{ color: 'var(--text-2)' }}>ลูกค้า:</span> {q.customer ?? '-'}</div>
        <div><span style={{ color: 'var(--text-2)' }}>สินค้า:</span> {q.product}</div>
        {q.vendorLabel && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-2)' }}>ศูนย์บริการ:</span> {q.vendorLabel}</div>}
      </div>
      <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '6px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 500 }}>รายการ</th>
            <th style={{ textAlign: 'right', padding: '6px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontWeight: 500 }}>ราคา</th>
          </tr>
        </thead>
        <tbody>
          {q.lines.map((l, i) => (
            <tr key={i}>
              <td style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                {l.description}
                {(l.partWaitDays ?? 0) > 0 && <span className="sub-mute"> · รออะไหล่ {l.partWaitDays} วัน</span>}
                {(l.partWarrantyDays ?? 0) > 0 && <span className="sub-mute"> · รับประกันอะไหล่ {l.partWarrantyDays} วัน</span>}
              </td>
              <td style={{ textAlign: 'right', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>{fmtBaht(l.amount)}</td>
            </tr>
          ))}
          <tr><td style={{ padding: '6px 0', color: 'var(--text-2)' }}>รวมก่อน VAT</td><td style={{ textAlign: 'right' }}>{fmtBaht(q.subtotal)}</td></tr>
          <tr><td style={{ padding: '6px 0', color: 'var(--text-2)' }}>VAT 7%</td><td style={{ textAlign: 'right' }}>{fmtBaht(q.vatAmount)}</td></tr>
          <tr><td style={{ padding: '8px 0', fontWeight: 600 }}>รวมทั้งสิ้น</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtBaht(q.total)}</td></tr>
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 10 }}>
        ระยะเวลาซ่อมโดยประมาณ: {q.repairDays} วัน &nbsp;|&nbsp; รับประกันงานซ่อม: {q.repairWarrantyDays} วัน
      </p>
      {q.vendorNote && <div className="note">หมายเหตุจาก VD: {q.vendorNote}</div>}
    </div>
  )
}
