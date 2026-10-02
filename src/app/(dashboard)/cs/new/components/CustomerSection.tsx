'use client'

import AddressFields, { formatAddress, type Address } from '@/components/ui/AddressFields'
import { type TaxInfo } from './TaxInvoiceModal'

export interface BranchOption {
  id: string
  code: string
  name: string
}

export interface CustomerLookupResult {
  customerName: string
  customerAddress: string | null
  customerZip: string | null
  jobCount: number
}

interface CustomerSectionProps {
  role: string
  selectedBranchId: string
  setSelectedBranchId: (id: string) => void
  branchList: BranchOption[]
  firstName: string
  setFirstName: (val: string) => void
  lastName: string
  setLastName: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  addr: Address
  setAddr: React.Dispatch<React.SetStateAction<Address>>
  found: CustomerLookupResult | null
  setFound: (val: CustomerLookupResult | null) => void
  taxSame: boolean
  tax: TaxInfo | null
  onTaxCheckbox: (checked: boolean) => void
  onEditTax: () => void
  saved: boolean
}

export function CustomerSection({
  role,
  selectedBranchId,
  setSelectedBranchId,
  branchList,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  addr,
  setAddr,
  found,
  setFound,
  taxSame,
  tax,
  onTaxCheckbox,
  onEditTax,
  saved,
}: CustomerSectionProps) {
  const handleUseFoundCustomer = () => {
    if (!found) return
    const parts = (found.customerName || '').trim().split(/\s+/)
    setFirstName(parts[0] || '')
    setLastName(parts.slice(1).join(' ') || '')
    setAddr(a => ({
      ...a,
      street: found.customerAddress ?? a.street,
      zip: found.customerZip ?? a.zip,
    }))
    setFound(null)
  }

  return (
    <div className="pcard">
      <h3>ข้อมูลลูกค้า</h3>
      <p className="hint">ข้อมูลพื้นฐานลูกค้าและที่อยู่สำหรับติดต่อ/ออกใบกำกับภาษี</p>
      {role === 'ADMIN' && (
        <div className="field" style={{ marginBottom: 12 }}>
          <label>
            สาขาที่เปิดงาน <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <select
            className="sel"
            value={selectedBranchId}
            onChange={e => setSelectedBranchId(e.target.value)}
          >
            {branchList.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid3">
        <div className="field">
          <label>ชื่อลูกค้า <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="inp" placeholder="ชื่อ" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div className="field">
          <label>นามสกุล <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="inp" placeholder="นามสกุล" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div className="field">
          <label>เบอร์โทรศัพท์ <span style={{ color: 'var(--red)' }}>*</span></label>
          <input
            className="inp"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="08xxxxxxxx"
            value={phone}
            onChange={e => {
              const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 10)
              setPhone(onlyNums)
            }}
          />
        </div>
      </div>
      {found && !saved && (
        <div className="note blue" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span>
            พบลูกค้าเดิม: <b>{found.customerName}</b> ({found.jobCount} งาน)
            {found.customerAddress ? ` · ${found.customerAddress}` : ''}
          </span>
          <button type="button" className="btn" onClick={handleUseFoundCustomer}>
            ใช้ข้อมูลนี้
          </button>
        </div>
      )}
      <div className="divider" />
      <p className="hint" style={{ marginBottom: 8 }}>
        ที่อยู่ (กรอกรหัสไปรษณีย์เพื่อดึงข้อมูลอัตโนมัติ หรือเลือกจาก dropdown)
      </p>
      <AddressFields value={addr} onChange={setAddr} />
      <div className="checkbox-row">
        <input
          type="checkbox"
          id="tax-same"
          checked={taxSame}
          onChange={e => onTaxCheckbox(e.target.checked)}
        />
        <label htmlFor="tax-same">ใช้ที่อยู่นี้ในการออกใบกำกับภาษี</label>
      </div>
      {!taxSame && tax && (
        <div className="note">
          ออกใบกำกับภาษีในนาม: <b>{tax.name}</b> (เลขผู้เสียภาษี {tax.id}) — {formatAddress(tax.addr)}{' '}
          <button type="button" className="link-btn" onClick={onEditTax}>
            แก้ไข
          </button>
        </div>
      )}
    </div>
  )
}
