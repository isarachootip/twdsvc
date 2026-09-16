'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { CalendarDays, Save, CheckCircle2, Info } from 'lucide-react';

export type PayoutCycleType = 'MONTHLY_2X' | 'MONTHLY_1X' | 'WEEKLY';

interface PayoutConfig {
  id?: string;
  cycleType: PayoutCycleType;
  daysOfMonth: number[];
  nextCycleDate: string;
}

export default function AdminPayoutPage() {
  const [cycleType, setCycleType] = useState<PayoutCycleType>('MONTHLY_2X');
  const [nextCycleDate, setNextCycleDate] = useState('2026-09-30');
  const [daysOfMonthStr, setDaysOfMonthStr] = useState('15, 30');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<PayoutConfig>('/payout-config');
      if (data) {
        setCycleType(data.cycleType || 'MONTHLY_2X');
        if (data.daysOfMonth && Array.isArray(data.daysOfMonth)) {
          setDaysOfMonthStr(data.daysOfMonth.join(', '));
        }
        if (data.nextCycleDate) {
          setNextCycleDate(new Date(data.nextCycleDate).toISOString().split('T')[0]);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const days = daysOfMonthStr
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 31);

      await fetchApi('/payout-config', {
        method: 'PUT',
        body: JSON.stringify({
          cycleType,
          daysOfMonth: days.length > 0 ? days : [15, 30],
          nextCycleDate,
        }),
      });

      showToast('บันทึกรอบจ่ายเงินเรียบร้อยแล้ว ✓');
      loadData();
    } catch (err: any) {
      alert(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-text text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-text">8. รอบจ่ายเงิน Vendor</h2>
        <p className="text-xs text-text-mute">
          กำหนดรอบบิลการตัดจ่ายเงินค่าซ่อมและค่าบริการให้แก่ Vendor
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-text-mute">กำลังโหลดข้อมูล...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-surface rounded-card border border-border p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <CalendarDays className="w-4 h-4 text-red" />
              <h3 className="text-sm font-semibold text-text">
                การตั้งค่ารอบจ่ายเงิน (Payout Cycle Configuration)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  รูปแบบรอบจ่าย *
                </label>
                <select
                  value={cycleType}
                  onChange={(e) => {
                    const val = e.target.value as PayoutCycleType;
                    setCycleType(val);
                    if (val === 'MONTHLY_2X') setDaysOfMonthStr('15, 30');
                    if (val === 'MONTHLY_1X') setDaysOfMonthStr('30');
                    if (val === 'WEEKLY') setDaysOfMonthStr('7, 14, 21, 28');
                  }}
                  className="w-full text-xs px-3 py-2 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red font-medium"
                >
                  <option value="MONTHLY_2X">ทุก 15 วัน (วันที่ 15 และสิ้นเดือน)</option>
                  <option value="MONTHLY_1X">เดือนละ 1 ครั้ง (ทุกสิ้นเดือน)</option>
                  <option value="WEEKLY">ทุกสัปดาห์ (Weekly)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  วันที่ในเดือนสำหรับตัดรอบ (คั่นด้วยจุลภาค)
                </label>
                <input
                  type="text"
                  placeholder="เช่น 15, 30"
                  value={daysOfMonthStr}
                  onChange={(e) => setDaysOfMonthStr(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  วันที่เริ่มรอบถัดไป *
                </label>
                <input
                  type="date"
                  value={nextCycleDate}
                  onChange={(e) => setNextCycleDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red font-mono"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-surface-2 rounded-input flex items-start gap-2 text-xs text-text-2">
              <Info className="w-4 h-4 text-blue shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-text">เกณฑ์การคำนวณยอดจ่าย:</span>
                <p>
                  ยอดจ่ายคำนวณจากรายงานใบงานที่ Vendor ปิดงานสำเร็จ (Closed) ภายในรอบ หัก GP% ตามที่ตั้งไว้ในหน้า Vendor Portal และหักรายการเงินปรับ/ค่าเสียหายเพิ่มเติมกรณีตรวจพบข้อผิดพลาด
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-input bg-red hover:bg-red-dark text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกรอบจ่าย'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
