'use client'

import Modal from '@/components/ui/Modal'
import QrImage from '@/components/ui/QrImage'
import { absUrl } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'

export interface SavedRouting {
  centerCode: string
  vendorCode: string
  vendorName: string
  channel: string
}

export interface SavedPrintJob {
  jobNo: string
  trackingUrl?: string
  routing: SavedRouting | null
}

interface PrintJobModalProps {
  open: boolean
  onClose: () => void
  saved: SavedPrintJob | null
  activeBranchName: string
  customerName: string
  phone: string
  product: string
  brandName: string
  sku: string
  symptom: string
  defect: string
  warranty: 'yes' | 'no'
  sizeName: string
  method: 'STANDARD' | 'EXPRESS'
  totalFee: number
  paid: boolean
}

export function PrintJobModal({
  open,
  onClose,
  saved,
  activeBranchName,
  customerName,
  phone,
  product,
  brandName,
  sku,
  symptom,
  defect,
  warranty,
  sizeName,
  method,
  totalFee,
  paid,
}: PrintJobModalProps) {
  if (!open || !saved) return null

  const items: [string, string][] = [
    ['เลขที่ใบแจ้งซ่อม', saved.jobNo],
    ['วันที่', new Date().toLocaleString('th-TH')],
    ['ลูกค้า', customerName],
    ['เบอร์โทร', phone],
    ['สินค้า', `${product} (${brandName})`],
    ['SKU', sku || '-'],
    ['อาการเสีย', symptom],
    ['ตำหนิ', defect || '-'],
    ['ประกัน', warranty === 'yes' ? 'มีประกัน' : 'ไม่มีประกัน'],
    ['ขนาด', sizeName],
    ['วิธีจัดส่ง', method === 'EXPRESS' ? 'ส่งด่วน (3PL)' : 'มาตรฐาน'],
    ['ค่าใช้จ่ายวันนี้', `${fmtBaht(totalFee)} ${totalFee > 0 ? (paid ? '(ชำระแล้ว)' : '(รอชำระ)') : ''}`],
    ['ศูนย์ซ่อม', saved.routing ? `${saved.routing.centerCode} ${saved.routing.vendorName}` : 'รอกำหนด'],
  ]

  return (
    <Modal open={open} onClose={onClose}>
      <div className="print-area">
        <div
          style={{
            textAlign: 'center',
            borderBottom: '1px solid var(--border)',
            paddingBottom: 10,
            marginBottom: 10,
          }}
        >
          <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>
            ใบแจ้งซ่อม — ศูนย์บริการซ่อมไทวัสดุ
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-mute)', margin: '2px 0 0' }}>
            Thaiwasadu Service Center · {activeBranchName}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
          <div>
            {items.map(([k, v]) => (
              <div className="info-row" key={k}>
                <span className="info-label">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            {saved.trackingUrl && <QrImage value={absUrl(saved.trackingUrl)} size={120} />}
            <p className="sub-mute">สแกนเพื่อติดตามสถานะ</p>
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 12 }}>
          กรณีลูกค้าอนุมัติซ่อม ค่าดำเนินการจะนำมาเป็นส่วนลดค่าซ่อมสินค้า · กรณีไม่อนุมัติซ่อม ค่าดำเนินการที่ชำระแล้วไม่สามารถคืนได้
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 12 }}>
          <span>ลงชื่อลูกค้า ______________________</span>
          <span>ลงชื่อพนักงาน ______________________</span>
        </div>
      </div>
      <div className="modal-actions no-print">
        <button className="btn" onClick={onClose}>ปิด</button>
        <button className="btn btn-primary" onClick={() => window.print()}>พิมพ์ (Print)</button>
      </div>
    </Modal>
  )
}
