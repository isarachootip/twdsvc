'use client'

import React, { useMemo, useState } from 'react'
import { DEFAULT_VENDOR_BRANDS } from '@/lib/data/vendor-brands'
import { filterBrandOptions, toggleBrandSelection } from '@/lib/vendor-brand-selection'
import { Search, X } from 'lucide-react'

interface BrandSelectorInputProps {
  selectedBrands: string[]
  onChange: (brands: string[]) => void
  allBrands?: boolean
  onChangeAllBrands?: (allBrands: boolean) => void
  placeholder?: string
  disabled?: boolean
}

export function BrandSelectorInput({
  selectedBrands,
  onChange,
  allBrands = false,
  onChangeAllBrands,
  placeholder,
  disabled = false,
}: BrandSelectorInputProps) {
  const [search, setSearch] = useState('')

  const filteredBrands = useMemo(
    () => filterBrandOptions(DEFAULT_VENDOR_BRANDS, search),
    [search]
  )

  const handleToggleAllBrands = (checked: boolean) => {
    if (disabled) return
    onChangeAllBrands?.(checked)
    if (checked) {
      onChange([])
      setSearch('')
    }
  }

  const handleToggleBrand = (brand: string) => {
    if (disabled || allBrands) return
    onChange(toggleBrandSelection(selectedBrands, brand))
  }

  const isLocked = disabled || allBrands

  return (
    <div
      className={`w-full rounded-xl border border-slate-300 bg-white overflow-hidden transition ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      {/* Top Row: Checkbox "รับซ่อมทุกแบรนด์" matching reference design */}
      <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
        <label
          className={`inline-flex items-center gap-2.5 select-none ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            disabled={disabled}
            checked={allBrands}
            onChange={e => handleToggleAllBrands(e.target.checked)}
            className="w-4 h-4 accent-red-700 rounded cursor-pointer disabled:cursor-not-allowed"
          />
          <span className="text-sm font-semibold text-slate-900">รับซ่อมทุกแบรนด์</span>
        </label>

        {allBrands ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            รองรับทุกแบรนด์ไม่จำกัด
          </span>
        ) : selectedBrands.length > 0 ? (
          <span className="text-xs font-semibold text-slate-600">
            เลือกแล้ว {selectedBrands.length} แบรนด์
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">ติ๊กด้านบน หรือค้นหาแบรนด์ด้านล่าง</span>
        )}
      </div>

      {/* Search Input Row */}
      <div className="relative flex items-center border-b border-slate-100 bg-white">
        <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0 pointer-events-none" />
        <input
          type="text"
          disabled={isLocked}
          value={allBrands ? '' : search}
          onChange={e => setSearch(e.target.value)}
          placeholder={
            allBrands
              ? 'เปิดโหมดรับซ่อมทุกแบรนด์แล้ว — ไม่ต้องเลือกรายแบรนด์ (รวมแบรนด์ใหม่ในอนาคตอัตโนมัติ)'
              : placeholder || 'Search ค้นหาแบรนด์ เช่น PANASONIC, TOSHIBA, MITSUBISHI...'
          }
          className="w-full h-10 pl-2.5 pr-8 text-xs bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        />
        {!isLocked && search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded"
            title="ล้างคำค้นหา"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Brand Checkbox Grid (hidden when allBrands is checked) */}
      {!allBrands && !disabled && (
        <div className="max-h-44 overflow-y-auto p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 bg-white">
          {filteredBrands.length === 0 ? (
            <div className="col-span-full py-3 text-center text-xs text-slate-400">
              ไม่พบแบรนด์ที่ตรงกับ &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredBrands.map(brand => {
              const checked = selectedBrands.includes(brand)
              return (
                <label
                  key={brand}
                  className={`inline-flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs select-none transition ${
                    checked ? 'bg-red-50/70 text-red-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleBrand(brand)}
                    className="w-3.5 h-3.5 accent-red-700 shrink-0"
                  />
                  <span className="truncate">{brand}</span>
                </label>
              )
            })
          )}
        </div>
      )}

      {/* Selected Brands Summary Footer */}
      {!allBrands && selectedBrands.length > 0 && (
        <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-700">
            {selectedBrands.map(b => (
              <span key={b} className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <span>{b}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleToggleBrand(b)}
                    className="text-slate-400 hover:text-rose-600 transition"
                    title={`นำ ${b} ออก`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 shrink-0"
            >
              ล้างทั้งหมด
            </button>
          )}
        </div>
      )}
    </div>
  )
}
