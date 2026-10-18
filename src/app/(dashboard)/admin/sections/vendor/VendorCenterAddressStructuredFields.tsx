'use client'

import React from 'react'
import { Check } from 'lucide-react'

export interface StructuredFieldsState {
  houseNo: string
  subdistrict: string
  district: string
  province: string
  postalCode: string
}

interface StructuredFieldsProps {
  fields: StructuredFieldsState
  onChange: (patch: Partial<StructuredFieldsState>) => void
  onApply: () => void
  preview: string
}

export function VendorCenterAddressStructuredFields({
  fields,
  onChange,
  onApply,
  preview,
}: StructuredFieldsProps) {
  return (
    <div className="space-y-2.5">
      <div>
        <label className="font-medium text-slate-600 block mb-1">
          บ้านเลขที่ / ซอย / ถนน / อาคาร
        </label>
        <input
          className="inp inp-sm w-full"
          placeholder="เช่น 99/9 หมู่ 2 ถ.เพชรเกษม"
          value={fields.houseNo}
          onChange={e => onChange({ houseNo: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-medium text-slate-600 block mb-1">ตำบล / แขวง</label>
          <input
            className="inp inp-sm w-full"
            placeholder="เช่น อ้อมน้อย"
            value={fields.subdistrict}
            onChange={e => onChange({ subdistrict: e.target.value })}
          />
        </div>
        <div>
          <label className="font-medium text-slate-600 block mb-1">อำเภอ / เขต</label>
          <input
            className="inp inp-sm w-full"
            placeholder="เช่น กระทุ่มแบน"
            value={fields.district}
            onChange={e => onChange({ district: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="font-medium text-slate-600 block mb-1">จังหวัด</label>
          <input
            className="inp inp-sm w-full"
            placeholder="เช่น สมุทรสาคร"
            value={fields.province}
            onChange={e => onChange({ province: e.target.value })}
          />
        </div>
        <div>
          <label className="font-medium text-slate-600 block mb-1">รหัสไปรษณีย์</label>
          <input
            className="inp inp-sm w-full font-mono"
            placeholder="เช่น 74130"
            maxLength={5}
            value={fields.postalCode}
            onChange={e => onChange({ postalCode: e.target.value })}
          />
        </div>
      </div>

      {preview && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] text-slate-400 block font-medium">ตัวอย่างผลลัพธ์:</span>
          <p className="text-slate-700 text-xs font-medium mt-0.5">{preview}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onApply}
        disabled={!preview}
        className="btn btn-secondary text-xs w-full py-1.5 flex items-center justify-center gap-1.5"
      >
        <Check className="w-3.5 h-3.5" />
        <span>นำไปใส่เป็นที่อยู่เต็ม</span>
      </button>
    </div>
  )
}
