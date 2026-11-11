'use client'

import React from 'react'
import type { AuthorizedBrandItem, VendorApplicationFormV6 } from '../types-v6'
import { DEFAULT_VENDOR_BRANDS } from '@/lib/data/vendor-brands'
import { Plus, Trash2 } from 'lucide-react'

const AUTH_YES = 'เป็นศูนย์บริการ Authorized ของแบรนด์ (ระบุในตาราง)' as const
const AUTH_NO = 'ไม่ได้เป็นศูนย์บริการ Authorized' as const

interface Step1AuthorizedSectionProps {
  authorized: VendorApplicationFormV6['authorized']
  authorizedBrands: AuthorizedBrandItem[]
  onChange: (patch: Pick<VendorApplicationFormV6, 'authorized' | 'authorizedBrands'>) => void
}

export function Step1AuthorizedSection({
  authorized,
  authorizedBrands,
  onChange,
}: Step1AuthorizedSectionProps) {
  const isAuthorized = authorized === AUTH_YES

  const handleUpdateRow = (idx: number, patch: Partial<AuthorizedBrandItem>) => {
    const next = [...authorizedBrands]
    next[idx] = { ...next[idx], ...patch }
    onChange({ authorized, authorizedBrands: next })
  }

  const handleAddRow = () => {
    onChange({
      authorized: AUTH_YES,
      authorizedBrands: [
        ...authorizedBrands,
        { brand: '', productType: '', certNo: '', expireDate: '' },
      ],
    })
  }

  const handleRemoveRow = (idx: number) => {
    if (authorizedBrands.length <= 1) {
      onChange({
        authorized,
        authorizedBrands: [{ brand: '', productType: '', certNo: '', expireDate: '' }],
      })
      return
    }
    onChange({
      authorized,
      authorizedBrands: authorizedBrands.filter((_, i) => i !== idx),
    })
  }

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      <label className="text-xs font-bold text-slate-800 block">
        1.4 สถานะการเป็นศูนย์บริการแต่งตั้งจากแบรนด์ (Authorized Service Center) *
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <label className="inline-flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer">
          <input
            type="radio"
            name="authorizedStatus"
            checked={!isAuthorized}
            onChange={() => onChange({ authorized: AUTH_NO, authorizedBrands })}
            className="accent-red-700"
          />
          <div>
            <div className="font-semibold text-slate-800">ศูนย์ซ่อมทั่วไป (คู่ค้าทั่วไป)</div>
            <div className="text-[11px] text-slate-500">ไม่ได้เป็นตัวแทนศูนย์บริการแต่งตั้งจากเจ้าของแบรนด์โดยตรง</div>
          </div>
        </label>

        <label className="inline-flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer">
          <input
            type="radio"
            name="authorizedStatus"
            checked={isAuthorized}
            onChange={() =>
              onChange({
                authorized: AUTH_YES,
                authorizedBrands:
                  authorizedBrands.length > 0
                    ? authorizedBrands
                    : [{ brand: '', productType: '', certNo: '', expireDate: '' }],
              })
            }
            className="accent-red-700"
          />
          <div>
            <div className="font-semibold text-sky-800">ศูนย์บริการแต่งตั้งจากแบรนด์ (Authorized)</div>
            <div className="text-[11px] text-slate-500">ได้รับแต่งตั้งอย่างเป็นทางการ รองรับงานเคลมในประกัน</div>
          </div>
        </label>
      </div>

      {isAuthorized && (
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">รายชื่อแบรนด์ที่ได้รับการแต่งตั้ง (Authorized Brands)</span>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 hover:text-red-800"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่มแบรนด์
            </button>
          </div>

          <datalist id="v6-authorized-brand-list">
            {DEFAULT_VENDOR_BRANDS.map(b => (
              <option key={b} value={b} />
            ))}
          </datalist>

          <div className="space-y-2">
            {authorizedBrands.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  list="v6-authorized-brand-list"
                  value={row.brand}
                  onChange={e => handleUpdateRow(idx, { brand: e.target.value })}
                  placeholder="ชื่อแบรนด์ เช่น MAKITA, HITACHI *"
                  className="sm:col-span-4 h-9 px-2.5 border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  value={row.productType}
                  onChange={e => handleUpdateRow(idx, { productType: e.target.value })}
                  placeholder="กลุ่มสินค้า เช่น เครื่องมือช่าง"
                  className="sm:col-span-4 h-9 px-2.5 border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  value={row.certNo}
                  onChange={e => handleUpdateRow(idx, { certNo: e.target.value })}
                  placeholder="เลขใบแต่งตั้ง (ถ้ามี)"
                  className="sm:col-span-3 h-9 px-2.5 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="sm:col-span-1 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600"
                  title="ลบรายการ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
