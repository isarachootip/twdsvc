'use client'

import { type SiteLite, Row } from './admin-helpers'

export interface VendorCenterRow {
  id?: string
  code: string
  zoneSiteId?: string
  address?: string
  phone?: string
  deliveryMethod: string
  gpPctOverride?: number | string
  repairSlaDaysOverride?: number | string
}

interface VendorCenterTableProps {
  parentIndex: number
  parentCode: string
  parentName: string
  defaultGpPct: number | string
  defaultRepairSlaDays: number | string
  centers: VendorCenterRow[]
  sites: SiteLite[]
  onUpdateCenter: (pi: number, ci: number, patch: Partial<VendorCenterRow>) => void
  onAddCenter: (pi: number) => void
  onRemoveCenter: (pi: number, ci: number) => void
  onRemoveParent: (pi: number) => void
}

export function VendorCenterTable({
  parentIndex: pi,
  parentCode,
  parentName,
  defaultGpPct,
  defaultRepairSlaDays,
  centers,
  sites,
  onUpdateCenter,
  onAddCenter,
  onRemoveCenter,
  onRemoveParent,
}: VendorCenterTableProps) {
  return (
    <>
      <h4 style={{ fontSize: 13, margin: '0 0 8px' }}>
        ศูนย์บริการย่อยของ {parentName || '(VD ใหม่)'}
      </h4>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead>
            <tr>
              <th>รหัสศูนย์ย่อย</th>
              <th>โซน (สาขา/คลัง)</th>
              <th>ที่อยู่</th>
              <th>โทร</th>
              <th>วิธีรับ-ส่ง</th>
              <th>GP% override</th>
              <th>SLA override (วัน)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {centers.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">
                  ยังไม่มีศูนย์ย่อย
                </td>
              </tr>
            )}
            {centers.map((c, ci) => (
              <tr key={c.id ?? `nc-${ci}`}>
                <td>
                  <input
                    className="inp inp-sm"
                    style={{ width: 110 }}
                    value={c.code}
                    onChange={e => onUpdateCenter(pi, ci, { code: e.target.value })}
                  />
                </td>
                <td>
                  <select
                    className="sel"
                    value={c.zoneSiteId ?? ''}
                    onChange={e => onUpdateCenter(pi, ci, { zoneSiteId: e.target.value })}
                  >
                    <option value="">-</option>
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.type === 'DC' ? ' (DC)' : ''}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    value={c.address ?? ''}
                    onChange={e => onUpdateCenter(pi, ci, { address: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    style={{ width: 110 }}
                    value={c.phone ?? ''}
                    onChange={e => onUpdateCenter(pi, ci, { phone: e.target.value })}
                  />
                </td>
                <td>
                  <select
                    className="sel"
                    value={c.deliveryMethod}
                    onChange={e => onUpdateCenter(pi, ci, { deliveryMethod: e.target.value })}
                  >
                    <option value="DSD">DSD</option>
                    <option value="DC">DC</option>
                    <option value="DC_DSD">DC + DSD</option>
                  </select>
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    style={{ width: 90 }}
                    placeholder={`ค่าเริ่มต้น: ${defaultGpPct}%`}
                    value={c.gpPctOverride ?? ''}
                    onChange={e => onUpdateCenter(pi, ci, { gpPctOverride: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    style={{ width: 90 }}
                    placeholder={`ค่าเริ่มต้น: ${defaultRepairSlaDays} วัน`}
                    value={c.repairSlaDaysOverride ?? ''}
                    onChange={e =>
                      onUpdateCenter(pi, ci, { repairSlaDaysOverride: e.target.value })
                    }
                  />
                </td>
                <td>
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveCenter(pi, ci)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Row between>
        <button className="btn" onClick={() => onAddCenter(pi)}>
          + เพิ่มศูนย์ย่อย
        </button>
        <button
          className="remove-btn"
          style={{ fontSize: 13 }}
          onClick={() => onRemoveParent(pi)}
        >
          ลบ VD หลักนี้ ✕
        </button>
      </Row>
    </>
  )
}
