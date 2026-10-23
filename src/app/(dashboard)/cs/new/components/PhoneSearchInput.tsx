'use client'

import PhoneInput from '@/components/ui/PhoneInput'
import { formatPhone } from '@/lib/phone-utils'
import type { CustomerLookupResult } from './CustomerSection'

interface PhoneSearchInputProps {
  phone: string
  onPhoneChange: (val: string) => void
  candidates: CustomerLookupResult[]
  searching: boolean
  found: CustomerLookupResult | null
  isNewCustomer: boolean
  onPickCustomer: (cust: CustomerLookupResult) => void
  onCloseDropdown: () => void
  saved: boolean
}

export function PhoneSearchInput({
  phone,
  onPhoneChange,
  candidates,
  searching,
  found,
  isNewCustomer,
  onPickCustomer,
  onCloseDropdown,
  saved,
}: PhoneSearchInputProps) {
  return (
    <div className="field" style={{ position: 'relative', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label>
          เบอร์โทรศัพท์ (ค้นหาลูกค้า) <span style={{ color: 'var(--red)' }}>*</span>
        </label>
        {searching && !saved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            กำลังค้นหาข้อมูลลูกค้า...
          </span>
        )}
      </div>

      <PhoneInput
        className="inp"
        placeholder="พิมพ์เบอร์โทร 3 หลักขึ้นไปเพื่อค้นหาลูกค้าเดิม หรือกรอกเบอร์ลูกค้าใหม่ (08xxxxxxxx)"
        value={phone}
        onChange={onPhoneChange}
        onBlur={() => setTimeout(onCloseDropdown, 200)}
        autoFocus
        required
      />

      {!saved && candidates.length > 0 && (
        <div
          style={{
            position: 'absolute',
            zIndex: 25,
            left: 0,
            right: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            marginTop: 4,
            maxHeight: 240,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          {candidates.map(c => (
            <button
              type="button"
              key={c.customerPhone}
              onMouseDown={() => onPickCustomer(c)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: 13,
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span>
                  <b>{formatPhone(c.customerPhone)}</b> — {c.customerName}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  ประวัติซ่อม {c.jobCount} งาน
                </span>
              </div>
              {c.customerAddress && (
                <div className="sub-mute" style={{ fontSize: 11.5, marginTop: 2 }}>
                  {c.customerAddress}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {!saved && found && (
        <div style={{ marginTop: 6 }}>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            ดึงข้อมูลลูกค้าเดิมอัตโนมัติแล้ว: <b>{found.customerName}</b> (ประวัติซ่อม {found.jobCount} งาน) · แก้ไขข้อมูลทับได้
          </span>
        </div>
      )}

      {!saved && !found && isNewCustomer && !searching && (
        <div style={{ marginTop: 6 }}>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            ลูกค้าใหม่ (ไม่พบประวัติเบอร์นี้ในระบบ) · กรอกชื่อและที่อยู่ด้านล่างได้เลย
          </span>
        </div>
      )}
    </div>
  )
}
