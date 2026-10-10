'use client'

import Modal from './Modal'
import ShippingLabel3PL from './ShippingLabel3PL'
import type { ThreePlLabelData } from '@/lib/threepl-label'

interface ShippingLabel3PLModalProps {
  data: ThreePlLabelData | null
  onClose: () => void
}

/**
 * Modal dialog for previewing and printing 3PL Shipping Labels.
 * Employs `.print-area` for 1:1 thermal label print fidelity.
 */
export default function ShippingLabel3PLModal({ data, onClose }: ShippingLabel3PLModalProps) {
  if (!data) return null

  return (
    <Modal open onClose={onClose} size="narrow" className="shipping-label-modal">
      <div className="no-print" style={{ marginBottom: 12, textAlign: 'center' }}>
        <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>ใบปะหน้าพัสดุส่ง 3PL (Express)</h3>
        <p style={{ fontSize: 12, color: 'var(--text-mute)', margin: '4px 0 0' }}>
          ขนาดมาตรฐาน 100×150 มม. สำหรับติดหน้ากล่องพัสดุ
        </p>
      </div>

      <div className="print-area" style={{ display: 'flex', justifyContent: 'center' }}>
        <ShippingLabel3PL data={data} />
      </div>

      <div className="modal-actions no-print" style={{ marginTop: 16 }}>
        <button type="button" className="btn" onClick={onClose}>
          ปิด
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>🖨️ พิมพ์ใบปะหน้า 3PL</span>
        </button>
      </div>
    </Modal>
  )
}
