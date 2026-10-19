'use client'

import DateInput from '@/components/ui/DateInput'
import type { JobView } from '@/lib/job-view'
import type { PickupRouteType, PickupSlipData } from '@/lib/pickup-slip'

const ROUTE_OPTIONS: Array<{ key: PickupRouteType; title: string; sub: string }> = [
  { key: 'GR_TO_DC', title: 'GR → DC', sub: 'รถ DC มารับที่สาขา' },
  { key: 'GR_TO_VD', title: 'GR → VD', sub: 'ขนส่ง VD มารับที่สาขา' },
  { key: 'DC_TO_VD', title: 'DC → VD', sub: 'VD มารับที่ DC' },
  { key: 'DC_TO_GR', title: 'DC → GR', sub: 'รถ DC ส่งคืนสาขา' },
]

export interface PickupSlipFormProps {
  route: PickupRouteType
  setRoute: (r: PickupRouteType) => void
  candidates: JobView[]
  selectedIds: string[]
  onToggleJob: (j: JobView) => void
  senderName: string
  setSenderName: (v: string) => void
  senderPhone: string
  setSenderPhone: (v: string) => void
  receiverName: string
  setReceiverName: (v: string) => void
  receiverPhone: string
  setReceiverPhone: (v: string) => void
  driverName: string
  setDriverName: (v: string) => void
  driverPhone: string
  setDriverPhone: (v: string) => void
  vehiclePlate: string
  setVehiclePlate: (v: string) => void
  carrierLabel: string
  setCarrierLabel: (v: string) => void
  scheduledDate: string
  setScheduledDate: (v: string) => void
  scheduledTime: string
  setScheduledTime: (v: string) => void
  itemsText: string
  setItemsText: (v: string) => void
  printTwoCopies: boolean
  setPrintTwoCopies: (v: boolean) => void
  driverUrl: string | null
  baseSlip: PickupSlipData
  isPendingDispatch?: boolean
  disabled: boolean
  onPrintAndConfirm: () => void
  onCreateLink?: () => void
}

export default function PickupSlipForm(p: PickupSlipFormProps) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>ใบรับสินค้า (คนรถถือ)</h3>
        <p className="sub-mute" style={{ margin: '2px 0 0', fontSize: 11.5 }}>
          แสดงที่ GR สาขา หรือที่ DC เพื่อรับสินค้าไปปลายทาง
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {ROUTE_OPTIONS.map(opt => {
          const active = p.route === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => p.setRoute(opt.key)}
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                border: active ? '2px solid #C8102E' : '1px solid var(--border)',
                backgroundColor: active ? '#FEF2F2' : '#fff',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 12, color: active ? '#C8102E' : '#111827' }}>{opt.title}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{opt.sub}</div>
            </button>
          )
        })}
      </div>

      {p.candidates.length > 1 && (
        <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
            เลือกงานในสาขาเดียวกัน ({p.selectedIds.length}/{p.candidates.length} งาน)
          </div>
          <div style={{ maxHeight: 84, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {p.candidates.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={p.selectedIds.includes(c.id)} onChange={() => p.onToggleJob(c)} />
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.jobNo}</span>
                <span className="sub-mute" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.productName}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600 }}>ผู้ส่งมอบ (ต้นทาง)</label>
          <input className="inp inp-sm" value={p.senderName} onChange={e => p.setSenderName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600 }}>เบอร์ต้นทาง</label>
          <input className="inp inp-sm" value={p.senderPhone} onChange={e => p.setSenderPhone(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 6 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600 }}>ผู้รับ (ปลายทาง)</label>
          <input className="inp inp-sm" value={p.receiverName} onChange={e => p.setReceiverName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600 }}>เบอร์ปลายทาง</label>
          <input className="inp inp-sm" value={p.receiverPhone} onChange={e => p.setReceiverPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600 }}>ข้อมูลคนรถ (ไม่บังคับกรอก — แก้ไขได้)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
          <input className="inp inp-sm" placeholder="ชื่อคนรถ" value={p.driverName} onChange={e => p.setDriverName(e.target.value)} />
          <input className="inp inp-sm" placeholder="เบอร์โทรคนรถ" value={p.driverPhone} onChange={e => p.setDriverPhone(e.target.value)} />
          <input className="inp inp-sm" placeholder="ทะเบียนรถ" value={p.vehiclePlate} onChange={e => p.setVehiclePlate(e.target.value)} />
          <input className="inp inp-sm" placeholder="ขนส่ง (เช่น รถ DC)" value={p.carrierLabel} onChange={e => p.setCarrierLabel(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600 }}>วันที่นัดรับ</label>
          <DateInput className="inp inp-sm" value={p.scheduledDate} onChange={v => p.setScheduledDate(v)} style={{ width: '100%' }} ariaLabel="วันที่นัดรับ (dd/mm/yyyy)" />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600 }}>เวลานัด</label>
          <input type="time" className="inp inp-sm" value={p.scheduledTime} onChange={e => p.setScheduledTime(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 10.5, fontWeight: 600, display: 'block', marginBottom: 3 }}>
          รายการสินค้า (1 บรรทัด = 1 งาน: ใบแจ้งซ่อม | สินค้า | S/N | ลูกค้า | อาการ | กล่อง)
        </label>
        <textarea
          className="inp"
          rows={3}
          style={{ fontSize: 11, fontFamily: 'monospace', width: '100%' }}
          value={p.itemsText}
          onChange={e => p.setItemsText(e.target.value)}
        />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, cursor: 'pointer' }}>
        <input type="checkbox" checked={p.printTwoCopies} onChange={e => p.setPrintTwoCopies(e.target.checked)} />
        <span>พิมพ์ 2 ฉบับ (ฉบับคนรถ + ฉบับต้นทางเก็บ)</span>
      </label>

      {p.driverUrl && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="inp inp-sm" readOnly value={p.driverUrl} style={{ flex: 1, fontSize: 11 }} onFocus={e => e.target.select()} />
          <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(p.driverUrl!)}>คัดลอก</button>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        disabled={p.disabled}
        onClick={p.onPrintAndConfirm}
        style={{ width: '100%', padding: '10px 12px', fontWeight: 700, justifyContent: 'center' }}
      >
        🖨️ {p.isPendingDispatch ? `ยืนยันแจ้งคนรถ & พิมพ์ใบรับสินค้า (${p.baseSlip.totalJobs} งาน)` : 'พิมพ์ใบรับสินค้า'}
      </button>

      {p.isPendingDispatch && p.onCreateLink && (
        <button
          type="button"
          className="btn"
          disabled={p.disabled}
          onClick={p.onCreateLink}
          style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
        >
          🔗 แจ้งคนรถ + สร้างลิงก์ให้คนรถ
        </button>
      )}
    </div>
  )
}
