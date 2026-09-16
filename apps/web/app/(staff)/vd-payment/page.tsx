'use client';

import React from 'react';
import { MenuGuard } from '@/components/domain/MenuGuard';
import { Receipt, Clock } from 'lucide-react';

export default function VdPaymentPage() {
  return (
    <MenuGuard menuKey="vd_payment">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red" />
              รายงานจ่ายเงิน VD (Payout Batch)
            </h1>
            <p className="text-xs text-text-mute mt-1">
              คำนวณและสรุปยอดรอบทำจ่ายค่าแรง/ค่าซ่อมให้แก่ศูนย์บริการภายนอก
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text">
            หน้านี้กำลังพัฒนา (STEP-24)
          </h3>
          <p className="text-xs text-text-mute max-w-md mx-auto">
            ระบบคำนวณรอบจ่ายเงินศูนย์ซ่อม Vendor Payout Batch จะพร้อมใช้งานในขั้นตอนที่ 24
          </p>
        </div>
      </div>
    </MenuGuard>
  );
}
