'use client';

import React from 'react';
import { MenuGuard } from '@/components/domain/MenuGuard';
import { ClipboardList, Clock } from 'lucide-react';

export default function JobsListPage() {
  return (
    <MenuGuard menuKey="jobs">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-red" />
              งานซ่อมทั้งหมด (All Jobs)
            </h1>
            <p className="text-xs text-text-mute mt-1">
              รายการใบแจ้งซ่อมทั้งหมดตามขอบเขตสิทธิ์ของคุณ
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-green mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text">
            หน้านี้กำลังพัฒนา (STEP-15)
          </h3>
          <p className="text-xs text-text-mute max-w-md mx-auto">
            ระบบค้นหา คัดกรอง และดูรายละเอียดใบแจ้งซ่อมทั้งหมด จะพร้อมใช้งานในขั้นตอนที่ 15
          </p>
        </div>
      </div>
    </MenuGuard>
  );
}
