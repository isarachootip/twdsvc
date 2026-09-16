'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getHomeRouteForRole, Role } from '@svcm/shared';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Forbidden403Page() {
  const { user } = useAuth();
  const homeRoute = user ? getHomeRouteForRole(user.role as Role) : '/login';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-red">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <span className="text-xs font-bold text-red tracking-wider uppercase">
          403 Forbidden
        </span>
        <h1 className="text-xl font-bold text-text">
          ไม่มีสิทธิ์เข้าถึงหน้านี้
        </h1>
        <p className="text-xs text-text-mute leading-relaxed">
          บทบาทของคุณ ({user?.role || 'ไม่ระบุ'}) ไม่ได้รับอนุญาตให้เข้าใช้งานเมนูนี้ตามนโยบายการรักษาความปลอดภัยของระบบ
        </p>
      </div>

      <Link
        href={homeRoute}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-input bg-red hover:bg-red-dark text-white text-xs font-semibold shadow-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>กลับหน้าหลักของคุณ</span>
      </Link>
    </div>
  );
}
