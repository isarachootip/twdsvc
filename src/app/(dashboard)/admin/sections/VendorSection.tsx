'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { useSave, SaveButton, Row, Loading, useSites } from './admin-helpers'
import { VendorParentCard, type VendorParentRow, type NamedOption } from './VendorParentCard'
import type { VendorCenterRow } from './VendorCenterTable'

export function VendorSection() {
  const [list, setList] = useState<VendorParentRow[] | null>(null)
  const [brands, setBrands] = useState<NamedOption[]>([])
  const [sizes, setSizes] = useState<NamedOption[]>([])
  const sites = useSites()
  const { saving, save, justSaved } = useSave()
  const { confirm } = useToast()

  const load = useCallback(
    () =>
      api<VendorParentRow[]>('/api/admin/vendors').then(v =>
        setList(v.map(p => ({ ...p, centers: p.centers.map(c => ({ ...c })) })))
      ),
    []
  )

  useEffect(() => {
    load()
    api<NamedOption[]>('/api/brands').then(setBrands).catch(() => {})
    api<NamedOption[]>('/api/size-categories').then(setSizes).catch(() => {})
  }, [load])

  if (!list) return <Loading />

  const upd = (pi: number, patch: Partial<VendorParentRow>) =>
    setList(l => l!.map((p, i) => (i === pi ? { ...p, ...patch } : p)))

  const updC = (pi: number, ci: number, patch: Partial<VendorCenterRow>) =>
    setList(l =>
      l!.map((p, i) =>
        i === pi
          ? {
              ...p,
              centers: p.centers.map((c, j) => (j === ci ? { ...c, ...patch } : c)),
            }
          : p
      )
    )

  const handleAddCenter = (pi: number) => {
    const p = list[pi]
    upd(pi, {
      centers: [
        ...p.centers,
        {
          code: `${p.code}-${p.centers.length + 1}`,
          zoneSiteId: sites[0]?.id ?? '',
          address: '',
          phone: '',
          deliveryMethod: 'DSD',
          gpPctOverride: '',
          repairSlaDaysOverride: '',
        },
      ],
    })
  }

  const handleRemoveParent = async (pi: number) => {
    const p = list[pi]
    if (
      await confirm({
        message: `ลบ VD หลัก ${p.code}? (ระบบจะปิดใช้งาน ข้อมูลงานเดิมยังอยู่)`,
        danger: true,
      })
    ) {
      setList(l => l!.filter((_, i) => i !== pi))
    }
  }

  return (
    <div className="pcard">
      <h3>VD หลัก (ระดับบริษัท)</h3>
      <p className="hint">
        ข้อมูลสัญญา/เงื่อนไขทางธุรกิจ ใช้ร่วมกันในทุกศูนย์บริการย่อยของ VD นี้
      </p>
      {list.map((p, pi) => (
        <VendorParentCard
          key={p.id ?? `new-${pi}`}
          parent={p}
          parentIndex={pi}
          brands={brands}
          sizes={sizes}
          sites={sites}
          onUpdate={upd}
          onUpdateCenter={updC}
          onAddCenter={handleAddCenter}
          onRemoveCenter={(parentIdx, centerIdx) =>
            upd(parentIdx, {
              centers: p.centers.filter((_, j) => j !== centerIdx),
            })
          }
          onRemoveParent={handleRemoveParent}
        />
      ))}
      <Row between>
        <button
          className="btn"
          onClick={() =>
            setList(l => [
              ...l!,
              {
                code: '',
                name: '',
                defaultGpPct: 18,
                defaultRepairSlaDays: 7,
                repairWarrantyDays: 30,
                inspectionFeeCovered: 0,
                inspectionFeeNotCovered: 300,
                isBrandAuthorized: false,
                brandIds: [],
                sizeIds: [],
                centers: [],
              },
            ])
          }
        >
          + เพิ่ม VD หลัก
        </button>
        <SaveButton
          label="บันทึก Vendor Portal"
          saving={saving}
          justSaved={justSaved}
          onClick={() =>
            save(async () => {
              await api('/api/admin/vendors', { method: 'PUT', body: list })
              await load()
            })
          }
        />
      </Row>
    </div>
  )
}
