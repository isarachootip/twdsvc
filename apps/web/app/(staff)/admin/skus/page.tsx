'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChargeType =
  | 'FREE_IN_WARRANTY'
  | 'OUT_OF_WARRANTY'
  | 'LABOUR_ONLY'
  | 'PART_ONLY'
  | 'INSPECTION_ONLY'
  | 'OTHER';

interface RepairSkuItem {
  id: string;
  code: string;
  description: string;
  chargeType: ChargeType;
}

const CHARGE_TYPE_OPTIONS: Array<{ value: ChargeType; label: string; badgeClass: string }> = [
  {
    value: 'OUT_OF_WARRANTY',
    label: 'นอกประกัน (Out of Warranty)',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  {
    value: 'FREE_IN_WARRANTY',
    label: 'ในประกัน (In Warranty - ฟรี)',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  {
    value: 'LABOUR_ONLY',
    label: 'เฉพาะค่าแรง (Labour Only)',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'PART_ONLY',
    label: 'เฉพาะค่าอะไหล่ (Part Only)',
    badgeClass: 'bg-purple-100 text-purple-800',
  },
  {
    value: 'INSPECTION_ONLY',
    label: 'ค่าเปิดเครื่องตรวจเช็ค (Inspection)',
    badgeClass: 'bg-rose-100 text-rose-800',
  },
  {
    value: 'OTHER',
    label: 'อื่นๆ (Other)',
    badgeClass: 'bg-surface-2 text-text-2',
  },
];

export default function AdminSkusPage() {
  const [skus, setSkus] = useState<RepairSkuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<RepairSkuItem | null>(null);
  const [skuCode, setSkuCode] = useState('');
  const [skuDesc, setSkuDesc] = useState('');
  const [skuChargeType, setSkuChargeType] = useState<ChargeType>('OUT_OF_WARRANTY');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirm Modal
  const [skuToDelete, setSkuToDelete] = useState<RepairSkuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<RepairSkuItem[]>('/repair-skus');
      setSkus(data);
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

  const handleOpenAdd = () => {
    setEditingSku(null);
    setSkuCode('');
    setSkuDesc('');
    setSkuChargeType('OUT_OF_WARRANTY');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RepairSkuItem) => {
    setEditingSku(item);
    setSkuCode(item.code);
    setSkuDesc(item.description);
    setSkuChargeType(item.chargeType);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuCode.trim() || !skuDesc.trim()) {
      setModalError('กรุณาระบุรหัส SKU และรายละเอียด');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: skuCode.trim().toUpperCase(),
        description: skuDesc.trim(),
        chargeType: skuChargeType,
      };

      if (editingSku) {
        await fetchApi(`/repair-skus/${editingSku.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast(`แก้ไข SKU "${payload.code}" เรียบร้อยแล้ว ✓`);
      } else {
        await fetchApi('/repair-skus', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast(`เพิ่ม SKU "${payload.code}" เรียบร้อยแล้ว ✓`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!skuToDelete) return;
    setIsDeleting(true);
    try {
      await fetchApi(`/repair-skus/${skuToDelete.id}`, {
        method: 'DELETE',
      });
      showToast(`ลบ SKU "${skuToDelete.code}" เรียบร้อยแล้ว ✓`);
      setSkuToDelete(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบ SKU ได้');
    } finally {
      setIsDeleting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text">7. SKU ค่าซ่อม</h2>
          <p className="text-xs text-text-mute">
            SKU กลางสำหรับค่าบริการและค่าซ่อมที่ใช้ร่วมกันทุกศูนย์บริการ Vendor
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-input bg-red hover:bg-red-dark text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ เพิ่ม SKU</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-text-mute">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="bg-surface rounded-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-2/30 text-xs text-text-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-red" />
            <span>
              ใช้ SKU เดียวกันทุกศูนย์บริการ Vendor เพื่อให้การบันทึกบัญชีและการออกเอกสารรับเงินเป็นมาตรฐานเดียวกัน
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-text-2">
                  <th className="py-2.5 px-4 font-semibold w-44">รหัส SKU</th>
                  <th className="py-2.5 px-4 font-semibold">รายละเอียดรายการ</th>
                  <th className="py-2.5 px-4 font-semibold w-48">ประเภทรายการเงิน</th>
                  <th className="py-2.5 px-4 font-semibold text-right w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {skus.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-mute">
                      ยังไม่มีรายการ SKU ค่าซ่อม
                    </td>
                  </tr>
                ) : (
                  skus.map((sku) => {
                    const typeOption = CHARGE_TYPE_OPTIONS.find(
                      (o) => o.value === sku.chargeType
                    );
                    return (
                      <tr key={sku.id} className="hover:bg-surface-2/30 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-text">
                          {sku.code}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-text">
                          {sku.description}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-semibold inline-block',
                              typeOption?.badgeClass || 'bg-surface-2 text-text-2'
                            )}
                          >
                            {typeOption?.label || sku.chargeType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sku)}
                              title="แก้ไข"
                              className="p-1 rounded text-text-mute hover:text-text hover:bg-surface-2 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSkuToDelete(sku)}
                              title="ลบ"
                              className="p-1 rounded text-text-mute hover:text-red hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface rounded-card border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-text">
              {editingSku ? 'แก้ไข SKU ค่าซ่อม' : '+ เพิ่ม SKU ค่าซ่อมใหม่'}
            </h3>

            {modalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-input flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  รหัส SKU *
                </label>
                <input
                  type="text"
                  placeholder="เช่น SVC-REPAIR-001"
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  รายละเอียดรายการ *
                </label>
                <input
                  type="text"
                  placeholder="เช่น ค่าซ่อมสินค้า (รวม VAT)"
                  value={skuDesc}
                  onChange={(e) => setSkuDesc(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                  ประเภทรายการเงิน (Charge Type) *
                </label>
                <select
                  value={skuChargeType}
                  onChange={(e) => setSkuChargeType(e.target.value as ChargeType)}
                  className="w-full text-xs px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
                >
                  {CHARGE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-input text-xs font-medium bg-surface-2 hover:bg-border text-text"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-input text-xs font-semibold bg-red hover:bg-red-dark text-white disabled:opacity-50"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {skuToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface rounded-card border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-text">
                ยืนยันการลบ SKU ค่าซ่อม
              </h3>
            </div>

            <p className="text-xs text-text-2 leading-relaxed">
              คุณต้องการลบ SKU <strong>&quot;{skuToDelete.code} ({skuToDelete.description})&quot;</strong> ออกจากระบบหรือไม่?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSkuToDelete(null)}
                className="px-3 py-1.5 rounded-input text-xs font-medium bg-surface-2 hover:bg-border text-text"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded-input text-xs font-semibold bg-red hover:bg-red-dark text-white disabled:opacity-50"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
