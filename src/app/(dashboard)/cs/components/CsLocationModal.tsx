'use client'

import { useState } from 'react'
import type { JobView } from '@/lib/job-view'

interface CsLocationModalProps {
  job: JobView | null
  onClose: () => void
  onUpdated: () => void
  run: (job: JobView, action: string, body: Record<string, unknown>, label: string) => Promise<unknown>
  busy: string | null
}

export default function CsLocationModal({ job, onClose, onUpdated, run, busy }: CsLocationModalProps) {
  const [loc, setLoc] = useState(job?.location ?? '')
  if (!job) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = loc.trim().toUpperCase()
    if (!trimmed) return
    const res = await run(job, 'update_location', { location: trimmed }, 'อัปเดต Location แล้ว')
    if (res) {
      onUpdated()
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, margin: 0 }}>ระบุ / แก้ไข Location</h3>
          <button className="close-btn" style={{ position: 'static' }} onClick={onClose}>✕</button>
        </div>
        <p className="sub-mute" style={{ marginBottom: 16 }}>
          ใบแจ้งซ่อม: <b>{job.jobNo}</b> · {job.productName}
        </p>

        <form onSubmit={handleSave}>
          <div className="field">
            <label>เลขที่ Location / จุดจัดเก็บสินค้าที่เคาน์เตอร์ CS</label>
            <input
              autoFocus
              className="inp"
              placeholder="เช่น CS-01, ตู้ A-2, ชั้น 1"
              value={loc}
              onChange={e => setLoc(e.target.value)}
              disabled={busy !== null}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn" onClick={onClose} disabled={busy !== null}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!loc.trim() || busy !== null}
            >
              {busy ? 'กำลังบันทึก…' : 'บันทึก Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
