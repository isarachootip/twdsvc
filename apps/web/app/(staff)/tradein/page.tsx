'use client';

import React from 'react';
import { MenuGuard } from '@/components/domain/MenuGuard';
import { Repeat, Clock } from 'lucide-react';

export default function TradeinPage() {
  return (
    <MenuGuard menuKey="tradein">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <Repeat className="w-5 h-5 text-red" />
              Trade-in / ส่วนลดคูปอง
            </h1>
            <p className="text-xs text-text-mute mt-1">
              ออกคูปอง Trade-in เก่าแลกใหม่ และตรวจสอบสถานะการใช้งาน
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-card border border-border p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-green mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text">
            หน้านี้กำลังพัฒนา (STEP-22)
          </h3>
          <p className="text-xs text-text-mute max-w-md mx-auto">
            ระบบ Trade-in & Coupon Issuing จะพร้อมใช้งานในขั้นตอนที่ 22
          </p>
        </div>
      </div>
    </MenuGuard>
  );
}
