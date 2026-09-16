'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MENU_DEFINITIONS, MenuKey } from '@svcm/shared';
import {
  TrendingUp,
  LayoutDashboard,
  ClipboardList,
  FilePlus,
  PackageCheck,
  Warehouse,
  Wrench,
  Repeat,
  Boxes,
  Receipt,
  Settings,
  LogOut,
  Search,
  Menu as MenuIcon,
  X,
  QrCode,
  Shield,
  Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  LayoutDashboard,
  ClipboardList,
  FilePlus,
  PackageCheck,
  Warehouse,
  Wrench,
  Repeat,
  Boxes,
  Receipt,
  Settings,
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchJobNo, setSearchJobNo] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-red border-t-transparent animate-spin" />
          <p className="text-xs text-text-mute font-medium">กำลังโหลดข้อมูลระบบ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchJobNo.trim()) return;
    router.push(`/jobs?q=${encodeURIComponent(searchJobNo.trim())}`);
  };

  const allowedMenus = user.menus || [];

  return (
    <div className="min-h-screen bg-bg flex font-sans">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (220px fixed on desktop) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[220px] bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-border flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-7 h-7 rounded bg-red text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-red-dark transition-colors">
              SC
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-text leading-tight">
                Thaiwatsadu
              </span>
              <span className="text-[10px] text-text-mute leading-tight">
                Service Center
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 text-text-mute hover:text-text rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Navigation Menu Items */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {allowedMenus.map((menuKey) => {
            const def = MENU_DEFINITIONS[menuKey as MenuKey];
            if (!def) return null;
            const Icon = ICON_MAP[def.iconName] || ClipboardList;
            const isActive = pathname === def.path || pathname.startsWith(`${def.path}/`);

            return (
              <Link
                key={def.key}
                href={def.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-input text-xs font-medium transition-all select-none',
                  isActive
                    ? 'bg-red text-white font-semibold shadow-xs'
                    : 'text-text-2 hover:bg-surface-2 hover:text-text'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-white' : 'text-text-mute'
                  )}
                />
                <span className="truncate">{def.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Scope Preview */}
        <div className="p-3 border-t border-border bg-surface-2/40 text-[11px] text-text-mute space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-text-2">
            <Store className="w-3.5 h-3.5 text-text-mute shrink-0" />
            <span className="truncate">
              {user.site?.name || user.vendorCenter?.name || 'สำนักงานใหญ่'}
            </span>
          </div>
          <div className="text-[10px] text-text-mute pl-5">
            Role: <span className="font-semibold text-text">{user.role}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-surface border-b border-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Mobile Toggle & Page Title / Global Search */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-text-2 hover:bg-surface-2 rounded-input"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Global Search / Barcode Scan Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="สแกนหรือค้นหาเลขที่ใบงาน (JB-...)"
                value={searchJobNo}
                onChange={(e) => setSearchJobNo(e.target.value)}
                className="w-full text-xs pl-8 pr-8 py-1.5 rounded-input border border-border bg-surface-2/60 focus:bg-surface focus:outline-none focus:border-red transition-all placeholder:text-text-mute"
              />
              <Search className="w-3.5 h-3.5 text-text-mute absolute left-2.5 top-2 pointer-events-none" />
              <button
                type="button"
                onClick={() => alert('เปิดกล้องสแกน Barcode / QR Code')}
                className="absolute right-2 top-1.5 text-text-mute hover:text-red transition-colors"
                title="สแกน QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right: User Profile Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-text leading-tight">
                {user.displayName}
              </span>
              <span className="text-[10px] text-text-mute leading-tight">
                {user.site?.name || user.vendorCenter?.name || user.role}
              </span>
            </div>

            {/* Role Badge */}
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0',
                user.role === 'ADMIN'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : user.role === 'EXECUTIVE'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              )}
            >
              {user.role}
            </span>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-input text-text-mute hover:text-red hover:bg-rose-50 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
