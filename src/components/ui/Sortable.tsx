'use client'

import { useMemo, useState } from 'react'

export type SortDir = 1 | -1

export function useSort<T>(rows: T[], getters: Record<string, (r: T) => string | number | null | undefined>, initial?: { key: string; dir?: SortDir }) {
  const [sort, setSort] = useState<{ key: string | null; dir: SortDir }>({ key: initial?.key ?? null, dir: initial?.dir ?? 1 })
  const sorted = useMemo(() => {
    if (!sort.key || !getters[sort.key]) return rows
    const g = getters[sort.key]
    return [...rows].sort((a, b) => {
      const av = g(a), bv = g(b)
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sort.dir
      return String(av ?? '').localeCompare(String(bv ?? ''), 'th') * sort.dir
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort])
  const toggle = (key: string) => setSort(s => (s.key === key ? { key, dir: (s.dir * -1) as SortDir } : { key, dir: 1 }))
  return { sorted, sort, toggle }
}

export function Th({ k, label, sort, toggle, className }: { k: string; label: React.ReactNode; sort: { key: string | null; dir: SortDir }; toggle: (k: string) => void; className?: string }) {
  const active = sort.key === k
  return (
    <th className={`sortable ${active ? 'sorted' : ''} ${className ?? ''}`} onClick={() => toggle(k)}>
      {label}<span className="arrow">{active ? (sort.dir === 1 ? '▲' : '▼') : ''}</span>
    </th>
  )
}
