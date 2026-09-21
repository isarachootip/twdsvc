'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { ROLE_LABELS } from '@/lib/constants'

const PAGE_TITLES: Array<[string, string]> = [
  ['/exec', 'Executive Dashboard'],
  ['/analytics', 'Dashboard Overview'],
  ['/jobs', 'งานซ่อมทั้งหมด'],
  ['/cs/new', 'เปิดใบแจ้งซ่อม'],
  ['/cs', 'คิว CS'],
  ['/gr', 'GR'],
  ['/dc', 'DC'],
  ['/vd', 'ช่าง (VD)'],
  ['/tradein', 'Trade-in / คูปอง'],
  ['/s2', 'สต็อกสาขา (S2)'],
  ['/reports/vd-payment', 'รายงานจ่ายเงิน VD'],
  ['/admin', 'ตั้งค่าระบบหลังบ้าน'],
  ['/manual', 'คู่มือใช้งาน & KM'],
]

interface TopbarProps {
  user: { fullName: string; role: string; siteName?: string | null; vendorLabel?: string | null }
  onMenu?: () => void
}

export default function Topbar({ user, onMenu }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const title = PAGE_TITLES.find(([p]) => pathname === p || pathname.startsWith(p + '/'))?.[1] ?? ''

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    try {
      const job = await api<{ id: string }>(`/api/jobs/by-no/${encodeURIComponent(q)}`)
      router.push(`/jobs?open=${job.id}`)
      setSearch('')
    } catch {
      router.push(`/jobs?search=${encodeURIComponent(q)}`)
      if (!/^(JB|STK)-/i.test(q)) return
      toast('ไม่พบเลขงานนี้ — แสดงผลการค้นหาแทน', 'info')
    }
  }

  return (
    <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b shrink-0 no-print" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {onMenu && (
        <button className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900" onClick={onMenu} aria-label="เมนู">
          <Menu size={20} />
        </button>
      )}
      <h1 className="text-[15px] font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>
        Service Center — {title}{user.role === 'VD' && user.vendorLabel ? ` (${user.vendorLabel})` : ''}
      </h1>
      {user.role === 'S2' && <span className="badge b-amber text-xs px-2 py-0.5 rounded">สิทธิ์: S2</span>}
      <div className="flex-1" />
      <form onSubmit={handleSearch} className="relative hidden sm:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-mute)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="สแกน/ค้นหาเลขงาน..."
          className="pl-9 pr-3 py-1.5 text-sm rounded-lg border outline-none w-56 focus:border-red-400"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
      </form>
      <div className="text-sm text-right flex-shrink-0 hidden md:block">
        <div className="font-medium" style={{ color: 'var(--text)' }}>{user.fullName}</div>
        <div className="text-xs" style={{ color: 'var(--text-mute)' }}>
          {ROLE_LABELS[user.role] ?? user.role}{user.siteName ? ` · ${user.siteName}` : ''}
        </div>
      </div>
    </header>
  )
}
