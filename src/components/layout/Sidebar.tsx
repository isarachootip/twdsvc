'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, ChartBar, ClipboardList, UserPlus, 
  Package, Truck, Warehouse, Wrench, RefreshCcw, 
  BarChart3, CreditCard, Settings, LogOut
} from 'lucide-react'

interface NavItem {
  key: string
  label: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { key: 'exec',       label: 'Executive Dashboard', href: '/exec',              icon: <ChartBar size={18} />,     roles: ['ADMIN', 'EXECUTIVE'] },
  { key: 'analytics',  label: 'Dashboard Overview',  href: '/analytics',         icon: <BarChart3 size={18} />,    roles: ['ADMIN', 'EXECUTIVE'] },
  { key: 'jobs',       label: 'งานซ่อมทั้งหมด',      href: '/jobs',              icon: <ClipboardList size={18} />, roles: ['ADMIN', 'EXECUTIVE', 'CS', 'GR', 'DC', 'VD', 'S2'] },
  { key: 'cs',         label: 'เปิดใบแจ้งซ่อม / คิว CS', href: '/cs',           icon: <UserPlus size={18} />,     roles: ['ADMIN', 'CS'] },
  { key: 'gr',         label: 'GR',                  href: '/gr',                icon: <Package size={18} />,      roles: ['ADMIN', 'GR'] },
  { key: 'dc',         label: 'DC',                  href: '/dc',                icon: <Warehouse size={18} />,    roles: ['ADMIN', 'DC'] },
  { key: 'vd',         label: 'ช่าง (VD)',            href: '/vd',                icon: <Wrench size={18} />,       roles: ['ADMIN', 'VD'] },
  { key: 'tradein',    label: 'Trade-in / คูปอง',    href: '/tradein',           icon: <RefreshCcw size={18} />,   roles: ['ADMIN', 'CS'] },
  { key: 's2',         label: 'สต็อกสาขา (S2)',      href: '/s2',               icon: <Truck size={18} />,        roles: ['ADMIN', 'S2'] },
  { key: 'vd_payment', label: 'รายงานจ่ายเงิน VD',  href: '/reports/vd-payment', icon: <CreditCard size={18} />,  roles: ['ADMIN', 'EXECUTIVE'] },
  { key: 'admin',      label: 'ตั้งค่าระบบหลังบ้าน', href: '/admin',            icon: <Settings size={18} />,     roles: ['ADMIN'] },
]

interface SidebarProps {
  user: {
    id: string
    fullName: string
    role: string
    siteId?: string | null
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  return (
    <aside
      className="flex flex-col w-56 shrink-0 border-r overflow-y-auto"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          className="rounded-lg px-3 py-2 text-center font-bold text-sm text-white"
          style={{ background: 'var(--red)' }}
        >
          <div className="text-xs opacity-80">THAIWASADU</div>
          <div>SERVICE CENTER</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive ? 'nav-active font-medium' : 'hover:bg-gray-50'
              }`}
              style={isActive ? {} : { color: 'var(--text-2)' }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-xs mb-3" style={{ color: 'var(--text-mute)' }}>
          <div className="font-medium" style={{ color: 'var(--text)' }}>{user.fullName}</div>
          <div>{user.role}</div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-2 w-full text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            style={{ color: 'var(--red)' }}
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  )
}
