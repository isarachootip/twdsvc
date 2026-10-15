'use client'

import Modal from './Modal'
import type { JobView } from '@/lib/job-view'
import { useBranding } from '@/lib/hooks/useBranding'

export default function DriverDoc({ doc, onClose }: { doc: { job: JobView; leg: string; url?: string } | null; onClose: () => void }) {
  const { branding } = useBranding()
  if (!doc) return null
  const j = doc.job
  return (
    <Modal open onClose={onClose} size="narrow">
      <div className="print-area">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 2px' }}>{doc.url ? 'ลิงก์งานสำหรับคนรถ' : 'เอกสารให้คนรถ'}</p>
            <p className="sub-mute" style={{ margin: 0, fontSize: 11.5 }}>{doc.leg}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={branding.logoUrl}
            alt={branding.companyName}
            style={{ width: 90, height: 'auto', maxHeight: 28, objectFit: 'contain' }}
          />
        </div>
        <div className="info-row"><span className="info-label">เลขที่ใบแจ้งซ่อม</span><b>{j.jobNo}</b></div>
        <div className="info-row"><span className="info-label">สินค้า</span><span>{j.productName}</span></div>
        <div className="info-row"><span className="info-label">สาขา</span><span>{j.branch.name}</span></div>
        <div className="info-row"><span className="info-label">ศูนย์ซ่อม</span><span>{j.vendor ? `${j.vendor.centerCode} ${j.vendor.name}` : '-'}</span></div>
        {doc.url && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <input className="inp" readOnly value={doc.url} style={{ flex: 1, fontSize: 12 }} onFocus={e => e.target.select()} />
            <button className="btn btn-primary" onClick={() => navigator.clipboard?.writeText(doc.url!)}>คัดลอก</button>
          </div>
        )}
      </div>
      <div className="modal-actions no-print">
        <button className="btn" onClick={onClose}>ปิด</button>
        {!doc.url && <button className="btn btn-primary" onClick={() => window.print()}>พิมพ์ (Print)</button>}
      </div>
    </Modal>
  )
}
