'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X } from 'lucide-react'
import {
  filterBranchOptions,
  formatBranchLabel,
  type SearchableBranchOption,
} from '@/lib/branch-search'
import { useDropdownCoords } from './useDropdownCoords'

export interface BranchSearchSelectProps {
  options: readonly SearchableBranchOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allOptionLabel?: string
  allOptionValue?: string
  searchPlaceholder?: string
  showCode?: boolean
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
}

export function BranchSearchSelect({
  options,
  value,
  onChange,
  placeholder = 'เลือกสาขา...',
  allOptionLabel,
  allOptionValue = '',
  searchPlaceholder = 'ค้นหาชื่อสาขา, รหัส 60xxx, ชื่อย่อ...',
  showCode = true,
  size = 'md',
  disabled = false,
  className = '',
}: BranchSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const coords = useDropdownCoords(open, triggerRef, menuRef, closeMenu)
  const selectedBranch = useMemo(() => options.find(o => o.id === value) ?? null, [options, value])

  const displayLabel = useMemo(() => {
    if (allOptionLabel !== undefined && value === allOptionValue) return allOptionLabel
    return selectedBranch ? formatBranchLabel(selectedBranch, showCode) : ''
  }, [allOptionLabel, allOptionValue, selectedBranch, showCode, value])

  const filtered = useMemo(() => filterBranchOptions(options, query), [options, query])

  const items = useMemo(() => {
    const list: Array<{ id: string; label: string; sub?: string }> = []
    if (allOptionLabel !== undefined && !query.trim()) {
      list.push({ id: allOptionValue, label: allOptionLabel })
    }
    for (const b of filtered) {
      const meta = [showCode ? b.code : null, b.nickname, b.province].filter(Boolean).join(' · ')
      list.push({ id: b.id, label: b.name, sub: meta || undefined })
    }
    return list
  }, [allOptionLabel, allOptionValue, filtered, query, showCode])

  const selectValue = useCallback(
    (nextVal: string) => {
      onChange(nextVal)
      closeMenu()
    },
    [closeMenu, onChange],
  )

  useEffect(() => { setActiveIndex(0) }, [query, open])

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (items.length ? Math.min(i + 1, items.length - 1) : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[activeIndex]) selectValue(items[activeIndex].id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
      triggerRef.current?.focus()
    }
  }

  const btnCls =
    size === 'sm'
      ? `sel flex items-center justify-between gap-2 text-left cursor-pointer ${className || 'min-w-[195px]'}`
      : `inp flex items-center justify-between gap-2 text-left w-full cursor-pointer ${className}`

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={btnCls}
        style={size === 'md' ? { minHeight: 38 } : { paddingTop: 6, paddingBottom: 6, fontSize: 12.5 }}
      >
        <span className={displayLabel ? 'text-slate-900 truncate' : 'text-slate-400 truncate'}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed bg-white rounded-xl border border-slate-200 shadow-lg z-[9999] overflow-hidden"
            style={{ left: coords.left, width: coords.width, top: coords.top, bottom: coords.bottom }}
          >
            <div className="p-2 border-b border-slate-100 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                className="inp inp-sm w-full pl-7 pr-7 text-xs"
                placeholder={searchPlaceholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="ล้างคำค้นหา"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div ref={listRef} className="max-h-60 overflow-y-auto divide-y divide-slate-50">
              {items.length === 0 ? (
                <div className="py-4 px-3 text-center text-xs text-slate-400">ไม่พบสาขาที่ค้นหา</div>
              ) : (
                items.map((item, idx) => {
                  const isSelected = item.id === value
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={`${item.id || '__all__'}-${idx}`}
                      data-idx={idx}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectValue(item.id)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-red-50/80 font-semibold text-red-700'
                          : isActive
                            ? 'bg-red-50/50 text-slate-900'
                            : 'text-slate-800 hover:bg-red-50/40'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.sub && (
                        <span className="font-mono text-[10.5px] text-slate-500 shrink-0">{item.sub}</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
