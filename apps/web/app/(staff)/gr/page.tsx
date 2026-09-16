'use client';

import React from 'react';
import { MenuGuard } from '@/components/domain/MenuGuard';
import { PackageCheck, Clock } from 'lucide-react';

export default function GrQueuePage() {
  return (
    <MenuGuard menuKey="gr">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-red" />
              คิวงาน GR (รับเข้าสินค้า / แพ็กส่ง / รับคืน)
            </h1>
            <p className="text-xs text-text-mute mt-1">
              จัดการพัสดุสินค้าซ่อมเข้า-ออกจากสาขา
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text">
            หน้านี้กำลังพัฒนา (STEP-14)
          </h3>
          <p className="text-xs text-text-mute max-w-md mx-auto">
            ระบบคิวงาน GR Station & Packing จะพร้อมใช้งานในขั้นตอนที่ 14
          </p>
        </div>
      </div>
    </MenuGuard>
  );
}
