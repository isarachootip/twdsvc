'use client'

import { useState, useMemo } from 'react'
import { fmtBaht } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

interface CsApprovalPanelProps {
  job: JobView
  readOnly: boolean
  busy: string | null
  onRecord: (d: 'approve' | 'reject', reason: string) => void
  onDetail: () => void
  onSignManager: () => void
}

export default function CsApprovalPanel({
  job,
  readOnly,
  busy,
  onRecord,
  onDetail,
  onSignManager,
}: CsApprovalPanelProps) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('ลูกค้าแจ้งทางโทรศัพท์')
  const expired = useMemo(() => job.quote?.expiresAt && new Date(job.quote.expiresAt) < new Date(), [job])
  const isManagerSigned = Boolean(job.quote?.managerSignedAt)

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
      <div className="summary-row">
        <span>ใบเสนอราคา</span>
        <span>{job.quote?.quoteNo ?? '-'}</span>
      </div>
      <div className="summary-row total">
        <span>ยอดเสนอราคา (รวม VAT)</span>
        <span>{fmtBaht(Number(job.quote?.total ?? 0))}</span>
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13 }}>การลงนาม ผจก. สาขา</span>
        {isManagerSigned ? (
          <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            ลงนามแล้ว ({job.quote?.managerSignerName || 'ผจก.'})
          </span>
        ) : (
          <span className="text-amber-700 font-medium inline-flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            รอ ผจก. ลงนามอนุมัติ
          </span>
        )}
      </div>

      {!isManagerSigned && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            className="btn btn-lg"
            style={{ width: '100%', color: 'var(--red-dark)', borderColor: 'var(--red)' }}
            onClick={onSignManager}
            disabled={readOnly || busy !== null}
          >
            ✍️ ลงนามใบเสนอราคา (ผจก. สาขา)
          </button>
          <p className="sub-mute" style={{ marginTop: 6, textAlign: 'center' }}>
            เมื่อลงนามแล้ว ระบบจะเปิดให้ลูกค้าตรวจสอบและอนุมัติผ่านลิงก์
          </p>
        </div>
      )}

      {expired && <div className="note amber" style={{ marginTop: 8 }}>ลิงก์ใบเสนอราคาหมดอายุแล้ว — โทรติดตามลูกค้าและบันทึกผลแทนได้</div>}
      <button className="link-btn" style={{ marginTop: 10 }} onClick={onDetail}>↗ ดูใบเสนอราคาฉบับเต็ม</button>

      {isManagerSigned && (
        <div style={{ marginTop: 14, borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: '4px 0 6px' }}>บันทึกผลแทนลูกค้า</p>
          <div className="radio-row">
            <button
              type="button"
              className={`radio-opt ${decision === 'approve' ? 'checked' : ''}`}
              onClick={() => setDecision('approve')}
            >
              ✓ ลูกค้าอนุมัติซ่อม
            </button>
            <button
              type="button"
              className={`radio-opt ${decision === 'reject' ? 'checked' : ''}`}
              onClick={() => setDecision('reject')}
            >
              ✕ ไม่อนุมัติ
            </button>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label>เหตุผล / ช่องทางที่ลูกค้าแจ้ง</label>
            <input className="inp" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: 12 }}
            disabled={!decision || !reason.trim() || readOnly || busy !== null}
            onClick={() => decision && onRecord(decision, reason)}
          >
            บันทึกผล
          </button>
        </div>
      )}
    </div>
  )
}
