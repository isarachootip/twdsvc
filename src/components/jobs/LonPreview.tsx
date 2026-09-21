'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { api, absUrl } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'

interface JobLite { id: string; jobNo: string; productName: string }

/** Preview ข้อความ LINE (LON) ที่ลูกค้าเห็น + ส่วนจำลองลูกค้ากด (เฉพาะ DEMO_MODE) */
export default function LonPreview({ job, demo, onClose, onDecided }: { job: JobLite | null; demo: boolean; onClose: () => void; onDecided?: () => void }) {
  const [info, setInfo] = useState<{ url: string | null; total: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!job) return
    setInfo(null)
    api<{ links: Record<string, string>; quotes: Array<{ status: string; total: number }> }>(`/api/jobs/${job.id}`)
      .then(d => setInfo({ url: d.links?.QUOTE ?? null, total: d.quotes?.find(q => q.status === 'SENT')?.total ?? d.quotes?.[0]?.total ?? 0 }))
      .catch(e => toast(e.message, 'error'))
  }, [job, toast])

  if (!job) return null
  const token = info?.url?.split('/q/')[1]

  const decide = async (approve: boolean) => {
    if (!token) return
    setBusy(true)
    try {
      await api(`/api/public/q/${token}/${approve ? 'approve' : 'reject'}`, { body: { payMethod: 'LATER' } })
      toast(approve ? 'ลูกค้าอนุมัติซ่อมแล้ว — งานย้ายไป "กำลังซ่อม"' : 'ลูกค้าไม่อนุมัติ — งานย้ายไป "Pack และส่งคืน"', 'success')
      onDecided?.()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} size="narrow" className="p-0">
      <div style={{ margin: '-22px -24px' }}>
        <div style={{ background: 'var(--red)', color: '#fff', padding: '12px 16px', fontSize: 13, fontWeight: 500, borderRadius: '14px 14px 0 0' }}>Line — Thaiwasadu Service Center</div>
        <div style={{ padding: 16, background: 'var(--surface-2)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-mute)', margin: '0 0 6px' }}>ข้อความที่ลูกค้าเห็นจริงใน Line</p>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-mute)', margin: '0 0 4px' }}>ใบเสนอราคาซ่อม — {job.jobNo}</p>
            <p style={{ fontSize: 13, margin: '0 0 8px' }}>{job.productName}</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 4px' }}>ค่าซ่อมทั้งหมด</p>
            <p style={{ fontSize: 22, fontWeight: 600, margin: '0 0 10px' }}>{info ? fmtBaht(info.total) : '…'}</p>
            {info?.url ? (
              <a href={absUrl(info.url)} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: 'var(--blue-tint)', color: 'var(--blue)', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 500 }}>ดูใบเสนอราคา และอนุมัติ/ไม่อนุมัติ ↗</a>
            ) : info && <p className="sub-mute">ลิงก์ถูกใช้แล้ว/หมดอายุ</p>}
          </div>
          {info?.url && (
            <button className="link-btn" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard?.writeText(absUrl(info.url!)); toast('คัดลอกลิงก์แล้ว', 'success') }}>คัดลอกลิงก์ส่งลูกค้า</button>
          )}
        </div>
        {demo && token && (
          <div style={{ padding: '14px 16px', borderTop: '1px dashed var(--border-strong)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-mute)', margin: '0 0 8px' }}>— สำหรับทดสอบเท่านั้น (DEMO_MODE) จำลองว่าลูกค้ากดในลิงก์แล้ว —</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy} onClick={() => decide(true)}>จำลอง: ลูกค้าอนุมัติ</button>
              <button className="btn" style={{ flex: 1 }} disabled={busy} onClick={() => decide(false)}>จำลอง: ไม่อนุมัติ</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
