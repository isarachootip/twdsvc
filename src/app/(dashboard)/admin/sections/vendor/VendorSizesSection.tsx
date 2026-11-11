'use client'

import React from 'react'
import { X } from 'lucide-react'
import { NamedOption } from './vendor-types'

interface VendorSizesSectionProps {
  sizeIds: number[]
  sizes: NamedOption[]
  onChangeSizes: (ids: number[]) => void
}

export function VendorSizesSection({ sizeIds, sizes, onChangeSizes }: VendorSizesSectionProps) {
  const availableSizes = sizes.filter(s => !sizeIds.includes(s.id))

  const handleAddSize = (id: number) => {
    if (!id) return
    onChangeSizes([...new Set([...sizeIds, id])])
  }

  const handleRemoveSize = (id: number) => {
    onChangeSizes(sizeIds.filter(s => s !== id))
  }

  return (
    <div className="pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="text-xs font-bold text-slate-800">ขนาดสินค้าที่รับผิดชอบ</label>
          <p className="text-[11px] text-slate-400">(ว่างไว้ = รับผิดชอบทุกขนาดสินค้า S, M, L, XL)</p>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {sizeIds.length === 0 ? 'ทุกขนาด' : `${sizeIds.length} ขนาด`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-slate-50 border border-slate-200 rounded-lg mb-2 text-xs">
        {sizeIds.length === 0 ? (
          <span className="text-slate-500 py-0.5">รองรับทุกขนาดสินค้า</span>
        ) : (
          sizeIds.map(id => {
            const s = sizes.find(x => x.id === id)
            return (
              <span key={id} className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <span>{s?.name || id}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSize(id)}
                  className="text-slate-400 hover:text-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })
        )}
      </div>

      <select className="sel text-xs w-full" value="" onChange={e => handleAddSize(Number(e.target.value))}>
        <option value="">+ เลือกเพิ่มขนาดสินค้า...</option>
        {availableSizes.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  )
}
