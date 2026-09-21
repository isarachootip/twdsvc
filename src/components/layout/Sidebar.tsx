'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBar, BarChart3, ClipboardList, UserPlus, Package, Warehouse, Wrench, RefreshCcw, Truck,
  CreditCard, Settings, LogOut, BookOpen, X,
} from 'lucide-react'
import { MENU_DEFS, ROLE_LABELS } from '@/lib/constants'

const ICONS: Record<string, React.ReactNode> = {
  exec: <ChartBar size={18} />, analytics: <BarChart3 size={18} />, jobs: <ClipboardList size={18} />, cs: <UserPlus size={18} />,
  gr: <Package size={18} />, dc: <Warehouse size={18} />, vd: <Wrench size={18} />, tradein: <RefreshCcw size={18} />,
  s2: <Truck size={18} />, vd_payment: <CreditCard size={18} />, admin: <Settings size={18} />, manual: <BookOpen size={18} />,
}

interface SidebarProps {
  user: { fullName: string; role: string; siteName?: string | null; vendorLabel?: string | null }
  menus: string[]
  open: boolean
  onClose: () => void
}

export default function Sidebar({ user, menus, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const items = [...MENU_DEFS.filter(m => menus.includes(m.key)), { key: 'manual', label: 'คู่มือใช้งาน & KM', href: '/manual' }]

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed md:static z-50 inset-y-0 left-0 flex flex-col shrink-0 border-r overflow-y-auto transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 220, background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="px-4 py-4 border-b flex items-center gap-2.5" style={{ borderColor: 'var(--border)' }}>
          <div
            className="rounded-lg px-2.5 py-1.5 text-center font-bold text-xs text-white"
            style={{ background: 'var(--red)' }}
          >
            <div>THAIWASADU</div>
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Service Center</div>
            <div className="text-[11.5px]" style={{ color: 'var(--text-2)' }}>ระบบศูนย์บริการ</div>
          </div>
          <button className="ml-auto md:hidden" onClick={onClose} aria-label="ปิดเมนู"><X size={18} /></button>
        </div>

        <nav className="flex-1 py-3">
          {items.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 text-[13.5px] transition-colors ${active ? 'nav-active font-medium' : 'hover:bg-gray-50'}`}
                style={active ? {} : { color: 'var(--text-2)' }}
              >
                {ICONS[item.key]}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs mb-3" style={{ color: 'var(--text-mute)' }}>
            <div className="font-medium" style={{ color: 'var(--text)' }}>{user.fullName}</div>
            <div>{ROLE_LABELS[user.role] ?? user.role}{user.siteName ? ` · ${user.siteName}` : ''}</div>
            {user.vendorLabel && <div>{user.vendorLabel}</div>}
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="flex items-center gap-2 w-full text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors" style={{ color: 'var(--red)' }}>
              <LogOut size={16} />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
