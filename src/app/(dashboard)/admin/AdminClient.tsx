'use client'

import Link from 'next/link'
import {
  VendorSection, FeeSection, BranchSection, ZoneSection, SlaSection, RoleSection, SkuSection,
  PayoutSection, TradeinSection, DashboardSection, GeneralSection, PendingVendorSection,
} from './Sections'

export const ADMIN_SECTIONS = [
  { id: 'vendor', name: 'Vendor Portal', title: 'Vendor Portal', sub: 'VD หลัก, ศูนย์บริการย่อย, แบรนด์/ขนาดที่รับผิดชอบ, โซน', C: VendorSection },
  { id: 'fee', name: 'ค่าดำเนินการ / ค่าขนส่ง', title: 'ตั้งค่าค่าดำเนินการและค่าขนส่ง 3PL', sub: 'กำหนดค่าธรรมเนียมแยกตามประเภทสินค้า', C: FeeSection },
  { id: 'branch', name: 'สาขาไทวัสดุ', title: 'Maintain รายชื่อสาขา', sub: 'ผูกชื่อสาขากับผู้จัดการเขต (District Manager)', C: BranchSection },
  { id: 'zone', name: 'จับคู่สาขา - VD', title: 'จับคู่สาขากับศูนย์บริการ VD', sub: 'ใช้กำหนดว่า Book 3PL / ส่งซ่อมให้ไปศูนย์ VD ใด', C: ZoneSection },
  { id: 'sla', name: 'SLA', title: 'ตั้งค่า SLA การทำงาน', sub: 'กำหนดระยะเวลามาตรฐานของแต่ละขั้นตอน ตั้งแต่เปิดงานถึงปิดงาน', C: SlaSection },
  { id: 'role', name: 'สิทธิ์ผู้ใช้งาน', title: 'กำหนดสิทธิ์ผู้ใช้งาน (Role)', sub: 'Admin, Executive, CS, GR, DC, VD, S2', C: RoleSection },
  { id: 'sku', name: 'SKU ค่าซ่อม', title: 'ตั้งค่า SKU ค่าซ่อม', sub: 'SKU กลางที่ใช้ร่วมกันทุก VD', C: SkuSection },
  { id: 'payout', name: 'รอบจ่ายเงิน Vendor', title: 'ตั้งค่ารอบจ่ายเงิน Vendor', sub: 'กำหนดรอบบิลและเงื่อนไขหักเงิน', C: PayoutSection },
  { id: 'tradein', name: 'Trade-in / คูปอง', title: 'ตั้งค่า Trade-in และโปรโมชั่นคูปอง', sub: 'กำหนด % ส่วนลด แยกประเภทและช่วงเวลาโปรโมชั่น', C: TradeinSection },
  { id: 'dashboard', name: 'Dashboard', title: 'ตั้งค่าการแสดงผล Dashboard', sub: 'เลือกรายการสรุปที่แสดง และสิทธิ์เห็นข้อมูลต้นทุน', C: DashboardSection },
  { id: 'general', name: 'ตั้งค่าทั่วไป', title: 'ตั้งค่าทั่วไป', sub: 'VAT, อายุลิงก์ใบเสนอราคา, ค่า 3PL ขากลับ, อายุคูปอง, เกณฑ์ SLA VD', C: GeneralSection },
  { id: 'pending', name: 'รอกำหนดศูนย์ซ่อม', title: 'รอกำหนดศูนย์ซ่อม', sub: 'คิวงานที่ระบบหาศูนย์ซ่อมไม่ได้ (PENDING_VENDOR_ASSIGNMENT)', C: PendingVendorSection },
]

import { SECTION_ALIAS } from './constants'
export { SECTION_ALIAS }



export default function AdminClient({ section }: { section: string }) {
  const normalizedId = SECTION_ALIAS[section] || section
  const active = ADMIN_SECTIONS.find(s => s.id === normalizedId) ?? ADMIN_SECTIONS[0]
  const C = active.C
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '230px minmax(0,1fr)', gap: 20, alignItems: 'start', maxWidth: 1360, margin: '0 auto' }}>
      <aside className="pcard" style={{ padding: 10, position: 'sticky', top: 0 }}>
        <div style={{ padding: '6px 8px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Service Center</div>
          <div className="sub-mute" style={{ fontSize: 12 }}>ตั้งค่าระบบหลังบ้าน</div>
        </div>
        {ADMIN_SECTIONS.map((s, i) => (
          <Link
            key={s.id}
            href={`/admin/${s.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 13,
              color: s.id === active.id ? 'var(--red-dark)' : 'var(--text-2)',
              background: s.id === active.id ? 'var(--red-tint)' : 'transparent',
              fontWeight: s.id === active.id ? 600 : 400,
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: s.id === active.id ? 'var(--red)' : 'var(--surface-2)',
                color: s.id === active.id ? '#fff' : 'var(--text-2)',
                fontSize: 11,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <span>{s.name}</span>
          </Link>
        ))}
      </aside>
      <div>
        <p className="page-title">{active.title}</p>
        <p className="page-sub" style={{ marginBottom: 16 }}>{active.sub}</p>
        <C />
      </div>
    </div>
  )
}
