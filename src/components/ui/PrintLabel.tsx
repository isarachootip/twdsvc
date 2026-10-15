'use client'

import { useRef } from 'react'
import Modal from './Modal'
import PrintLabelCard from './PrintLabelCard'
import { useBranding } from '@/lib/hooks/useBranding'
import { printElement } from '@/lib/print-element'
import {
  normalizeReturnLabelData,
  type ReturnBoxLabelData,
} from '@/lib/shipping-labels'

export type LabelData = ReturnBoxLabelData

/**
 * ใบปะหน้ากล่องมาตรฐานไทวัสดุ (100×150 มม.)
 * ติดป้ายโลโก้ไทวัสดุชัดเจน พร้อมรหัสคัดแยกสาขา/ปลายทาง, QR Code และ 1D Barcode
 */
export default function PrintLabel({
  data,
  onClose,
}: {
  data: LabelData | null
  onClose: () => void
}) {
  const printRef = useRef<HTMLDivElement>(null)
  const { branding } = useBranding()

  if (!data) return null

  const norm = normalizeReturnLabelData(data)
  const logoSrc = branding.logoUrl || '/images/thaiwatsadu-logo.png'
  const barcodeText = norm.trackingNo || norm.jobNo

  return (
    <Modal open onClose={onClose} size="narrow" className="shipping-label-modal">
      <div className="no-print" style={{ marginBottom: 10, textAlign: 'center' }}>
        <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>{norm.title}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-mute)', margin: '3px 0 0' }}>
          ป้ายมาตรฐานศูนย์บริการไทวัสดุ (100×150 มม.) สำหรับติดหน้ากล่องพัสดุ
        </p>
      </div>

      <div ref={printRef} className="print-area" style={{ display: 'flex', justifyContent: 'center' }}>
        <PrintLabelCard
          norm={norm}
          logoSrc={logoSrc}
          companyName={branding.companyName}
          barcodeText={barcodeText}
        />
      </div>

      <div className="modal-actions no-print" style={{ marginTop: 14 }}>
        <button type="button" className="btn" onClick={onClose}>
          ปิด
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => printElement(printRef.current, `${norm.title} ${norm.jobNo}`)}
        >
          🖨️ พิมพ์ใบปะหน้า (Print)
        </button>
      </div>
    </Modal>
  )
}
