'use client'

import Link from 'next/link'
import {
  VendorSection, FeeSection, BranchSection, ZoneSection, SlaSection, RoleSection, SkuSection,
  PayoutSection, TradeinSection, DashboardSection, GeneralSection, PendingVendorSection,
} from './Sections'

import { SECTION_ALIAS, ADMIN_NAV_ITEMS } from './constants'
export { SECTION_ALIAS }

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  vendor: VendorSection,
  fee: FeeSection,
  branch: BranchSection,
  zone: ZoneSection,
  sla: SlaSection,
  role: RoleSection,
  sku: SkuSection,
  payout: PayoutSection,
  tradein: TradeinSection,
  dashboard: DashboardSection,
  general: GeneralSection,
  pending: PendingVendorSection,
}

export const ADMIN_SECTIONS = ADMIN_NAV_ITEMS.map(nav => ({
  ...nav,
  C: SECTION_COMPONENTS[nav.id] || GeneralSection,
}))

export default function AdminClient({ section }: { section: string }) {
  const normalizedId = SECTION_ALIAS[section] || section
  const active = ADMIN_SECTIONS.find(s => s.id === normalizedId) ?? ADMIN_SECTIONS[0]
  const C = active.C

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <Link href="/admin/vendor" className="hover:text-red-600 transition-colors">
          ตั้งค่าระบบหลังบ้าน
        </Link>
        <span>›</span>
        <span className="font-semibold text-slate-800">{active.title}</span>
      </div>
      <div>
        <p className="page-title">{active.title}</p>
        <p className="page-sub" style={{ marginBottom: 16 }}>{active.sub}</p>
        <C />
      </div>
    </div>
  )
}
