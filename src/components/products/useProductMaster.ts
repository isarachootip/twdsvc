'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CommodityItem, ProductFilterState, ProductListResponse, ProductMetaResponse } from './types'

const INITIAL_FILTERS: ProductFilterState = {
  search: '',
  brand: '',
  dept: '',
  status: 'all',
  page: 1,
  limit: 25,
}

export function useProductMaster() {
  const [filters, setFilters] = useState<ProductFilterState>(INITIAL_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const [data, setData] = useState<ProductListResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 0,
  })
  const [meta, setMeta] = useState<ProductMetaResponse>({ brands: [], departments: [] })
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<CommodityItem | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch metadata once
  useEffect(() => {
    fetch('/api/admin/commodities/meta')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('Failed meta'))))
      .then((m: ProductMetaResponse) => setMeta(m))
      .catch(err => console.error('Error loading product meta:', err))
  }, [])

  // Sync searchInput with debounced filters.search
  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: val.trim(), page: 1 }))
    }, 350)
  }, [])

  // Fetch commodities list
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: filters.search,
        brand: filters.brand,
        dept: filters.dept,
        status: filters.status,
        page: String(filters.page),
        limit: String(filters.limit),
      })
      const res = await fetch(`/api/admin/commodities?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load commodities')
      const json: ProductListResponse = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching commodities:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const setBrand = useCallback((brand: string) => {
    setFilters(prev => ({ ...prev, brand, page: 1 }))
  }, [])

  const setDept = useCallback((dept: string) => {
    setFilters(prev => ({ ...prev, dept, page: 1 }))
  }, [])

  const setStatus = useCallback((status: ProductFilterState['status']) => {
    setFilters(prev => ({ ...prev, status, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setSearchInput('')
    setFilters(INITIAL_FILTERS)
  }, [])

  return {
    filters,
    searchInput,
    handleSearchChange,
    setBrand,
    setDept,
    setStatus,
    setPage,
    setLimit,
    resetFilters,
    data,
    meta,
    loading,
    selectedProduct,
    setSelectedProduct,
  }
}
