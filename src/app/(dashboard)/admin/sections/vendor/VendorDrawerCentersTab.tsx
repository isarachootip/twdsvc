'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { SiteLite } from '../admin-helpers'
import { VendorCenterRow } from './vendor-types'

interface VendorDrawerCentersTabProps {
  centers: VendorCenterRow[]
  sites: SiteLite[]
  parentCode: string
  defaultGpPct: number | string
  defaultRepairSlaDays: number | string
  onChangeCenters: (centers: VendorCenterRow[]) => void
}

export function VendorDrawerCentersTab({
  centers,
  sites,
  parentCode,
  defaultGpPct,
  defaultRepairSlaDays,
  onChangeCenters,
}: VendorDrawerCentersTabProps) {
  const handleAdd = () => {
    onChangeCenters([
      ...centers,
      {
        code: `${parentCode || 'VD'}-${centers.length + 1}`,
        zoneSiteId: sites[0]?.id || '',
        address: '',
        phone: '',
        deliveryMethod: 'DSD',
        gpPctOverride: '',
        repairSlaDaysOverride: '',
      },
    ])
  }

  const handleUpdate = (idx: number, patch: Partial<VendorCenterRow>) => {
    onChangeCenters(centers.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const handleRemove = (idx: number) => {
    onChangeCenters(centers.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800">ศูนย์บริการย่อย (สาขาผู้รับซ่อม)</h4>
          <p className="text-[11px] text-slate-400">
            กำหนดรหัสสาขา โซนรับส่งงาน และค่า Override เฉพาะศูนย์ (หากมี)
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="btn btn-secondary text-xs flex items-center gap-1 py-1 px-2.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มศูนย์ย่อย</span>
        </button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs z-10 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-2.5 w-24">รหัสศูนย์</th>
                <th className="py-2 px-2.5 w-36">โซน (สาขา/DC)</th>
                <th className="py-2 px-2.5">ที่อยู่</th>
                <th className="py-2 px-2.5 w-28">โทร</th>
                <th className="py-2 px-2.5 w-24">วิธีรับส่ง</th>
                <th className="py-2 px-2.5 w-24">GP% override</th>
                <th className="py-2 px-2.5 w-24">SLA override</th>
                <th className="py-2 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {centers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    ยังไม่มีศูนย์บริการย่อย กรุณากดปุ่ม "+ เพิ่มศูนย์ย่อย" ด้านบน
                  </td>
                </tr>
              ) : (
                centers.map((c, ci) => (
                  <tr key={c.id || `c-${ci}`} className="hover:bg-slate-50/60">
                    <td className="p-1.5">
                      <input
                        className="inp inp-sm w-full font-mono text-xs"
                        value={c.code}
                        placeholder="รหัสศูนย์"
                        onChange={e => handleUpdate(ci, { code: e.target.value })}
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        className="sel text-xs w-full"
                        value={c.zoneSiteId || ''}
                        onChange={e => handleUpdate(ci, { zoneSiteId: e.target.value })}
                      >
                        <option value="">- เลือกโซน -</option>
                        {sites.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.type === 'DC' ? '(DC)' : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        className="inp inp-sm w-full text-xs"
                        value={c.address || ''}
                        placeholder="ที่อยู่ศูนย์บริการ"
                        onChange={e => handleUpdate(ci, { address: e.target.value })}
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        className="inp inp-sm w-full text-xs font-mono"
                        value={c.phone || ''}
                        placeholder="เบอร์โทร"
                        onChange={e => handleUpdate(ci, { phone: e.target.value })}
                      />
                    </td>
                    <td className="p-1.5">
                      <select
                        className="sel text-xs w-full"
                        value={c.deliveryMethod}
                        onChange={e => handleUpdate(ci, { deliveryMethod: e.target.value })}
                      >
                        <option value="DSD">DSD</option>
                        <option value="DC">DC</option>
                        <option value="DC_DSD">DC+DSD</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        className="inp inp-sm w-full text-xs"
                        placeholder={`${defaultGpPct}%`}
                        value={c.gpPctOverride ?? ''}
                        onChange={e => handleUpdate(ci, { gpPctOverride: e.target.value })}
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        className="inp inp-sm w-full text-xs"
                        placeholder={`${defaultRepairSlaDays} วัน`}
                        value={c.repairSlaDaysOverride ?? ''}
                        onChange={e =>
                          handleUpdate(ci, { repairSlaDaysOverride: e.target.value })
                        }
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(ci)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="ลบศูนย์บริการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
