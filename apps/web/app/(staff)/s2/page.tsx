'use client';

import React from 'react';
import { MenuGuard } from '@/components/domain/MenuGuard';
import { Boxes, Clock } from 'lucide-react';

export default function S2StockPage() {
  return (
    <MenuGuard menuKey="s2">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <Boxes className="w-5 h-5 text-red" />
              สต็อกสาขา (S2 Internal Repair)
            </h1>
            <p className="text-xs text-text-mute mt-1">
              เปิดและติดตามงานซ่อมสินค้าสต็อก/สินค้าตัวโชว์ของสาขา
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text">
            หน้านี้กำลังพัฒนา (STEP-23)
          </h3>
          <p className="text-xs text-text-mute max-w-md mx-auto">
            ระบบงานซ่อมสินค้าสต็อกสาขา S2 จะพร้อมใช้งานในขั้นตอนที่ 23
          </p>
        </div>
      </div>
    </MenuGuard>
  );
}
