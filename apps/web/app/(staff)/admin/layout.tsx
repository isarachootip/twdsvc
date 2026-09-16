'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuGuard } from '@/components/domain/MenuGuard';
import {
  Users,
  DollarSign,
  Building2,
  GitFork,
  Clock,
  ShieldCheck,
  Tag,
  CalendarDays,
  Gift,
  LayoutGrid,
  Sliders,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AdminSectionItem {
  id: string;
  num: number;
  label: string;
  path: string;
  icon: React.ElementType;
  isReadyInStep9: boolean;
}

export const ADMIN_SECTIONS: AdminSectionItem[] = [
  {
    id: 'vendors',
    num: 1,
    label: 'Vendor Portal',
    path: '/admin/vendors',
    icon: Users,
    isReadyInStep9: false,
  },
  {
    id: 'fees',
    num: 2,
    label: 'ค่าดำเนินการ / ค่าขนส่ง',
    path: '/admin/fees',
    icon: DollarSign,
    isReadyInStep9: true,
  },
  {
    id: 'sites',
    num: 3,
    label: 'สาขาไทวัสดุ & ผจก.เขต',
    path: '/admin/sites',
    icon: Building2,
    isReadyInStep9: true,
  },
  {
    id: 'routes',
    num: 4,
    label: 'จับคู่สาขา-VD',
    path: '/admin/routes',
    icon: GitFork,
    isReadyInStep9: false,
  },
  {
    id: 'sla',
    num: 5,
    label: 'ขั้นตอน SLA',
    path: '/admin/sla',
    icon: Clock,
    isReadyInStep9: false,
  },
  {
    id: 'rbac',
    num: 6,
    label: 'สิทธิ์ผู้ใช้งาน & Matrix',
    path: '/admin/rbac',
    icon: ShieldCheck,
    isReadyInStep9: false,
  },
  {
    id: 'skus',
    num: 7,
    label: 'SKU ค่าซ่อม',
    path: '/admin/skus',
    icon: Tag,
    isReadyInStep9: true,
  },
  {
    id: 'payout',
    num: 8,
    label: 'รอบจ่ายเงิน Vendor',
    path: '/admin/payout',
    icon: CalendarDays,
    isReadyInStep9: true,
  },
  {
    id: 'promotions',
    num: 9,
    label: 'Trade-in & คูปอง',
    path: '/admin/promotions',
    icon: Gift,
    isReadyInStep9: false,
  },
  {
    id: 'dashboard',
    num: 10,
    label: 'ตั้งค่า Dashboard',
    path: '/admin/dashboard',
    icon: LayoutGrid,
    isReadyInStep9: false,
  },
  {
    id: 'settings',
    num: 11,
    label: 'ตั้งค่าทั่วไป',
    path: '/admin/settings',
    icon: Sliders,
    isReadyInStep9: true,
  },
  {
    id: 'pending-assignment',
    num: 12,
    label: 'รอกำหนดศูนย์ซ่อม',
    path: '/admin/pending-assignment',
    icon: AlertOctagon,
    isReadyInStep9: false,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <MenuGuard menuKey="admin">
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="border-b border-border pb-3">
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red inline-block" />
            ตั้งค่าระบบหลังบ้าน (Admin Settings)
          </h1>
          <p className="text-xs text-text-mute mt-0.5">
            จัดการ Master Data, ค่าธรรมเนียม, สิทธิ์ผู้ใช้งาน และการตั้งค่าระบบ
          </p>
        </div>

        {/* 2-Column Layout: Admin Sub-Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sub Sidebar */}
          <aside className="lg:col-span-3 bg-surface rounded-card border border-border p-2 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-text-mute uppercase tracking-wider">
              หมวดการตั้งค่า (12 หมวด)
            </div>

            {ADMIN_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive =
                pathname === sec.path || pathname.startsWith(`${sec.path}/`);

              return (
                <Link
                  key={sec.id}
                  href={sec.path}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-input text-xs font-medium transition-all select-none',
                    isActive
                      ? 'bg-red text-white font-semibold shadow-xs'
                      : 'text-text-2 hover:bg-surface-2 hover:text-text'
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0',
                      isActive ? 'bg-white/20 text-white' : 'bg-surface-2 text-text-mute'
                    )}
                  >
                    {sec.num}
                  </span>
                  <span className="truncate flex-1">{sec.label}</span>
                  {!sec.isReadyInStep9 && (
                    <span
                      className={cn(
                        'text-[9px] px-1 py-0.2 rounded shrink-0',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-50 text-amber-800'
                      )}
                    >
                      Step 10
                    </span>
                  )}
                </Link>
              );
            })}
          </aside>

          {/* Main Sub Section Content Area */}
          <section className="lg:col-span-9 space-y-6">{children}</section>
        </div>
      </div>
    </MenuGuard>
  );
}
