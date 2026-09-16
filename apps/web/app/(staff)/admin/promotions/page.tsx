'use client';

import React from 'react';
import { Gift, Clock } from 'lucide-react';

export default function AdminPromotionsPlaceholderPage() {
  return (
    <div className="bg-surface rounded-card border border-border p-12 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
        <Gift className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-base font-bold text-text">
          9. Trade-in & คูปองโปรโมชั่น (Trade-in & Promotions)
        </h2>
        <p className="text-xs text-text-mute mt-1 max-w-md mx-auto">
          หมวดนี้อยู่ในขอบเขตการพัฒนาของ <strong>STEP-10</strong> (หน้าตั้งค่าระบบหลังบ้าน ส่วนที่ 2)
        </p>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold">
        <Clock className="w-3.5 h-3.5" />
        <span>กำลังพัฒนาใน STEP-10</span>
      </div>
    </div>
  );
}
