'use client'

import { useState, useMemo } from 'react'
import { useToast } from '@/components/ui/Toast'
import { fmtBaht, fmtPhone } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

interface PickupPanelProps {
  job: JobView
  readOnly: boolean
  busy: string | null
  onPay: () => void
  onClose: (opt: 'REPAIRED' | 'TRADEIN' | 'RETURN_ONLY') => void
  onTradein: () => void
  onDetail: () => void
  onEditLoc: () => void
  onPrintReturn: () => void
}

export function PickupPanel({
  job,
  readOnly,
  busy,
  onPay,
  onClose,
  onTradein,
  onDetail,
  onEditLoc,
  onPrintReturn,
}: PickupPanelProps) {
  const [choice, setChoice] = useState<'TRADEIN' | 'RETURN_ONLY' | null>(null)
  const m = job.money
  const { confirm } = useToast()
  if (!m) return null

  if (job.decision !== 'REJECTED') {
    const approved = job.decision === 'APPROVED' || job.decision === 'AUTO_APPROVED'
    return (
      <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <p style={{ fontWeight: 600, fontSize: 13.5, margin: '0 0 6px' }}>
          {approved ? 'ลูกค้าอนุมัติซ่อม — VD ส่งคืนแล้ว' : 'งานซ่อมเสร็จ (อนุมัติอัตโนมัติ/ในประกัน)'}
        </p>
        <div className="info-row" style={{ marginBottom: 8 }}>
          <span className="info-label">Location จัดเก็บ</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <b className="text-slate-800">{job.location ?? 'ยังไม่ระบุ'}</b>
            {!readOnly && (
              <button className="link-btn text-xs text-amber-700" onClick={onEditLoc}>
                ✏️ แก้ไข
              </button>
            )}
          </span>
        </div>
        {m.credit !== 0 && <div className="summary-row"><span>ค่าดำเนินการ (หักเป็นส่วนลด)</span><span>{fmtBaht(m.credit)}</span></div>}
        <div className="summary-row"><span>ค่าซ่อม (ตามใบเสนอราคา VD)</span><span>{fmtBaht(m.repair)}</span></div>
        {m.operationFee > 0 && <div className="summary-row"><span>ค่าดำเนินการ{m.intakePaid >= m.intakeCharges ? ' (ชำระแล้ว)' : ''}</span><span>{fmtBaht(m.operationFee)}</span></div>}
        {m.shippingFee > 0 && <div className="summary-row"><span>ค่าขนส่ง 3PL{m.intakePaid >= m.intakeCharges ? ' (ชำระแล้ว)' : ''}</span><span>{fmtBaht(m.shippingFee)}</span></div>}
        <div className="summary-row"><span>ชำระแล้วทั้งหมด</span><span>-{fmtBaht(m.totalPaid)}</span></div>
        <div className="summary-row total"><span>ยอดสุทธิที่ลูกค้าต้องชำระ</span><span>{fmtBaht(Math.max(0, m.balance))}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 13 }}>สถานะการชำระเงิน</span>
          {m.balance > 0 ? (
            <span className="text-amber-700 font-medium inline-flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              ค้างชำระ {fmtBaht(m.balance)}
            </span>
          ) : (
            <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              ชำระเงินสำเร็จ
            </span>
          )}
        </div>
        <button className="link-btn" style={{ marginTop: 10 }} onClick={onDetail}>↗ ดูใบเสนอราคาฉบับเต็มจาก VD</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <button type="button" className="btn btn-outline btn-lg" onClick={onPrintReturn}>
            🖨️ พิมพ์ใบส่งคืนสินค้าซ่อม
          </button>
          {m.balance > 0 && <button className="btn btn-outline btn-lg" disabled={readOnly} onClick={onPay}>รับชำระ {fmtBaht(m.balance)}</button>}
          <button
            className="btn btn-primary btn-lg"
            disabled={readOnly || m.balance > 0 || busy !== null}
            title={m.balance > 0 ? 'ต้องชำระยอดค้างให้ครบก่อนปิดงาน' : undefined}
            onClick={async () => {
              if (await confirm({ message: `ยืนยันลูกค้ารับสินค้า ${job.jobNo} และปิดงาน?` })) {
                onClose('REPAIRED')
              }
            }}
          >
            ลูกค้ารับสินค้าแล้ว — ปิดงาน
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
      <p style={{ fontWeight: 600, fontSize: 13.5, margin: '0 0 6px' }}>ลูกค้าไม่อนุมัติซ่อม</p>
      <div className="info-row" style={{ marginBottom: 8 }}>
        <span className="info-label">Location จัดเก็บ</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <b className="text-slate-800">{job.location ?? 'ยังไม่ระบุ'}</b>
          {!readOnly && (
            <button className="link-btn text-xs text-amber-700" onClick={onEditLoc}>
              ✏️ แก้ไข
            </button>
          )}
        </span>
      </div>
      <div className="summary-row"><span>ค่าใช้จ่ายที่ลูกค้าจะไม่ได้รับคืน</span><span>{fmtBaht(m.intakePaid)}</span></div>
      <div className="note">{m.intakePaid > 0
        ? `ค่าดำเนินการ ${fmtBaht(m.operationFee)}${m.shippingFee ? ` + ค่าขนส่ง 3PL ${fmtBaht(m.shippingFee)}` : ''} ที่ชำระตอนเปิดงาน ไม่สามารถคืนได้`
        : 'กรณีนี้ไม่มีค่าใช้จ่ายที่เรียกเก็บไปตอนเปิดงาน (มีประกัน + ส่งแบบมาตรฐาน)'}</div>
      <p style={{ fontSize: 13, margin: '10px 0 0' }}>ต้องการ Trade-in เพื่อรับส่วนลดซื้อสินค้าใหม่ หรือรับสินค้ากลับอย่างเดียว?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-outline btn-lg" onClick={onPrintReturn}>
          🖨️ พิมพ์ใบส่งคืนสินค้าซ่อม
        </button>
        <button className={`btn btn-outline ${choice === 'TRADEIN' ? 'active' : ''}`} disabled={readOnly} onClick={() => { setChoice('TRADEIN'); onTradein() }}>ต้องการ Trade-in ↗ ไปหน้า Gen คูปอง</button>
        <button className={`btn ${choice === 'RETURN_ONLY' ? 'btn-outline' : ''}`} disabled={readOnly} onClick={() => setChoice('RETURN_ONLY')}>รับสินค้ากลับอย่างเดียว</button>
        {choice && <div className="note">{choice === 'RETURN_ONLY' ? 'ลูกค้าเลือกรับสินค้ากลับอย่างเดียว' : 'ออกคูปอง Trade-in แล้ว (ถ้ายังไม่ได้ออก ให้กดปุ่มด้านบน)'}</div>}
        {choice && <button className="btn btn-primary btn-lg" disabled={readOnly || busy !== null} onClick={() => onClose(choice)}>ลูกค้ารับสินค้าแล้ว — ปิดงาน</button>}
      </div>
    </div>
  )
}

