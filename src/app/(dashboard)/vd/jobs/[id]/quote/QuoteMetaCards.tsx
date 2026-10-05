'use client'

import { fmtBaht } from '@/lib/constants'
import { VendorCenterOption } from './types'

interface QuoteMetaCardsProps {
  role: string
  hasWarranty: boolean
  openFee: number
  selectedCenterId: string
  vendorCenterId?: string | null
  vendorCenters: VendorCenterOption[]
  onCenterChange: (centerId: string) => void
}

export default function QuoteMetaCards({
  role,
  hasWarranty,
  openFee,
  selectedCenterId,
  vendorCenterId,
  vendorCenters,
  onCenterChange,
}: QuoteMetaCardsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {role === 'ADMIN' && (
        <div className="pcard" style={{ marginBottom: 0, padding: '14px 18px' }}>
          <div className="field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontWeight: 600, fontSize: 13, margin: 0, color: 'var(--text)' }}>
                ศูนย์ซ่อม (Vendor Center)
              </label>
              <span style={{ fontSize: 11.5, color: 'var(--blue)', background: 'var(--blue-tint)', padding: '2px 8px', borderRadius: 4 }}>
                Admin Mode: กำหนดหรือสลับศูนย์ซ่อมได้
              </span>
            </div>
            <select
              className="sel"
              style={{ width: '100%', fontSize: 13, height: 38 }}
              value={selectedCenterId || vendorCenterId || ''}
              onChange={e => onCenterChange(e.target.value)}
            >
              <option value="">-- เลือกศูนย์ซ่อม / ค่าเริ่มต้น --</option>
              {vendorCenters.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.vendorParent?.name ?? c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {/* Warranty Status Card */}
        <div
          className="pcard"
          style={{
            marginBottom: 0,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 2 }}>
              สถานะการรับประกัน (จาก CS)
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              {hasWarranty ? 'อยู่ในเงื่อนไขประกัน' : 'ไม่มีประกัน / หมดประกัน'}
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 600,
              background: hasWarranty ? 'var(--green-tint)' : 'var(--surface-2)',
              color: hasWarranty ? 'var(--green)' : 'var(--text-2)',
              border: `1px solid ${hasWarranty ? 'var(--green)' : 'var(--border-strong)'}`,
            }}
          >
            {hasWarranty ? '✓ มีประกัน' : '✕ ไม่มีประกัน'}
          </span>
        </div>

        {/* Inspection Fee Card */}
        <div
          className="pcard"
          style={{
            marginBottom: 0,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-mute)', marginBottom: 2 }}>
              ค่าตรวจเช็คเบื้องต้น (เปิดเครื่อง)
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
              ตามข้อตกลงอัตโนมัติของศูนย์ซ่อม
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: openFee > 0 ? 'var(--text)' : 'var(--green)' }}>
              {fmtBaht(openFee)}
            </span>
            {openFee === 0 && (
              <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
                ฟรีตามเงื่อนไข
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
