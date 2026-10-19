'use client'

import QrImage from '@/components/ui/QrImage'
import { absUrl } from '@/lib/client'
import { fmtBahtDecimal } from '@/lib/constants'
import type { QuotationFinancials } from '@/lib/quotation-format'
import QuoteSignatureSection, { type QuoteSignatureData } from './QuoteSignatureSection'

export interface QuotePricingAndFooterProps {
  jobNo: string
  fin: QuotationFinancials
  validUntilText: string
  repairWarrantyDays: number
  quoteUrl?: string | null
  signatures: QuoteSignatureData
}

export default function QuotePricingAndFooter({
  jobNo,
  fin,
  validUntilText,
  repairWarrantyDays,
  quoteUrl,
  signatures,
}: QuotePricingAndFooterProps) {
  const qrTarget = absUrl(quoteUrl || `/t/${jobNo}`)

  return (
    <>
      {/* ─── 6. Line Items Table ─── */}
      <table
        style={{
          width: '100%',
          fontSize: 12,
          borderCollapse: 'collapse',
          marginTop: 10,
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
            <th style={{ width: 36, textAlign: 'left', padding: '6px 8px', color: '#475569', fontWeight: 600 }}>#</th>
            <th style={{ textAlign: 'left', padding: '6px 8px', color: '#475569', fontWeight: 600 }}>รายการ</th>
            <th style={{ width: 80, textAlign: 'right', padding: '6px 8px', color: '#475569', fontWeight: 600 }}>จำนวน</th>
            <th style={{ width: 110, textAlign: 'right', padding: '6px 8px', color: '#475569', fontWeight: 600 }}>จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {fin.displayLines.map(l => (
            <tr key={l.index} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '6px 8px', color: '#334155' }}>{l.index}</td>
              <td style={{ padding: '6px 8px', color: '#111827' }}>
                {l.description}
                {(l.partWaitDays ?? 0) > 0 && (
                  <span style={{ fontSize: 10.5, color: '#64748b' }}> · รออะไหล่ {l.partWaitDays} วัน</span>
                )}
                {(l.partWarrantyDays ?? 0) > 0 && (
                  <span style={{ fontSize: 10.5, color: '#64748b' }}> · ประกันอะไหล่ {l.partWarrantyDays} วัน</span>
                )}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#111827' }}>{l.quantity}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#111827' }}>{fmtBahtDecimal(l.amountBaht)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── 7. Financial Summary & Red Net Payable Bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <div style={{ width: '100%', maxWidth: 430, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px' }}>
            <span style={{ color: '#334155' }}>รวมก่อน VAT</span>
            <span>{fmtBahtDecimal(fin.subtotalBaht)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid #cbd5e1' }}>
            <span style={{ color: '#334155' }}>VAT 7%</span>
            <span>{fmtBahtDecimal(fin.vatAmountBaht)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', fontWeight: 700, fontSize: 12.5 }}>
            <span>ยอดซ่อมรวมทั้งสิ้น</span>
            <span>{fmtBahtDecimal(fin.totalBaht)}</span>
          </div>
          {fin.operationFeeDiscountBaht > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', color: '#047857', fontWeight: 600 }}>
              <span>หัก: ส่วนลดค่าดำเนินการที่ชำระไว้ (กรณีอนุมัติซ่อม)</span>
              <span>-{fmtBahtDecimal(fin.operationFeeDiscountBaht)}</span>
            </div>
          )}
          <div
            style={{
              marginTop: 6,
              backgroundColor: '#dc2626',
              color: '#ffffff',
              borderRadius: 6,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              ยอดที่ต้องชำระ (กรณีอนุมัติ) <span style={{ fontSize: 15, fontWeight: 800, marginLeft: 4 }}>{fmtBahtDecimal(fin.netPayableBaht)}</span>
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.95, textAlign: 'right' }}>
              ราคารวม VAT แล้ว{fin.operationFeeDiscountBaht > 0 ? ` · หักส่วนลด ${fmtBahtDecimal(fin.operationFeeDiscountBaht)} แล้ว` : ''}
            </div>
          </div>
        </div>
      </div>


      {/* ─── 8. Mobile QR Approval & Reject Options ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginTop: 12,
        }}
      >
        <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 11.5, color: '#b91c1c', marginBottom: 6 }}>
            อนุมัติและชำระผ่านมือถือ
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flexShrink: 0 }}>
              <QrImage value={qrTarget} size={74} />
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.45, color: '#1f2937' }}>
              <div>สแกน QR เพื่อเปิดใบเสนอราคาใน LINE</div>
              <div>แล้วกด &ldquo;อนุมัติซ่อม&rdquo; ชำระด้วย QR PromptPay</div>
              <div>หรือบัตรเครดิต</div>
              <div style={{ color: '#64748b', marginTop: 2, fontSize: 10.5 }}>อ้างอิง {jobNo}</div>
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 11.5, color: '#b91c1c', marginBottom: 6 }}>
            หากไม่อนุมัติซ่อม
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.55, color: '#1f2937' }}>
            <div>1. ไม่อนุมัติ รับสินค้าคืนที่สาขา (ค่าดำเนินการที่ชำระไว้ไม่คืน)</div>
            <div>2. ไม่อนุมัติ ขอส่งสินค้าคืนทางขนส่ง (ลูกค้ารับค่าขนส่ง)</div>
            <div>3. ไม่รับสินค้าคืน แลกรับคูปองส่วนลด Trade-in</div>
          </div>
        </div>
      </div>

      {/* ─── 9. Signatures ─── */}
      <QuoteSignatureSection data={signatures} />

      {/* ─── 10. Footer Terms ─── */}
      <div style={{ marginTop: 12, fontSize: 10, color: '#475569', lineHeight: 1.45 }}>
        <b style={{ color: '#1e293b' }}>เงื่อนไข:</b>{' '}
        1) ใบเสนอราคานี้ใช้ได้ถึง {validUntilText} หากเกินกำหนดต้องตรวจราคาอะไหล่ใหม่ ·{' '}
        2) ราคารวมภาษีมูลค่าเพิ่มแล้ว ·{' '}
        3) รับประกันเฉพาะอะไหล่และงานที่ซ่อมตามรายการข้างต้น {repairWarrantyDays} วัน นับจากวันส่งมอบ ·{' '}
        4) หากพบความเสียหายเพิ่มระหว่างซ่อม ศูนย์บริการจะแจ้งขออนุมัติรายการเพิ่มก่อนดำเนินการ
      </div>
    </>
  )
}
