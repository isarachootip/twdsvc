'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Sliders, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
  const [vatRatePct, setVatRatePct] = useState('7');
  const [quoteExpiryDays, setQuoteExpiryDays] = useState('7');
  const [charge3plReturnFee, setCharge3plReturnFee] = useState(true);
  const [tradeInCouponValidDays, setTradeInCouponValidDays] = useState('30');
  const [vendorSlaThreshold, setVendorSlaThreshold] = useState('24');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<Record<string, any>>('/settings');
      if (data) {
        if (data.vatRate !== undefined) setVatRatePct(String(data.vatRate * 100));
        if (data.quoteExpiryDays !== undefined) setQuoteExpiryDays(String(data.quoteExpiryDays));
        if (data.charge3plReturnFee !== undefined) setCharge3plReturnFee(Boolean(data.charge3plReturnFee));
        if (data.tradeInCouponValidDays !== undefined) setTradeInCouponValidDays(String(data.tradeInCouponValidDays));
        if (data.vendorSlaThreshold !== undefined) setVendorSlaThreshold(String(data.vendorSlaThreshold));
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
      const payload = {
        vatRate: Number(vatRatePct) / 100,
        quoteExpiryDays: Number(quoteExpiryDays),
        charge3plReturnFee,
        tradeInCouponValidDays: Number(tradeInCouponValidDays),
        vendorSlaThreshold: Number(vendorSlaThreshold),
      };

      await fetchApi('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      showToast('บันทึกการตั้งค่าทั่วไปเรียบร้อยแล้ว ✓');
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
        <h2 className="text-base font-bold text-text">11. ตั้งค่าทั่วไป (System Settings)</h2>
        <p className="text-xs text-text-mute">
          กำหนดค่าพารามิเตอร์และเงื่อนไขการทำงานกลางของระบบ SVCM
        </p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-text-mute">กำลังโหลดข้อมูล...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-surface rounded-card border border-border p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sliders className="w-4 h-4 text-red" />
              <h3 className="text-sm font-semibold text-text">
                พารามิเตอร์ระบบ (General Parameters)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* VAT Rate */}
              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  อัตราภาษีมูลค่าเพิ่ม (VAT %)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={vatRatePct}
                    onChange={(e) => setVatRatePct(e.target.value)}
                    className="w-full text-xs px-3 py-2 pr-8 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red font-mono"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-text-mute font-semibold">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-text-mute mt-1">
                  ใช้คำนวณในใบเสนอราคาและออกใบเสร็จรับเงิน (ค่าเริ่มต้น 7%)
                </p>
              </div>

              {/* Quote Expiry */}
              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  อายุลิงก์ใบเสนอราคา (วัน)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={quoteExpiryDays}
                    onChange={(e) => setQuoteExpiryDays(e.target.value)}
                    className="w-full text-xs px-3 py-2 pr-12 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red font-mono"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-text-mute font-semibold">
                    วัน
                  </span>
                </div>
                <p className="text-[11px] text-text-mute mt-1">
                  ระยะเวลาที่ลูกค้าสามารถเปิดลิงก์เพื่อกดอนุมัติซ่อมออนไลน์ได้
                </p>
              </div>

              {/* Trade-In Coupon Validity */}
              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  อายุคูปองส่วนลด Trade-in (วัน)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={tradeInCouponValidDays}
                    onChange={(e) => setTradeInCouponValidDays(e.target.value)}
                    className="w-full text-xs px-3 py-2 pr-12 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red font-mono"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-text-mute font-semibold">
                    วัน
                  </span>
                </div>
                <p className="text-[11px] text-text-mute mt-1">
                  จำนวนวันใช้งานของบาร์โค้ดคูปองส่วนลดที่ออกให้ลูกค้า
                </p>
              </div>

              {/* Vendor SLA Alert Threshold */}
              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  เกณฑ์เตือน SLA ใกล้ครบกำหนด (ชั่วโมง)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={vendorSlaThreshold}
                    onChange={(e) => setVendorSlaThreshold(e.target.value)}
                    className="w-full text-xs px-3 py-2 pr-12 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red font-mono"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-text-mute font-semibold">
                    ชม.
                  </span>
                </div>
                <p className="text-[11px] text-text-mute mt-1">
                  ระบบจะเปลี่ยนสถานะเป็นสีส้ม/แจ้งเตือนเมื่อเวลางานใกล้หมด
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              {/* Charge 3PL Return Fee Toggle */}
              <div className="flex items-center justify-between p-3 bg-surface-2/40 rounded-card border border-border">
                <div>
                  <div className="text-xs font-semibold text-text">
                    คิดค่าขนส่ง 3PL ขากลับ กรณีลูกค้าปฏิเสธการซ่อม
                  </div>
                  <div className="text-[11px] text-text-mute mt-0.5">
                    หากเปิดใช้งาน เมื่อลูกค้าไม่อนุมัติซ่อมและเลือกรับเครื่องคืนทาง 3PL ระบบจะคำนวณเก็บค่าจัดส่งขากลับ
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCharge3plReturnFee(!charge3plReturnFee)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
                    charge3plReturnFee ? 'bg-emerald-500' : 'bg-border-strong'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block w-4 h-4 transform bg-white rounded-full transition duration-200 ease-in-out mt-1 ml-1',
                      charge3plReturnFee ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-input bg-red hover:bg-red-dark text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
