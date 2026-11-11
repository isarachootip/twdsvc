'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Edit3 } from 'lucide-react'
import {
  BILLING_CYCLE_PRESETS,
  formatBillingCycleFromDays,
  parseBillingDaysFromText,
  toggleBillingDay,
} from '@/lib/vendor-billing-cycle'
import { BillingCycleCalendarGrid } from './BillingCycleCalendarGrid'

interface BillingCyclePickerProps {
  value: string
  onChange: (nextValue: string) => void
}

export function BillingCyclePicker({ value, onChange }: BillingCyclePickerProps) {
  const parsed = parseBillingDaysFromText(value)
  const isInitialMulti = parsed.days.length > 1 || (parsed.days.length >= 1 && parsed.includeEndOfMonth)

  const [open, setOpen] = useState(false)
  const [multiMode, setMultiMode] = useState(isInitialMulti)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customDraft, setCustomDraft] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  const handleSelectPreset = (presetValue: string) => {
    onChange(presetValue)
    setShowCustomInput(false)
    setOpen(false)
  }

  const handleClickDay = (day: number) => {
    setShowCustomInput(false)
    if (!multiMode) {
      onChange(formatBillingCycleFromDays([day], false))
      setOpen(false)
      return
    }
    const nextDays = toggleBillingDay(parsed.days, day)
    const nextText = formatBillingCycleFromDays(nextDays, parsed.includeEndOfMonth)
    if (nextText) onChange(nextText)
  }

  const handleClickEndOfMonth = () => {
    setShowCustomInput(false)
    if (!multiMode) {
      onChange('ทุกสิ้นเดือน')
      setOpen(false)
      return
    }
    const nextEnd = !parsed.includeEndOfMonth
    const nextText = formatBillingCycleFromDays(parsed.days, nextEnd)
    if (nextText) onChange(nextText)
  }

  const handleApplyCustom = () => {
    const trimmed = customDraft.trim()
    if (trimmed) {
      onChange(trimmed)
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setCustomDraft(value)
          setOpen(prev => !prev)
        }}
        className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white hover:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 flex items-center justify-between gap-2 text-xs transition"
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <CalendarDays className="w-4 h-4 text-red-700 shrink-0" />
          <span className={`truncate ${value ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
            {value || 'เลือกรอบวางบิล / วันที่ของเดือน'}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 sm:min-w-[340px] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-3 space-y-3 text-xs">
          <div>
            <div className="text-[11px] font-bold text-slate-500 mb-1.5">ตัวเลือกรอบวางบิลมาตรฐาน</div>
            <div className="space-y-1">
              {BILLING_CYCLE_PRESETS.map(preset => {
                const active = value === preset.value
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSelectPreset(preset.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition ${
                      active ? 'bg-red-50 text-red-800 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div>{preset.label}</div>
                      <div className="text-[10px] text-slate-400">{preset.hint}</div>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-red-700 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <BillingCycleCalendarGrid
            selectedDays={parsed.days}
            includeEndOfMonth={parsed.includeEndOfMonth}
            multiMode={multiMode}
            onToggleMultiMode={setMultiMode}
            onSelectDay={handleClickDay}
            onSelectEndOfMonth={handleClickEndOfMonth}
            onConfirmMulti={() => setOpen(false)}
          />

          <div className="pt-2 border-t border-slate-100">
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => {
                  setCustomDraft(value)
                  setShowCustomInput(true)
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-700"
              >
                <Edit3 className="w-3 h-3" /> ระบุเงื่อนไขรอบวางบิลพิเศษเอง
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customDraft}
                  onChange={e => setCustomDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleApplyCustom()
                    }
                  }}
                  placeholder="เช่น ทุกวันศุกร์ที่ 2 และ 4 ของเดือน"
                  className="flex-1 h-8 px-2.5 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="px-2.5 h-8 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-semibold shrink-0"
                >
                  ใช้ค่านี้
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
