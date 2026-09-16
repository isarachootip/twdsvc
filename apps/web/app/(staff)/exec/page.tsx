'use client';

import React from 'react';
import { MenuGuard } from '@/components/domain/MenuGuard';
import { TrendingUp, Clock } from 'lucide-react';

export default function ExecDashboardPage() {
  return (
    <MenuGuard menuKey="exec">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red" />
              Executive Dashboard (ผู้บริหาร)
            </h1>
            <p className="text-xs text-text-mute mt-1">
              ภาพรวมผลประกอบการ รายได้ กำไร และสุขภาพการปฏิบัติการทั่วประเทศ
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text">
            หน้านี้กำลังพัฒนา (STEP-26)
          </h3>
          <p className="text-xs text-text-mute max-w-md mx-auto">
            ระบบ Executive Dashboard สำหรับผู้บริหารระดับสูง จะพร้อมใช้งานในขั้นตอนที่ 26
          </p>
        </div>
      </div>
    </MenuGuard>
  );
}
