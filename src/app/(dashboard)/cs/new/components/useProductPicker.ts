'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Commodity } from './ProductSection'

interface MetaData {
  brands: string[]
  departments: string[]
}

export function useProductPicker(open: boolean) {
  const [keyword, setKeyword] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Commodity[]>([])
  const [total, setTotal] = useState(0)
  const [meta, setMeta] = useState<MetaData>({ brands: [], departments: [] })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/admin/commodities/meta')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setMeta(data))
      .catch(() => {})
  }, [open])

  const doSearch = useCallback((kw: string, b: string, d: string, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({
      search: kw.trim(),
      brand: b,
      dept: d,
      page: String(p),
      limit: '15',
      format: 'paged',
    })
    fetch(`/api/commodities?${params.toString()}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!open) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      doSearch(keyword, selectedBrand, selectedDept, page)
    }, 250)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [open, keyword, selectedBrand, selectedDept, page, doSearch])

  const handleReset = () => {
    setKeyword('')
    setSelectedBrand('')
    setSelectedDept('')
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / 15))

  return {
    keyword,
    setKeyword,
    selectedBrand,
    setSelectedBrand,
    selectedDept,
    setSelectedDept,
    page,
    setPage,
    loading,
    items,
    total,
    meta,
    totalPages,
    handleReset,
  }
}
