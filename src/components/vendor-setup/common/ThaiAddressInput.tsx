'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { ThaiAddressItem } from '@/lib/services/thai-address-search'
import { MapPin } from 'lucide-react'

interface ThaiAddressInputProps {
  value: {
    subdistrict: string
    district: string
    province: string
    zip: string
  }
  onChange: (addr: { subdistrict: string; district: string; province: string; zip: string }) => void
  placeholder?: string
  required?: boolean
}

export function ThaiAddressInput({ value, onChange, placeholder, required }: ThaiAddressInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ThaiAddressItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.subdistrict && value.district && value.province && value.zip) {
      setQuery(`${value.subdistrict} » ${value.district} » ${value.province} » ${value.zip}`)
    }
  }, [value.subdistrict, value.district, value.province, value.zip])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2 || trimmed.includes('»')) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/vendors/address-search?q=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        const list: ThaiAddressItem[] = data.results || []
        setResults(list)
        setOpen(list.length > 0)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (item: ThaiAddressItem) => {
    onChange({
      subdistrict: item.subdistrict,
      district: item.district,
      province: item.province,
      zip: item.postalCode,
    })
    setQuery(`${item.subdistrict} » ${item.district} » ${item.province} » ${item.postalCode}`)
    setOpen(false)
  }

  const handleBlur = () => {
    setTimeout(() => {
      if (!value.subdistrict && results.length > 0) {
        handleSelect(results[0])
      }
    }, 180)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            if (!e.target.value) {
              onChange({ subdistrict: '', district: '', province: '', zip: '' })
            }
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true)
          }}
          onBlur={handleBlur}
          placeholder={placeholder || 'พิมพ์ตำบล, อำเภอ, จังหวัด หรือรหัสไปรษณีย์'}
          required={required}
          className="w-full h-11 px-3.5 pr-8 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition"
        />
        <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
          {loading ? (
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 py-1 divide-y divide-slate-100">
          {results.map((r, idx) => (
            <button
              key={`${r.subdistrict}-${r.district}-${r.postalCode}-${idx}`}
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                handleSelect(r)
              }}
              className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-red-50 text-slate-700 hover:text-red-900 transition flex items-center justify-between"
            >
              <span>
                <strong className="font-semibold text-slate-900">{r.subdistrict}</strong> &gt; {r.district} &gt; {r.province}
              </span>
              <span className="font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px] font-bold">
                {r.postalCode}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
