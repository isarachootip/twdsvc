'use client'

import Modal from '@/components/ui/Modal'
import AddressFields, { type Address } from '@/components/ui/AddressFields'

export interface TaxInfo {
  name: string
  id: string
  addr: Address
}

interface TaxInvoiceModalProps {
  open: boolean
  taxDraft: TaxInfo
  onChange: (draft: TaxInfo) => void
  onClose: (save: boolean) => void
}

export function TaxInvoiceModal({
  open,
  taxDraft,
  onChange,
  onClose,
}: TaxInvoiceModalProps) {
  return (
    <Modal open={open} onClose={() => onClose(false)}>
      <h3 style={{ margin: '0 0 4px' }}>ที่อยู่สำหรับออกใบกำกับภาษี</h3>
      <p className="hint">รูปแบบเดียวกับที่อยู่ลูกค้าด้านบน กรอกข้อมูลที่แตกต่างจากที่อยู่ลูกค้า</p>
      <div className="grid2">
        <div className="field">
          <label>ชื่อ / บริษัท (สำหรับใบกำกับภาษี)</label>
          <input
            className="inp"
            value={taxDraft.name}
            onChange={e => onChange({ ...taxDraft, name: e.target.value })}
            placeholder="ชื่อผู้ออกใบกำกับ"
          />
        </div>
        <div className="field">
          <label>เลขประจำตัวผู้เสียภาษี</label>
          <input
            className="inp"
            inputMode="numeric"
            maxLength={13}
            value={taxDraft.id}
            onChange={e => onChange({ ...taxDraft, id: e.target.value.replace(/\D/g, '') })}
            placeholder="13 หลัก"
          />
        </div>
      </div>
      <div className="divider" />
      <AddressFields
        value={taxDraft.addr}
        onChange={a => onChange({ ...taxDraft, addr: a })}
      />
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={() => onClose(true)}>บันทึก</button>
        <button className="btn" onClick={() => onClose(false)}>ยกเลิก</button>
      </div>
    </Modal>
  )
}
