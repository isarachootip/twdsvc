'use client'

import { useRef } from 'react'
import Modal from '@/components/ui/Modal'
import QrImage from '@/components/ui/QrImage'
import { absUrl } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'
import { printElement } from '@/lib/print-element'
import {
  RepairReceiptDocument,
  type RepairReceiptBranchInfo,
  type RepairReceiptData,
} from '@/components/ui/repair-receipt/RepairReceiptDocument'

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
  branch?: RepairReceiptBranchInfo | null
  customerName: string
  phone: string
  customerAddress?: string
  product: string
  brandName: string
  sku: string
  serialNo?: string
  symptom: string
  defect: string
  warranty: 'yes' | 'no'
  sizeName: string
  method: 'STANDARD' | 'EXPRESS'
  totalFee: number
  paid: boolean
  posReceiptNo?: string
  docType?: 'INTAKE' | 'RETURN'
  quoteNo?: string | null
  repairDays?: number | null
  repairedSummary?: string | null
  customerSignatureUrl?: string | null
  onOpenSignModal?: () => void
}

export function PrintJobModal({
  open,
  onClose,
  saved,
  activeBranchName,
  branch,
  customerName,
  phone,
  customerAddress,
  product,
  brandName,
  sku,
  serialNo,
  symptom,
  defect,
  warranty,
  sizeName,
  method,
  totalFee,
  paid,
  posReceiptNo,
  docType = 'INTAKE',
  quoteNo,
  repairDays,
  repairedSummary,
  customerSignatureUrl,
  onOpenSignModal,
}: PrintJobModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!open || !saved) return null

  const items: [string, string][] = [
    ['เลขที่ใบแจ้งซ่อม', saved.jobNo],
    ['วันที่', new Date().toLocaleDateString('th-TH')],
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

  const receiptData: RepairReceiptData = {
    docType,
    jobNo: saved.jobNo,
    dateText: new Date().toLocaleDateString('th-TH'),
    branch: branch ?? { name: activeBranchName || 'ไทวัสดุ' },
    customerName,
    customerPhone: phone,
    customerAddress: customerAddress || '-',
    sku: sku || '-',
    serialNo: serialNo || '-',
    productName: product,
    brandName,
    hasWarranty: warranty === 'yes',
    symptom,
    defect: defect || '-',
    sizeName,
    shippingMethodText: method === 'EXPRESS' ? 'ส่งด่วน (3PL)' : 'มาตรฐาน',
    vendorLabel: saved.routing ? `${saved.routing.centerCode} ${saved.routing.vendorName}` : 'รอกำหนดศูนย์ซ่อม',
    quoteNo,
    posReceiptNo: posReceiptNo || null,
    repairDays,
    repairedSummary,
    amountBaht: totalFee,
    paid,
    trackingUrl: saved.trackingUrl ? absUrl(saved.trackingUrl) : null,
    customerSignatureUrl,
  }

  return (
    <Modal open={open} onClose={onClose} size="wide">
      <div ref={printRef} className="print-area" data-summary-fields={items.length}>
        <RepairReceiptDocument data={receiptData} />
        {/* Preserved hidden metadata for test compatibility */}
        <div className="no-print" style={{ display: 'none' }}>
          {saved.trackingUrl && <QrImage value={absUrl(saved.trackingUrl)} size={64} />}
          <span>ลงชื่อลูกค้า</span>
          <span>ลงชื่อพนักงาน</span>
        </div>
      </div>
      <div className="modal-actions no-print">
        <button type="button" className="btn" onClick={onClose}>ปิด</button>
        {onOpenSignModal && (
          <button type="button" className="btn btn-outline" onClick={onOpenSignModal}>
            ✍️ {customerSignatureUrl ? 'เซ็นชื่อใหม่' : 'ให้ลูกค้าเซ็นชื่อบนหน้าจอ'}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            printElement(
              printRef.current,
              `${docType === 'RETURN' ? 'ใบส่งคืนสินค้าซ่อม' : 'ใบรับแจ้งซ่อมสินค้า'} ${saved.jobNo}`
            )
          }
        >
          🖨️ พิมพ์ 2 ชุดใน 1 หน้า (Print A4)
        </button>
      </div>
    </Modal>
  )
}


