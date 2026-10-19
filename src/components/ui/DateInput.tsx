'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { displayToIsoDate, formatDateMask, isoToDisplayDate } from '@/lib/date-input-utils'

export interface DateInputProps {
  value: string
  onChange: (isoDate: string) => void
  min?: string
  max?: string
  required?: boolean
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  ariaLabel?: string
}

export default function DateInput({
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  className = 'inp',
  style,
  ariaLabel,
}: DateInputProps) {
  const [text, setText] = useState<string>(() => isoToDisplayDate(value))
  const pickerRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setText(isoToDisplayDate(value))
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw.trim() === '') {
      setText('')
      if (!required) onChange('')
      return
    }
    const masked = formatDateMask(raw)
    setText(masked)
    if (masked.length === 10) {
      const iso = displayToIsoDate(masked, { min, max })
      if (iso !== null) {
        onChange(iso)
      }
    }
  }

  const handleBlur = () => {
    if (text.trim() === '') {
      if (!required) {
        setText('')
        if (value !== '') onChange('')
      } else {
        setText(isoToDisplayDate(value))
      }
      return
    }
    const iso = displayToIsoDate(text, { min, max })
    if (iso !== null && iso !== '') {
      setText(isoToDisplayDate(iso))
      if (iso !== value) onChange(iso)
    } else {
      setText(isoToDisplayDate(value))
    }
  }

  const handleClear = () => {
    if (disabled || required) return
    setText('')
    onChange('')
  }

  const openPicker = () => {
    if (disabled) return
    const el = pickerRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
        return
      } catch {
        // Fallback if showPicker is blocked
      }
    }
    el.focus()
    el.click()
  }

  const showClear = !disabled && !required && Boolean(text || value)

  return (
    <div className="relative inline-flex items-center" style={style}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        maxLength={10}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel ?? 'วันที่ (dd/mm/yyyy)'}
        className={className}
        style={{ paddingRight: showClear ? 50 : 32, width: '100%', minWidth: 132 }}
      />
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value ? value.slice(0, 10) : ''}
        min={min}
        max={max}
        disabled={disabled}
        onChange={e => {
          const nextIso = e.target.value
          if (nextIso || !required) {
            onChange(nextIso)
            setText(isoToDisplayDate(nextIso))
          }
        }}
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: 'none',
          right: 0,
          bottom: 0,
        }}
      />
      <div className="absolute right-1.5 inline-flex items-center gap-0.5">
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            title="ล้างวันที่"
            aria-label="ล้างวันที่"
            className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={13} />
          </button>
        )}
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          title="เลือกวันที่จากปฏิทิน"
          aria-label="เลือกวันที่จากปฏิทิน"
          className="p-0.5 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Calendar size={14} />
        </button>
      </div>
    </div>
  )
}
