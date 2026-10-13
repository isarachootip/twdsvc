'use client'

import Modal from '@/components/ui/Modal'
import ThaiwasaduLabel from './ThaiwasaduLabel'
import KexLabel from './KexLabel'
import type { UnifiedShippingLabelData } from '@/lib/shipping-labels/types'

export interface ShippingLabelModalProps {
  data: UnifiedShippingLabelData | null
  onClose: () => void
}

export default function ShippingLabelModal({ data, onClose }: ShippingLabelModalProps) {
  if (!data) return null

  const title =
    data.type === 'DC'
      ? 'ใบปะหน้าสินค้า (ผ่าน DC)'
      : data.type === 'VD'
      ? 'ใบปะหน้าสินค้า (ส่งตรง VD)'
      : 'ใบปะหน้าพัสดุ 3PL (KEX)'

  return (
    <Modal open onClose={onClose} size="narrow" className="shipping-label-modal">
      <div className="no-print" style={{ marginBottom: 12, textAlign: 'center' }}>
        <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>{title}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-mute)', margin: '4px 0 0' }}>
          ขนาดมาตรฐาน 100×150 มม. สำหรับติดหน้ากล่องพัสดุ
        </p>
      </div>

      <div className="print-area" style={{ display: 'flex', justifyContent: 'center' }}>
        {data.type === 'KEX' ? (
          <KexLabel data={data} />
        ) : (
          <ThaiwasaduLabel data={data} />
        )}
      </div>

      <div className="modal-actions no-print" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn" onClick={onClose}>
          ปิด
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span>🖨️ พิมพ์ใบปะหน้า</span>
        </button>
      </div>
    </Modal>
  )
}
