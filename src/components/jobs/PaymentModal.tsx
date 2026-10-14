'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Modal from '@/components/ui/Modal'
import QrImage from '@/components/ui/QrImage'
import { useToast } from '@/components/ui/Toast'
import { useMe } from '@/components/ui/useMe'
import { api, absUrl } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'
import type { EOrderingLineItem } from '@/lib/validations/eordering.schema'

interface Props {
  job: { id: string; jobNo: string; version: number } | null
  kind: 'intake' | 'repair'
  amount: number
  initialMethod?: 'PROMPTPAY_QR' | 'CARD_LINK' | 'POS_RECEIPT'
  onClose: () => void
  onPaid: () => void
}

interface EOrderingQrApiResponse {
  orderRef: string
  qrPayload: string | null
  qrImageUrl: string | null
  payUrl: string
  token: string
  expiresAt: string
  reused: boolean
  payloadSent: {
    jobNo: string
    items: EOrderingLineItem[]
    totalAmount: number
  }
}

/** รับชำระ: QR ผ่านระบบ E-ordering / Link บัตรเครดิต / เลขที่ใบเสร็จ POS */
export default function PaymentModal({ job, kind, amount, initialMethod = 'PROMPTPAY_QR', onClose, onPaid }: Props) {
  const [method, setMethod] = useState(initialMethod)
  const [pos, setPos] = useState('')
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [qrData, setQrData] = useState<EOrderingQrApiResponse | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const me = useMe()
  const poll = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (!job) return
    setMethod(initialMethod)
    setPos('')
    setPayUrl(null)
    setQrData(null)
    setQrError(null)
  }, [job, initialMethod])

  const loadEOrderingQr = useCallback(async (forceNew = false) => {
    if (!job) return
    setQrLoading(true)
    setQrError(null)
    try {
      const r = await api<EOrderingQrApiResponse>(`/api/jobs/${job.id}/e-ordering-qr`, {
        method: 'POST',
        body: { kind, forceNew },
      })
      setQrData(r)
      setPayUrl(r.payUrl)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ไม่สามารถเชื่อมต่อระบบ E-ordering ได้'
      setQrError(msg)
      toast(msg, 'error')
    } finally {
      setQrLoading(false)
    }
  }, [job, kind, toast])

  useEffect(() => {
    clearInterval(poll.current)
    if (!job || method === 'POS_RECEIPT') return
    let alive = true
    if (method === 'PROMPTPAY_QR') {
      loadEOrderingQr(false)
    } else if (method === 'CARD_LINK') {
      api<{ payUrl: string }>(`/api/jobs/${job.id}/payment-link`, { method: 'POST', body: {} })
        .then(r => { if (alive) setPayUrl(r.payUrl) })
        .catch(e => toast(e instanceof Error ? e.message : 'สร้างลิงก์ไม่สำเร็จ', 'error'))
    }
    return () => { alive = false }
  }, [job, method, loadEOrderingQr, toast])

  useEffect(() => {
    clearInterval(poll.current)
    if (!payUrl) return
    const token = payUrl.split('/pay/')[1]
    if (!token) return
    poll.current = setInterval(async () => {
      try {
        const s = await api<{ paid: boolean; balance: number }>(`/api/public/pay/${token}`)
        if (s.paid || (kind === 'intake' && s.balance <= 0)) {
          clearInterval(poll.current)
          toast('ชำระเงินสำเร็จ ✓', 'success')
          onPaid()
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(poll.current)
  }, [payUrl, kind, onPaid, toast])

  if (!job) return null

  const recordPos = async () => {
    if (!pos.trim()) { toast('กรุณากรอกเลขที่ใบเสร็จ POS', 'error'); return }
    setBusy(true)
    try {
      await api(`/api/jobs/${job.id}/action`, {
        body: {
          action: kind === 'intake' ? 'record_intake_payment' : 'record_repair_payment',
          paymentMethod: 'POS_RECEIPT',
          posReceiptNo: pos.trim(),
        },
      })
      toast('บันทึกการชำระเงินแล้ว ✓', 'success')
      onPaid()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setBusy(false)
    }
  }

  const simulate = async () => {
    if (!payUrl) return
    setBusy(true)
    try {
      await api(`/api/public/pay/${payUrl.split('/pay/')[1]}/confirm`, {
        body: { method: method === 'CARD_LINK' ? 'CARD' : 'QR', posReceiptNo: qrData?.orderRef },
      })
    } catch (e) {
      toast(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setBusy(false)
    }
  }

  const qrValue = qrData?.qrPayload || (payUrl ? absUrl(payUrl) : '')

  return (
    <Modal open onClose={onClose} size="narrow">
      <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>รับชำระ{kind === 'intake' ? 'ค่าดำเนินการ' : 'ค่าซ่อม'} — {job.jobNo}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-2)' }}>
        ยอดที่ต้องชำระ <b style={{ color: 'var(--red-dark)', fontSize: 16 }}>{fmtBaht(amount)}</b>
      </p>
      <div className="radio-row">
        <button className={`radio-opt ${method === 'PROMPTPAY_QR' ? 'checked' : ''}`} onClick={() => setMethod('PROMPTPAY_QR')}>QR Payment</button>
        <button className={`radio-opt ${method === 'CARD_LINK' ? 'checked' : ''}`} onClick={() => setMethod('CARD_LINK')}>Link ตัดบัตรเครดิต</button>
        <button className={`radio-opt ${method === 'POS_RECEIPT' ? 'checked' : ''}`} onClick={() => setMethod('POS_RECEIPT')}>เลขที่ใบเสร็จ POS</button>
      </div>

      {method === 'PROMPTPAY_QR' && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {qrLoading ? (
            <div className="empty">กำลังส่งข้อมูลรายการและจำนวนเงินไปสร้าง QR ที่ระบบ E-ordering…</div>
          ) : qrError ? (
            <div style={{ padding: '16px 12px' }}>
              <p className="text-rose-600" style={{ fontSize: 13, marginBottom: 10 }}>{qrError}</p>
              <button type="button" className="btn btn-outline" onClick={() => loadEOrderingQr(true)}>
                ลองใหม่อีกครั้ง (Retry)
              </button>
            </div>
          ) : qrData ? (
            <>
              {qrData.qrImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={qrData.qrImageUrl} alt="E-ordering QR" width={200} height={200} style={{ margin: '0 auto', display: 'block' }} />
              ) : (
                <QrImage value={qrValue} size={200} />
              )}
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)', textAlign: 'left', padding: '0 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>อ้างอิง E-ordering:</span>
                  <span style={{ fontWeight: 600 }}>{qrData.orderRef}</span>
                </div>
                {qrData.payloadSent.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-mute)' }}>
                    <span>{item.description} ({item.sku})</span>
                    <span>{fmtBaht(item.amount)}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: '10px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span>ให้ลูกค้าสแกนเพื่อชำระเงิน —</span>
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                  รอชำระ…
                </span>
              </p>
            </>
          ) : null}
        </div>
      )}

      {method === 'CARD_LINK' && payUrl && (
        <div style={{ marginTop: 16 }}>
          <div className="field">
            <label>ลิงก์ชำระเงินด้วยบัตรเครดิต (ส่งให้ลูกค้าทาง LON)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="inp" style={{ flex: 1, fontSize: 12 }} readOnly value={absUrl(payUrl)} onFocus={e => e.target.select()} />
              <button className="btn btn-primary" onClick={() => { navigator.clipboard?.writeText(absUrl(payUrl)); toast('คัดลอกลิงก์แล้ว', 'success') }}>คัดลอก</button>
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
              รอลูกค้าชำระ…
            </span>
            <span>ระบบจะอัปเดตอัตโนมัติเมื่อชำระสำเร็จ</span>
          </p>
        </div>
      )}

      {method === 'POS_RECEIPT' && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>เลขที่ใบเสร็จ POS (Ref.)</label>
          <input className="inp" autoFocus value={pos} onChange={e => setPos(e.target.value)} placeholder="เช่น POS-BN-000123" />
        </div>
      )}

      <div className="modal-actions">
        <button className="btn" onClick={onClose}>ปิด</button>
        {method === 'POS_RECEIPT' ? (
          <button className="btn btn-primary" disabled={busy} onClick={recordPos}>บันทึกการชำระเงิน</button>
        ) : me?.demoMode ? (
          <button className="btn btn-outline" disabled={busy || !payUrl} onClick={simulate}>จำลอง: ลูกค้าชำระเงินสำเร็จ</button>
        ) : null}
      </div>
    </Modal>
  )
}
