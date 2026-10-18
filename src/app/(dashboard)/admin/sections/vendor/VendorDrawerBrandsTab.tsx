'use client'

import React from 'react'
import { X, Plus } from 'lucide-react'
import { NamedOption } from './vendor-types'

interface VendorDrawerBrandsTabProps {
  brandIds: number[]
  sizeIds: number[]
  brands: NamedOption[]
  sizes: NamedOption[]
  onChangeBrands: (ids: number[]) => void
  onChangeSizes: (ids: number[]) => void
}

export function VendorDrawerBrandsTab({
  brandIds,
  sizeIds,
  brands,
  sizes,
  onChangeBrands,
  onChangeSizes,
}: VendorDrawerBrandsTabProps) {
  const availableBrands = brands.filter(b => !brandIds.includes(b.id))
  const availableSizes = sizes.filter(s => !sizeIds.includes(s.id))

  const handleAddBrand = (id: number) => {
    if (!id) return
    onChangeBrands([...new Set([...brandIds, id])])
  }

  const handleRemoveBrand = (id: number) => {
    onChangeBrands(brandIds.filter(b => b !== id))
  }

  const handleAddSize = (id: number) => {
    if (!id) return
    onChangeSizes([...new Set([...sizeIds, id])])
  }

  const handleRemoveSize = (id: number) => {
    onChangeSizes(sizeIds.filter(s => s !== id))
  }

  return (
    <div className="space-y-6">
      {/* Brands Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-bold text-slate-800">แบรนด์สินค้าที่รับผิดชอบ</label>
            <p className="text-[11px] text-slate-400">
              เลือกแบรนด์ที่คู่ค้ารายนี้ได้รับอนุญาตให้รับงานซ่อม
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">{brandIds.length} แบรนด์</span>
        </div>

        {/* Selected Brands Tags */}
        <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded-lg mb-2">
          {brandIds.length === 0 ? (
            <span className="text-xs text-slate-400 py-1">ยังไม่ได้เลือกแบรนด์ (ไม่จำกัดแบรนด์)</span>
          ) : (
            brandIds.map(id => {
              const b = brands.find(x => x.id === id)
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
                >
                  <span>{b?.name || id}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBrand(id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })
          )}
        </div>

        {/* Add Brand Select */}
        <div className="flex items-center gap-2">
          <select
            className="sel text-xs flex-1"
            value=""
            onChange={e => handleAddBrand(Number(e.target.value))}
          >
            <option value="">+ เลือกเพิ่มแบรนด์ ({availableBrands.length} แบรนด์ที่เหลือ)...</option>
            {availableBrands.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sizes Section */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-bold text-slate-800">ขนาดสินค้าที่รับผิดชอบ</label>
            <p className="text-[11px] text-slate-400">
              (ว่างไว้ = รับผิดชอบทุกขนาดสินค้า S, M, L, XL)
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {sizeIds.length === 0 ? 'ทุกขนาด' : `${sizeIds.length} ขนาด`}
          </span>
        </div>

        {/* Selected Sizes Tags */}
        <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded-lg mb-2">
          {sizeIds.length === 0 ? (
            <span className="text-xs text-slate-400 py-1">รองรับทุกขนาดสินค้า</span>
          ) : (
            sizeIds.map(id => {
              const s = sizes.find(x => x.id === id)
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
                >
                  <span>{s?.name || id}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })
          )}
        </div>

        {/* Add Size Select */}
        <div className="flex items-center gap-2">
          <select
            className="sel text-xs flex-1"
            value=""
            onChange={e => handleAddSize(Number(e.target.value))}
          >
            <option value="">+ เลือกเพิ่มขนาดสินค้า...</option>
            {availableSizes.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