interface ApprovalPanelProps {
  job: JobView
  readOnly: boolean
  busy: string | null
  onRecord: (d: 'approve' | 'reject', reason: string) => void
  onDetail: () => void
}

export function ApprovalPanel({ job, readOnly, busy, onRecord, onDetail }: ApprovalPanelProps) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('ลูกค้าแจ้งทางโทรศัพท์')
  const expired = useMemo(() => job.quote?.expiresAt && new Date(job.quote.expiresAt) < new Date(), [job])

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
      <div className="summary-row"><span>ใบเสนอราคา</span><span>{job.quote?.quoteNo}</span></div>
      <div className="summary-row total"><span>ยอดเสนอราคา (รวม VAT)</span><span>{fmtBaht(Number(job.quote?.total ?? 0))}</span></div>
      {expired && <div className="note amber">ลิงก์ใบเสนอราคาหมดอายุแล้ว — โทรติดตามลูกค้าและบันทึกผลแทนได้</div>}
      <button className="link-btn" style={{ marginTop: 8 }} onClick={onDetail}>↗ ดูใบเสนอราคาฉบับเต็ม</button>
      <p style={{ fontSize: 13, fontWeight: 500, margin: '12px 0 6px' }}>บันทึกผลแทนลูกค้า</p>
      <div className="radio-row">
        <button className={`radio-opt ${decision === 'approve' ? 'checked' : ''}`} onClick={() => setDecision('approve')}>✓ ลูกค้าอนุมัติซ่อม</button>
        <button className={`radio-opt ${decision === 'reject' ? 'checked' : ''}`} onClick={() => setDecision('reject')}>✕ ไม่อนุมัติ</button>
      </div>
      <div className="field" style={{ marginTop: 10 }}><label>เหตุผล / ช่องทางที่ลูกค้าแจ้ง</label><input className="inp" value={reason} onChange={e => setReason(e.target.value)} /></div>
      <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 12 }} disabled={!decision || !reason.trim() || readOnly || busy !== null} onClick={() => decision && onRecord(decision, reason)}>บันทึกผล</button>
    </div>
  )
}
