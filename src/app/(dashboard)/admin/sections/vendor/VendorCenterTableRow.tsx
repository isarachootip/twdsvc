'use client'

import React from 'react'
import { Trash2, MapPin } from 'lucide-react'
import { SiteLite } from '../admin-helpers'
import { VendorCenterRow } from './vendor-types'
import { matchSiteByPostalCode } from './vendor-address-helper'

interface VendorCenterTableRowProps {
  center: VendorCenterRow
  sites: SiteLite[]
  defaultGpPct: number | string
  defaultRepairSlaDays: number | string
  onUpdate: (patch: Partial<VendorCenterRow>) => void
  onRemove: () => void
  onOpenAddressModal: () => void
}

export function VendorCenterTableRow({
  center,
  sites,
  defaultGpPct,
  defaultRepairSlaDays,
  onUpdate,
  onRemove,
  onOpenAddressModal,
}: VendorCenterTableRowProps) {
  const handlePostalCodeChange = (newZip: string) => {
    const patch: Partial<VendorCenterRow> = { postalCode: newZip }
    if (newZip.trim().length === 5) {
      const matched = matchSiteByPostalCode(newZip, sites)
      if (matched) {
        patch.zoneSiteId = matched.id
      }
    }
    onUpdate(patch)
  }

  return (
    <tr className="hover:bg-slate-50/60">
      <td className="p-1.5">
        <input
          className="inp inp-sm w-full font-mono text-xs"
          value={center.code}
          placeholder="รหัสศูนย์"
          onChange={e => onUpdate({ code: e.target.value })}
        />
      </td>
      <td className="p-1.5">
        <select
          className="sel text-xs w-full"
          value={center.zoneSiteId || ''}
          onChange={e => onUpdate({ zoneSiteId: e.target.value })}
        >
          <option value="">- เลือกโซน -</option>
          {sites.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.type === 'DC' ? '(DC)' : ''}
            </option>
          ))}
        </select>
      </td>
      <td className="p-1.5 w-24">
        <input
          className="inp inp-sm w-full text-xs font-mono text-center"
          value={center.postalCode || ''}
          placeholder="รหัส ปณ."
          maxLength={5}
          title={
            center.postalCode
              ? `รหัส ปณ. ${center.postalCode}`
              : 'กรอกรหัส ปณ. 5 หลักเพื่อจับคู่สาขา/DC อัตโนมัติ'
          }
          onChange={e => handlePostalCodeChange(e.target.value)}
        />
      </td>
      <td className="p-1.5">
        <div className="relative flex items-center">
          <input
            className="inp inp-sm w-full text-xs pr-7"
            value={center.address || ''}
            placeholder="พิมพ์ที่อยู่ หรือกดหมุด"
            title={center.address || 'คลิกไอคอนหมุดเพื่อเปิดหน้าต่างแก้ไขที่อยู่'}
            onChange={e => onUpdate({ address: e.target.value })}
          />
          <button
            type="button"
            onClick={onOpenAddressModal}
            className="absolute right-1 p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
            title="เปิดหน้าต่างแก้ไขที่อยู่แบบละเอียด"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      <td className="p-1.5">
        <input
          className="inp inp-sm w-full text-xs font-mono"
          value={center.phone || ''}
          placeholder="เบอร์โทร"
          onChange={e => onUpdate({ phone: e.target.value })}
        />
      </td>
      <td className="p-1.5">
        <select
          className="sel text-xs w-full"
          value={center.deliveryMethod}
          onChange={e => onUpdate({ deliveryMethod: e.target.value })}
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
          value={center.gpPctOverride ?? ''}
          onChange={e => onUpdate({ gpPctOverride: e.target.value })}
        />
      </td>
      <td className="p-1.5">
        <input
          type="number"
          className="inp inp-sm w-full text-xs"
          placeholder={`${defaultRepairSlaDays} วัน`}
          value={center.repairSlaDaysOverride ?? ''}
          onChange={e => onUpdate({ repairSlaDaysOverride: e.target.value })}
        />
      </td>
      <td className="p-1.5 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
          title="ลบศูนย์บริการนี้"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}
