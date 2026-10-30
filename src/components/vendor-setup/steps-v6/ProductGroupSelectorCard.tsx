'use client'

import React from 'react'
import { Plus, Pencil } from 'lucide-react'
import type { ProductGroupRateConfig, VendorServiceMode } from '@/lib/validations/vendor-product-group.schema'

interface ProductGroupSelectorCardProps {
  serviceType: VendorServiceMode
  availableNames: string[]
  selectedNames: string[]
  rates: ProductGroupRateConfig[]
  onToggleCheckbox: (name: string, currentlyChecked: boolean) => void
  onEditGroup: (name: string) => void
  onAddCustomClick: () => void
}

export function ProductGroupSelectorCard({
  serviceType,
  availableNames,
  selectedNames,
  rates,
  onToggleCheckbox,
  onEditGroup,
  onAddCustomClick,
}: ProductGroupSelectorCardProps) {
  const rateMap = new Map<string, ProductGroupRateConfig>()
  for (const r of rates) {
    if (r.serviceType === serviceType) rateMap.set(r.groupName, r)
  }

  // Merge standard names + any custom names already added by this vendor
  const allNames = [...availableNames]
  for (const selected of selectedNames) {
    if (!allNames.includes(selected)) allNames.push(selected)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
      {allNames.map(prod => {
        const isChecked = selectedNames.includes(prod)
        const rate = rateMap.get(prod)

        return (
          <div
            key={prod}
            className={`p-2.5 border rounded-lg transition flex flex-col justify-between gap-1.5 ${
              isChecked
                ? 'border-red-300 bg-red-50/30'
                : 'border-slate-100 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between gap-1.5">
              <label className="inline-flex items-start gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleCheckbox(prod, isChecked)}
                  className="accent-red-700 mt-0.5 shrink-0"
                />
                <span className={isChecked ? 'font-bold text-slate-900' : 'text-slate-700'}>
                  {prod}
                </span>
              </label>

              {isChecked && (
                <button
                  type="button"
                  onClick={() => onEditGroup(prod)}
                  title="แก้ไขราคาเปิดเครื่องและ GP%"
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-700 inline-flex items-center gap-0.5 shrink-0"
                >
                  <Pencil className="w-3 h-3" /> แก้ไข
                </button>
              )}
            </div>

            {isChecked && rate && (
              <button
                type="button"
                onClick={() => onEditGroup(prod)}
                className="pl-5 text-left flex flex-wrap items-center gap-x-2 gap-y-0.5"
              >
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  เปิดเครื่อง ฿{rate.minInspectionFee.toLocaleString()} • GP {rate.gpPct}%
                </span>
                {rate.isCustomGroup && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    กลุ่มเพิ่มเติม
                  </span>
                )}
              </button>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={onAddCustomClick}
        className="p-2.5 border border-dashed border-slate-300 hover:border-red-600 hover:bg-red-50/40 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-700 transition inline-flex items-center justify-center gap-1.5 min-h-[42px]"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>เพิ่มกลุ่มสินค้า</span>
      </button>
    </div>
  )
}
