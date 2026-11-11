'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { NamedOption } from './vendor-types'
import { VendorSizesSection } from './VendorSizesSection'

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
  const [allBrandsMode, setAllBrandsMode] = useState<boolean>(brandIds.length === 0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (brandIds.length > 0 && allBrandsMode) {
      setAllBrandsMode(false)
    }
  }, [brandIds.length, allBrandsMode])

  const filteredBrands = useMemo(() => {
    const q = search.trim().toUpperCase()
    if (!q) return brands
    return brands.filter(b => b.name.toUpperCase().includes(q))
  }, [brands, search])

  const handleToggleAllBrands = (checked: boolean) => {
    setAllBrandsMode(checked)
    if (checked) {
      onChangeBrands([])
      setSearch('')
    }
  }

  const handleToggleBrand = (id: number) => {
    if (allBrandsMode) return
    if (brandIds.includes(id)) {
      onChangeBrands(brandIds.filter(b => b !== id))
    } else {
      onChangeBrands([...brandIds, id])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="text-xs font-bold text-slate-800">แบรนด์สินค้าที่รับผิดชอบ</label>
            <p className="text-[11px] text-slate-400">
              ติ๊กรับซ่อมทุกแบรนด์ หรือค้นหาเพื่อระบุเฉพาะแบรนด์ที่คู่ค้ารายนี้ดูแล
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {allBrandsMode ? 'ทุกแบรนด์' : `${brandIds.length} แบรนด์`}
          </span>
        </div>

        <div className="w-full rounded-xl border border-slate-300 bg-white overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allBrandsMode}
                onChange={e => handleToggleAllBrands(e.target.checked)}
                className="w-4 h-4 accent-red-700 rounded cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-900">รับซ่อมทุกแบรนด์</span>
            </label>

            {allBrandsMode ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                รองรับทุกแบรนด์ไม่จำกัด
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-600">
                เลือกแล้ว {brandIds.length} แบรนด์
              </span>
            )}
          </div>

          <div className="relative flex items-center border-b border-slate-100 bg-white">
            <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0 pointer-events-none" />
            <input
              type="text"
              disabled={allBrandsMode}
              value={allBrandsMode ? '' : search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                allBrandsMode
                  ? 'เปิดโหมดรับซ่อมทุกแบรนด์แล้ว — รองรับทุกแบรนด์ในระบบอัตโนมัติ'
                  : 'Search ค้นหาแบรนด์ เช่น PANASONIC, TOSHIBA, MITSUBISHI...'
              }
              className="w-full h-10 pl-2.5 pr-8 text-xs bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
            {!allBrandsMode && search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!allBrandsMode && (
            <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-2 sm:grid-cols-3 gap-1 bg-white">
              {filteredBrands.length === 0 ? (
                <div className="col-span-full py-3 text-center text-xs text-slate-400">
                  ไม่พบแบรนด์ที่ตรงกับคำค้นหา
                </div>
              ) : (
                filteredBrands.map(b => {
                  const checked = brandIds.includes(b.id)
                  return (
                    <label
                      key={b.id}
                      className={`inline-flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs select-none transition ${
                        checked ? 'bg-red-50/70 text-red-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleBrand(b.id)}
                        className="w-3.5 h-3.5 accent-red-700 shrink-0"
                      />
                      <span className="truncate">{b.name}</span>
                    </label>
                  )
                })
              )}
            </div>
          )}

          {!allBrandsMode && brandIds.length > 0 && (
            <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {brandIds.map(id => {
                  const b = brands.find(x => x.id === id)
                  return (
                    <span key={id} className="inline-flex items-center gap-1 font-semibold text-slate-800">
                      <span>{b?.name || id}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleBrand(id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => onChangeBrands([])}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 shrink-0"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>
      </div>

      <VendorSizesSection sizeIds={sizeIds} sizes={sizes} onChangeSizes={onChangeSizes} />
    </div>
  )
}
