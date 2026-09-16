'use client';

import React from 'react';
import { MenuGuard } from '@/components/domain/MenuGuard';
import { Warehouse, Clock } from 'lucide-react';

export default function DcQueuePage() {
  return (
    <MenuGuard menuKey="dc">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-red" />
              ศูนย์กระจายสินค้า (DC Station)
            </h1>
            <p className="text-xs text-text-mute mt-1">
              รับเข้าพัสดุจากสาขา คัดแยก และส่งต่อไปยังศูนย์บริการซ่อม (VD)
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text">
            หน้านี้กำลังพัฒนา (STEP-16)
          </h3>
          <p className="text-xs text-text-mute max-w-md mx-auto">
            ระบบคิวงาน DC Hub Cross-docking จะพร้อมใช้งานในขั้นตอนที่ 16
          </p>
        </div>
      </div>
    </MenuGuard>
  );
}
