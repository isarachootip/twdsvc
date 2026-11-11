'use client'

import React from 'react'
import { CALENDAR_DAYS_OF_MONTH } from '@/lib/vendor-billing-cycle'

interface BillingCycleCalendarGridProps {
  selectedDays: readonly number[]
  includeEndOfMonth: boolean
  multiMode: boolean
  onToggleMultiMode: (next: boolean) => void
  onSelectDay: (day: number) => void
  onSelectEndOfMonth: () => void
  onConfirmMulti: () => void
}

export function BillingCycleCalendarGrid({
  selectedDays,
  includeEndOfMonth,
  multiMode,
  onToggleMultiMode,
  onSelectDay,
  onSelectEndOfMonth,
  onConfirmMulti,
}: BillingCycleCalendarGridProps) {
  return (
    <div className="pt-2.5 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-700">เลือกวันที่จากปฏิทิน (1–31)</span>
        <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={multiMode}
            onChange={e => onToggleMultiMode(e.target.checked)}
            className="accent-red-700 rounded"
          />
          <span>เลือกหลายวัน/เดือน</span>
        </label>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {CALENDAR_DAYS_OF_MONTH.map(day => {
          const selected = selectedDays.includes(day)
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`h-7 rounded-md text-[11px] font-semibold transition ${
                selected
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-50/70 text-slate-700 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-2 mt-2">
        <button
          type="button"
          onClick={onSelectEndOfMonth}
          className={`px-2.5 h-7 rounded-md text-[11px] font-semibold border transition ${
            includeEndOfMonth
              ? 'bg-red-700 text-white border-red-700'
              : 'bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:text-red-700'
          }`}
        >
          วันสิ้นเดือน
        </button>

        {multiMode && (
          <button
            type="button"
            onClick={onConfirmMulti}
            className="px-3 h-7 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold"
          >
            ตกลง
          </button>
        )}
      </div>
    </div>
  )
}
