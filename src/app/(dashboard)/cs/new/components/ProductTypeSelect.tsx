'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { ProductTypeOption } from '@/lib/services/product-type-matcher'

interface ProductTypeSelectProps {
  value: string
  onChange: (val: string) => void
  options: ProductTypeOption[]
}

export function ProductTypeSelect({ value, onChange, options }: ProductTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      o =>
        o.name.toLowerCase().includes(q) ||
        o.keywords.some(k => k.toLowerCase().includes(q))
    )
  }, [options, query])

  return (
    <div className="field" ref={wrapRef} style={{ position: 'relative' }}>
      <label>
        ประเภทสินค้า <span style={{ color: 'var(--red)' }}>*</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inp flex items-center justify-between text-left w-full cursor-pointer"
        style={{ minHeight: 38 }}
      >
        <span className={value ? 'text-slate-900 truncate' : 'text-slate-400 truncate'}>
          {value || 'เลือกประเภทสินค้า...'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-40 overflow-hidden"
          style={{ minWidth: 250 }}
        >
          <div className="p-2 border-b border-slate-100 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              className="inp inp-sm w-full pl-7 text-xs"
              placeholder="ค้นหาประเภทสินค้า..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-slate-400">
                ไม่พบประเภทสินค้าที่ค้นหา
              </div>
            ) : (
              filtered.map(opt => {
                const isSelected = opt.name === value
                const hasCin = opt.serviceTypes.includes('CARRY_IN')
                const hasOns = opt.serviceTypes.includes('ON_SITE')
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => {
                      onChange(opt.name)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 hover:bg-red-50/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-50/80 font-semibold text-red-700' : 'text-slate-800'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    <span className="text-[10.5px] text-slate-500 shrink-0">
                      {hasCin && hasOns ? 'Carry-in · On-site' : hasCin ? 'Carry-in' : 'On-site'}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
