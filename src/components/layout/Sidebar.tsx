'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChartBar, BarChart3, ClipboardList, UserPlus, Package, Warehouse, Wrench, RefreshCcw, Truck,
  CreditCard, Settings, LogOut, BookOpen, X, ChevronDown, ChevronRight,
} from 'lucide-react'
import { MENU_DEFS, ROLE_LABELS } from '@/lib/constants'
import { ADMIN_NAV_ITEMS } from '@/app/(dashboard)/admin/constants'

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
  const isAdminPath = pathname.startsWith('/admin')
  const [adminOpen, setAdminOpen] = useState(isAdminPath)

  useEffect(() => {
    setAdminOpen(pathname.startsWith('/admin'))
  }, [pathname])

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed md:static z-50 inset-y-0 left-0 flex flex-col shrink-0 border-r overflow-y-auto transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 230, background: 'var(--surface)', borderColor: 'var(--border)' }}
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
            if (item.key === 'admin') {
              return (
                <div key={item.key} className="mb-0.5">
                  <div
                    className={`flex items-center justify-between px-4 py-2.5 text-[13.5px] transition-colors rounded-lg cursor-pointer ${
                      isAdminPath ? 'nav-active font-medium' : 'hover:bg-gray-50'
                    }`}
                    style={isAdminPath ? {} : { color: 'var(--text-2)' }}
                    onClick={() => setAdminOpen(v => !v)}
                  >
                    <Link
                      href="/admin/vendor"
                      onClick={e => {
                        e.stopPropagation()
                        setAdminOpen(true)
                        onClose()
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      {ICONS[item.key]}
                      <span className="truncate">{item.label}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setAdminOpen(v => !v)
                      }}
                      className="p-1 hover:bg-black/5 rounded text-current opacity-70 hover:opacity-100 transition-opacity"
                      aria-label="ย่อ/ขยายเมนูตั้งค่า"
                    >
                      {adminOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  </div>

                  {adminOpen && (
                    <div className="mt-1 ml-5 pl-2.5 border-l border-gray-200/80 flex flex-col gap-0.5">
                      {ADMIN_NAV_ITEMS.map((sub, i) => {
                        const subHref = `/admin/${sub.id}`
                        const isSubActive = pathname === subHref || (pathname === '/admin' && sub.id === 'vendor')
                        return (
                          <Link
                            key={sub.id}
                            href={subHref}
                            onClick={onClose}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors ${
                              isSubActive
                                ? 'bg-red-50 text-red-700 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <span
                              className={`text-[11px] w-4 text-center shrink-0 ${
                                isSubActive ? 'text-red-600 font-bold' : 'text-gray-400'
                              }`}
                            >
                              {i + 1}.
                            </span>
                            <span className="truncate">{sub.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

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
