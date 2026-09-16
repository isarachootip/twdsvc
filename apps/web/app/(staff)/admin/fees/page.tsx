'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Plus, Save, CheckCircle2, DollarSign, Truck, AlertCircle } from 'lucide-react';

interface CategoryWithFee {
  id: string;
  code: string;
  name: string;
  currentFeeRate: {
    operationFeeSatang: number;
    shippingFee3plSatang: number;
    effectiveFrom: string;
  };
}

export default function AdminFeesPage() {
  const [categories, setCategories] = useState<CategoryWithFee[]>([]);
  const [operationFees, setOperationFees] = useState<Record<string, number>>({});
  const [shippingFees, setShippingFees] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newOpFee, setNewOpFee] = useState('150');
  const [newShipFee, setNewShipFee] = useState('80');
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<CategoryWithFee[]>('/size-categories');
      setCategories(data);

      const opMap: Record<string, number> = {};
      const shipMap: Record<string, number> = {};
      data.forEach((c) => {
        opMap[c.id] = (c.currentFeeRate?.operationFeeSatang || 0) / 100;
        shipMap[c.id] = (c.currentFeeRate?.shippingFee3plSatang || 0) / 100;
      });
      setOperationFees(opMap);
      setShippingFees(shipMap);
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

  const handleSaveOperationFees = async () => {
    setIsSaving(true);
    try {
      const payload = categories.map((c) => ({
        sizeCategoryId: c.id,
        operationFeeSatang: Math.round((operationFees[c.id] || 0) * 100),
        shippingFee3plSatang: Math.round((shippingFees[c.id] || 0) * 100),
      }));

      await fetchApi('/fee-rates', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      showToast('บันทึกค่าดำเนินการเรียบร้อยแล้ว ✓');
      loadData();
    } catch (err: any) {
      alert(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShippingFees = async () => {
    setIsSaving(true);
    try {
      const payload = categories.map((c) => ({
        sizeCategoryId: c.id,
        operationFeeSatang: Math.round((operationFees[c.id] || 0) * 100),
        shippingFee3plSatang: Math.round((shippingFees[c.id] || 0) * 100),
      }));

      await fetchApi('/fee-rates', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      showToast('บันทึกค่าขนส่ง 3PL เรียบร้อยแล้ว ✓');
      loadData();
    } catch (err: any) {
      alert(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      setModalError('กรุณากรอกรหัสและชื่อประเภทสินค้า');
      return;
    }

    try {
      await fetchApi('/size-categories', {
        method: 'POST',
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          name: newName.trim(),
          operationFeeSatang: Math.round(Number(newOpFee) * 100),
          shippingFee3plSatang: Math.round(Number(newShipFee) * 100),
        }),
      });

      setIsAddModalOpen(false);
      setNewCode('');
      setNewName('');
      setModalError(null);
      showToast(`เพิ่มประเภทสินค้า "${newName}" เรียบร้อยแล้ว ✓`);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'เกิดข้อผิดพลาดในการสร้าง');
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

      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text">
            2. ค่าดำเนินการ และ ค่าขนส่ง 3PL
          </h2>
          <p className="text-xs text-text-mute">
            กำหนดอัตราค่าบริการมาตรฐานตามประเภทขนาดสินค้า (Size Category)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-surface border border-border-strong hover:bg-surface-2 text-text text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-red" />
          <span>+ เพิ่มประเภทสินค้า</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-text-mute">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Card 1: Operation Fees */}
          <div className="bg-surface rounded-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-red" />
                <h3 className="text-sm font-semibold text-text">
                  ค่าดำเนินการ (Operation Fee)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSaveOperationFees}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-red hover:bg-red-dark text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกค่าดำเนินการ'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60 text-text-2">
                    <th className="py-2.5 px-3 font-semibold">รหัส</th>
                    <th className="py-2.5 px-3 font-semibold">ประเภทขนาดสินค้า</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-48">
                      ค่าดำเนินการ (บาท)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium">{cat.code}</td>
                      <td className="py-2.5 px-3 font-medium text-text">{cat.name}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-text-mute">฿</span>
                          <input
                            type="number"
                            value={operationFees[cat.id] ?? ''}
                            onChange={(e) =>
                              setOperationFees({
                                ...operationFees,
                                [cat.id]: Number(e.target.value),
                              })
                            }
                            className="w-28 text-right px-2 py-1 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red text-xs font-semibold font-mono"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: 3PL Shipping Fees */}
          <div className="bg-surface rounded-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue" />
                <h3 className="text-sm font-semibold text-text">
                  ค่าขนส่งมาตรฐาน 3PL (Shipping Fee)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSaveShippingFees}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-red hover:bg-red-dark text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกค่าขนส่ง'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60 text-text-2">
                    <th className="py-2.5 px-3 font-semibold">รหัส</th>
                    <th className="py-2.5 px-3 font-semibold">ประเภทขนาดสินค้า</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-48">
                      ค่าขนส่ง 3PL (บาท)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium">{cat.code}</td>
                      <td className="py-2.5 px-3 font-medium text-text">{cat.name}</td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-text-mute">฿</span>
                          <input
                            type="number"
                            value={shippingFees[cat.id] ?? ''}
                            onChange={(e) =>
                              setShippingFees({
                                ...shippingFees,
                                [cat.id]: Number(e.target.value),
                              })
                            }
                            className="w-28 text-right px-2 py-1 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red text-xs font-semibold font-mono"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add SizeCategory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface rounded-card border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-text">
              + เพิ่มประเภทขนาดสินค้าใหม่
            </h3>

            {modalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-input flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  รหัสประเภท (Code) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น MEDIUM, XLARGE"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  ชื่อประเภทสินค้า *
                </label>
                <input
                  type="text"
                  placeholder="เช่น สินค้าขนาดกลาง (Medium)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1">
                    ค่าดำเนินการ (บาท)
                  </label>
                  <input
                    type="number"
                    value={newOpFee}
                    onChange={(e) => setNewOpFee(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1">
                    ค่าขนส่ง 3PL (บาท)
                  </label>
                  <input
                    type="number"
                    value={newShipFee}
                    onChange={(e) => setNewShipFee(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-input text-xs font-medium bg-surface-2 hover:bg-border text-text"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-input text-xs font-semibold bg-red hover:bg-red-dark text-white"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
