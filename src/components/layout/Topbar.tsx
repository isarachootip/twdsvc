'use client'

import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/exec': 'Executive Dashboard',
  '/analytics': 'Dashboard Overview',
  '/jobs': 'งานซ่อมทั้งหมด',
  '/cs': 'คิว CS',
  '/cs/new': 'เปิดใบแจ้งซ่อม',
  '/gr': 'GR',
  '/dc': 'DC',
  '/vd': 'ช่าง (VD)',
  '/tradein': 'Trade-in / คูปอง',
  '/s2': 'สต็อกสาขา (S2)',
  '/reports/vd-payment': 'รายงานจ่ายเงิน VD',
  '/admin': 'ตั้งค่าระบบหลังบ้าน',
}

interface TopbarProps {
  user: {
    fullName: string
    role: string
    siteId?: string | null
  }
}

export default function Topbar({ user }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const title = Object.entries(PAGE_TITLES).find(([path]) => pathname === path || pathname.startsWith(path + '/'))?.[1] ?? ''

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 border-b shrink-0"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Page title */}
      <h1 className="text-base font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>
        {title}
      </h1>

      <div className="flex-1" />

      {/* Global job search */}
      <form onSubmit={handleSearch} className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-mute)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="สแกน/ค้นหาเลขงาน..."
          className="pl-9 pr-3 py-1.5 text-sm rounded-lg border outline-none w-56 focus:border-red-400"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
      </form>

      {/* User info */}
      <div className="text-sm text-right flex-shrink-0">
        <div className="font-medium" style={{ color: 'var(--text)' }}>{user.fullName}</div>
        <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{user.role}</div>
      </div>
    </header>
  )
}
