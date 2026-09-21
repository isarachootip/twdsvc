'use client'

import Modal from './Modal'
import QrImage from './QrImage'

export interface LabelData {
  title: string // เช่น "ใบปะหน้ากล่อง (ขาไป)"
  subtitle?: string
  jobNo: string
  rows: Array<[string, string]>
}

/** Print preview ใบปะหน้า (GR/VD/DC) — ปุ่มพิมพ์พิมพ์เฉพาะส่วนใบปะหน้า */
export default function PrintLabel({ data, onClose }: { data: LabelData | null; onClose: () => void }) {
  if (!data) return null
  return (
    <Modal open onClose={onClose} size="narrow">
      <div className="print-area">
        <div style={{ textAlign: 'center', borderBottom: '0.5px dashed var(--border-strong)', paddingBottom: 10 }}>
          <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{data.title}</p>
          {data.subtitle && <p style={{ fontSize: 12, color: 'var(--text-mute)', margin: '2px 0 0' }}>{data.subtitle}</p>}
        </div>
        <table style={{ width: '100%', fontSize: 13, marginTop: 10 }}>
          <tbody>
            <tr><td style={{ color: 'var(--text-2)', padding: '4px 0' }}>เลขที่ใบแจ้งซ่อม</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{data.jobNo}</td></tr>
            {data.rows.map(([k, v]) => (
              <tr key={k}><td style={{ color: 'var(--text-2)', padding: '4px 0' }}>{k}</td><td style={{ textAlign: 'right' }}>{v}</td></tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14 }}><QrImage value={data.jobNo} size={110} /></div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-mute)', margin: '8px 0 0' }}>ติดหน้ากล่อง / สแกนยืนยันรับที่ปลายทาง</p>
      </div>
      <div className="modal-actions no-print">
        <button className="btn" onClick={onClose}>ปิด</button>
        <button className="btn btn-primary" onClick={() => window.print()}>พิมพ์ (Print)</button>
      </div>
    </Modal>
  )
}
