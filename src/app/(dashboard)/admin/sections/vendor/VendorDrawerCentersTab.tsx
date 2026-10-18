'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { SiteLite } from '../admin-helpers'
import { VendorCenterRow } from './vendor-types'
import { VendorCenterAddressModal } from './VendorCenterAddressModal'
import { VendorCenterTableRow } from './VendorCenterTableRow'
import { matchSiteByPostalCode } from './vendor-address-helper'

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
  const [editingAddressIdx, setEditingAddressIdx] = useState<number | null>(null)

  const handleAdd = () => {
    onChangeCenters([
      ...centers,
      {
        code: `${parentCode || 'VD'}-${centers.length + 1}`,
        zoneSiteId: sites[0]?.id || '',
        address: '',
        postalCode: '',
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

  const activeEditingCenter = editingAddressIdx !== null ? centers[editingAddressIdx] : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800">ศูนย์บริการย่อย (สาขาผู้รับซ่อม)</h4>
          <p className="text-[11px] text-slate-400">
            กำหนดรหัสสาขา โซนรับส่งงาน รหัส ปณ. ที่อยู่ และค่า Override เฉพาะศูนย์
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
          <table className="w-full min-w-[1020px] text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs z-10 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-2.5 w-24">รหัสศูนย์</th>
                <th className="py-2 px-2.5 w-36">โซน (สาขา/DC)</th>
                <th className="py-2 px-2.5 w-24 text-center">รหัส ปณ.</th>
                <th className="py-2 px-2.5 min-w-[260px]">ที่อยู่</th>
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
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    ยังไม่มีศูนย์บริการย่อย กรุณากดปุ่ม "+ เพิ่มศูนย์ย่อย" ด้านบน
                  </td>
                </tr>
              ) : (
                centers.map((c, ci) => (
                  <VendorCenterTableRow
                    key={c.id || `c-${ci}`}
                    center={c}
                    sites={sites}
                    defaultGpPct={defaultGpPct}
                    defaultRepairSlaDays={defaultRepairSlaDays}
                    onUpdate={patch => handleUpdate(ci, patch)}
                    onRemove={() => handleRemove(ci)}
                    onOpenAddressModal={() => setEditingAddressIdx(ci)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeEditingCenter && editingAddressIdx !== null && (
        <VendorCenterAddressModal
          isOpen={true}
          centerCode={activeEditingCenter.code}
          initialAddress={activeEditingCenter.address || ''}
          initialPostalCode={activeEditingCenter.postalCode || ''}
          zoneSiteName={sites.find(s => s.id === activeEditingCenter.zoneSiteId)?.name}
          onClose={() => setEditingAddressIdx(null)}
          onSave={(newAddr, newZip) => {
            const patch: Partial<VendorCenterRow> = { address: newAddr }
            if (newZip) {
              patch.postalCode = newZip
              const matched = matchSiteByPostalCode(newZip, sites)
              if (matched) patch.zoneSiteId = matched.id
            }
            handleUpdate(editingAddressIdx, patch)
            setEditingAddressIdx(null)
          }}
        />
      )}
    </div>
  )
}
