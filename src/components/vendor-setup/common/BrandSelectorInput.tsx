'use client'

import React, { useState, useMemo } from 'react'
import { DEFAULT_VENDOR_BRANDS } from '@/lib/data/vendor-brands'
import { X, Plus, Search } from 'lucide-react'

interface BrandSelectorInputProps {
  selectedBrands: string[]
  onChange: (brands: string[]) => void
  placeholder?: string
}

export function BrandSelectorInput({ selectedBrands, onChange, placeholder }: BrandSelectorInputProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return []
    const q = search.trim().toUpperCase()
    return DEFAULT_VENDOR_BRANDS.filter(b => b.toUpperCase().includes(q) && !selectedBrands.includes(b)).slice(0, 15)
  }, [search, selectedBrands])

  const addBrand = (brand: string) => {
    if (!selectedBrands.includes(brand)) {
      onChange([...selectedBrands, brand])
    }
    setSearch('')
    setOpen(false)
  }

  const removeBrand = (brand: string) => {
    onChange(selectedBrands.filter(b => b !== brand))
  }

  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setOpen(Boolean(e.target.value.trim()))
          }}
          onFocus={() => {
            if (search.trim()) setOpen(true)
          }}
          placeholder={placeholder || 'ค้นหาแบรนด์ เช่น PANASONIC, TOSHIBA, MITSUBISHI...'}
          className="w-full h-10 px-3.5 pr-8 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />

        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-40 py-1 divide-y divide-slate-100">
            {filtered.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => addBrand(b)}
                className="w-full text-left px-3.5 py-2 text-xs hover:bg-red-50 text-slate-700 hover:text-red-900 transition flex items-center justify-between"
              >
                <span>{b}</span>
                <Plus className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedBrands.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-lg bg-slate-50/50 min-h-[38px]">
          {selectedBrands.map(b => (
            <span
              key={b}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 text-white shadow-xs"
            >
              <span>{b}</span>
              <button
                type="button"
                onClick={() => removeBrand(b)}
                className="hover:text-red-300 transition focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
