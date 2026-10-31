'use client'

import AddressFields, { formatAddress, type Address } from '@/components/ui/AddressFields'
import { BranchSearchSelect } from '@/components/ui/BranchSearchSelect'
import { type TaxInfo } from './TaxInvoiceModal'
import { PhoneSearchInput } from './PhoneSearchInput'

export interface BranchOption {
  id: string
  code: string
  stCode?: string | null
  nickname?: string | null
  name: string
  nameEn?: string | null
  legalName?: string | null
  address?: string | null
  subdistrict?: string | null
  district?: string | null
  province?: string | null
  postalCode?: string | null
  phone?: string | null
}

export interface CustomerLookupResult {
  customerName: string
  customerPhone: string
  customerAddress: string | null
  customerZip: string | null
  taxInvoiceName?: string | null
  taxInvoiceId?: string | null
  taxInvoiceAddr?: string | null
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
  phoneCandidates?: CustomerLookupResult[]
  searchingPhone?: boolean
  isNewCustomer?: boolean
  onPickCustomer?: (cust: CustomerLookupResult) => void
  onClosePhoneDropdown?: () => void
  addr: Address
  setAddr: React.Dispatch<React.SetStateAction<Address>>
  found: CustomerLookupResult | null
  setFound?: (val: CustomerLookupResult | null) => void
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
  phoneCandidates = [],
  searchingPhone = false,
  isNewCustomer = false,
  onPickCustomer = () => {},
  onClosePhoneDropdown = () => {},
  addr,
  setAddr,
  found,
  taxSame,
  tax,
  onTaxCheckbox,
  onEditTax,
  saved,
}: CustomerSectionProps) {
  return (
    <div className="pcard">
      <h3>ข้อมูลลูกค้า</h3>
      <p className="hint">เริ่มต้นด้วยการค้นหาเบอร์โทรศัพท์เพื่อดึงข้อมูลลูกค้าเดิมอัตโนมัติ หรือกรอกข้อมูลลูกค้าใหม่</p>
      {role === 'ADMIN' && (
        <div className="field" style={{ marginBottom: 12 }}>
          <label>
            สาขาที่เปิดงาน <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <BranchSearchSelect
            options={branchList}
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            placeholder="เลือกสาขาที่เปิดงาน..."
            disabled={saved}
          />
        </div>
      )}

      <PhoneSearchInput
        phone={phone}
        onPhoneChange={setPhone}
        candidates={phoneCandidates}
        searching={searchingPhone}
        found={found}
        isNewCustomer={isNewCustomer}
        onPickCustomer={onPickCustomer}
        onCloseDropdown={onClosePhoneDropdown}
        saved={saved}
      />

      <div className="grid2">
        <div className="field">
          <label>ชื่อลูกค้า <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="inp" placeholder="ชื่อ" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div className="field">
          <label>นามสกุล <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="inp" placeholder="นามสกุล" value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
      </div>

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
