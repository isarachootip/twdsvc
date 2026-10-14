'use client'

import { useRef } from 'react'
import Modal from '@/components/ui/Modal'
import { printElement } from '@/lib/print-element'
import {
  RepairReceiptDocument,
  type RepairReceiptData,
} from './RepairReceiptDocument'

export interface JobRepairReceiptModalProps {
  open: boolean
  onClose: () => void
  data: RepairReceiptData | null
}

export function JobRepairReceiptModal({ open, onClose, data }: JobRepairReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!open || !data) return null

  const title = data.docType === 'RETURN' ? 'ใบส่งคืนสินค้าซ่อม' : 'ใบรับแจ้งซ่อมสินค้า'

  return (
    <Modal open={open} onClose={onClose} size="wide" zIndex={95}>
      <div ref={printRef} className="print-area">
        <RepairReceiptDocument data={data} />
      </div>
      <div className="modal-actions no-print">
        <button type="button" className="btn" onClick={onClose}>
          ปิด
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => printElement(printRef.current, `${title} ${data.jobNo}`)}
        >
          🖨️ พิมพ์ {title} (2 ชุด / A4)
        </button>
      </div>
    </Modal>
  )
}
