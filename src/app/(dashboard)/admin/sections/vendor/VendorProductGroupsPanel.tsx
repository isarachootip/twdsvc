'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { Plus, Save, Trash2 } from 'lucide-react'
import type { VendorServiceMode } from '@/lib/validations/vendor-product-group.schema'

interface ServiceGroupRow {
  id?: number
  serviceType: VendorServiceMode
  name: string
  minInspectionFee: number
  recommendedFee: number
  minGpPct: number
  defaultGpPct: number
  sortOrder: number
  active: boolean
}

export function VendorProductGroupsPanel() {
  const [rows, setRows] = useState<ServiceGroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<VendorServiceMode>('CARRY_IN')
  const [savingIdx, setSavingIdx] = useState<number | null>(null)
  const { toast } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api<ServiceGroupRow[]>('/api/admin/vendor-product-groups')
      .then(data => setRows(data))
      .catch(() => toast('โหลดข้อมูลกลุ่มสินค้าไม่สำเร็จ', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const updateRow = (targetIdx: number, patch: Partial<ServiceGroupRow>) => {
    setRows(prev => prev.map((r, idx) => (idx === targetIdx ? { ...r, ...patch } : r)))
  }

  const addDraftRow = () => {
    setRows(prev => [
      ...prev,
      {
        serviceType: mode,
        name: '',
        minInspectionFee: 0,
        recommendedFee: mode === 'ON_SITE' ? 500 : 300,
        minGpPct: 0,
        defaultGpPct: 18,
        sortOrder: (prev.filter(r => r.serviceType === mode).length + 1) * 10,
        active: true,
      },
    ])
  }

  const saveRow = async (globalIdx: number) => {
    const row = rows[globalIdx]
    if (!row.name.trim()) return toast('กรุณาระบุชื่อกลุ่มสินค้า', 'error')
    setSavingIdx(globalIdx)
    try {
      await api('/api/admin/vendor-product-groups', { method: 'POST', body: row })
      toast(`บันทึกกลุ่ม "${row.name}" เรียบร้อยแล้ว`, 'success')
      load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ', 'error')
    } finally {
      setSavingIdx(null)
    }
  }

  const removeRow = async (globalIdx: number) => {
    const row = rows[globalIdx]
    if (!row.id) return setRows(prev => prev.filter((_, idx) => idx !== globalIdx))
    try {
      await api(`/api/admin/vendor-product-groups?id=${row.id}`, { method: 'DELETE' })
      toast(`ลบกลุ่ม "${row.name}" แล้ว`, 'info')
      load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'ลบไม่สำเร็จ', 'error')
    }
  }

  const filteredWithIndex = rows.map((row, globalIdx) => ({ row, globalIdx })).filter(x => x.row.serviceType === mode)

  return (
    <div className="pcard space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">จัดการกลุ่มสินค้ามาตรฐาน (Master Product Grouping)</h3>
          <p className="text-xs text-slate-500">กำหนดรายการกลุ่มสินค้า ค่าเปิดเครื่องขั้นต่ำ/แนะนำ และ GP เริ่มต้น สำหรับหน้าสมัครคู่ค้า</p>
        </div>
        <div className="flex items-center gap-2">
          {(['CARRY_IN', 'ON_SITE'] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`btn text-xs ${mode === m ? 'btn-primary' : 'btn-secondary'}`}>
              {m === 'CARRY_IN' ? '2.1 Carry-in (ซ่อมที่ศูนย์)' : '2.2 On-site (เข้าหน้างาน)'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs text-slate-500">กำลังโหลดข้อมูลกลุ่มสินค้า...</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl compact text-xs">
            <thead>
              <tr>
                <th>ชื่อกลุ่มสินค้า</th>
                <th>เปิดเครื่องขั้นต่ำ (฿)</th>
                <th>เปิดเครื่องแนะนำ (฿)</th>
                <th>GP ขั้นต่ำ (%)</th>
                <th>GP แนะนำ (%)</th>
                <th>ลำดับ</th>
                <th>เปิดใช้</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredWithIndex.map(({ row, globalIdx }) => (
                <tr key={row.id ?? `draft-${globalIdx}`}>
                  <td>
                    <input type="text" className="inp inp-sm w-full min-w-[180px]" value={row.name} placeholder="ระบุชื่อกลุ่มสินค้า" onChange={e => updateRow(globalIdx, { name: e.target.value })} />
                  </td>
                  <td>
                    <input type="number" min={0} className="inp inp-sm w-24" value={row.minInspectionFee} onChange={e => updateRow(globalIdx, { minInspectionFee: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td>
                    <input type="number" min={0} className="inp inp-sm w-24" value={row.recommendedFee} onChange={e => updateRow(globalIdx, { recommendedFee: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td>
                    <input type="number" min={0} max={100} step="0.5" className="inp inp-sm w-20" value={row.minGpPct} onChange={e => updateRow(globalIdx, { minGpPct: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td>
                    <input type="number" min={0} max={100} step="0.5" className="inp inp-sm w-20" value={row.defaultGpPct} onChange={e => updateRow(globalIdx, { defaultGpPct: Math.max(0, Number(e.target.value) || 0) })} />
                  </td>
                  <td>
                    <input type="number" className="inp inp-sm w-16" value={row.sortOrder} onChange={e => updateRow(globalIdx, { sortOrder: Number(e.target.value) || 0 })} />
                  </td>
                  <td>
                    <input type="checkbox" checked={row.active} onChange={e => updateRow(globalIdx, { active: e.target.checked })} className="accent-red-700" />
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button type="button" disabled={savingIdx === globalIdx} onClick={() => saveRow(globalIdx)} className="btn btn-primary text-xs py-1 px-2.5 inline-flex items-center gap-1">
                        <Save className="w-3 h-3" /> บันทึก
                      </button>
                      <button type="button" onClick={() => removeRow(globalIdx)} className="btn btn-secondary text-xs py-1 px-2 text-rose-600" title="ลบกลุ่มสินค้า">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <button type="button" onClick={addDraftRow} className="btn btn-secondary text-xs inline-flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> เพิ่มกลุ่มสินค้า {mode === 'CARRY_IN' ? 'Carry-in' : 'On-site'}
        </button>
      </div>
    </div>
  )
}
