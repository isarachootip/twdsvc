'use client'

import { type SiteLite } from './admin-helpers'
import { VendorCenterTable, type VendorCenterRow } from './VendorCenterTable'

export interface VendorParentRow {
  id?: string
  code: string
  name: string
  defaultGpPct: number | string
  defaultRepairSlaDays: number | string
  inspectionFeeCovered: number | string
  inspectionFeeNotCovered: number | string
  repairWarrantyDays: number | string
  isBrandAuthorized: boolean
  brandIds: number[]
  sizeIds: number[]
  centers: VendorCenterRow[]
}

export interface NamedOption {
  id: number
  name: string
}

interface VendorParentCardProps {
  parent: VendorParentRow
  parentIndex: number
  brands: NamedOption[]
  sizes: NamedOption[]
  sites: SiteLite[]
  onUpdate: (pi: number, patch: Partial<VendorParentRow>) => void
  onUpdateCenter: (pi: number, ci: number, patch: Partial<VendorCenterRow>) => void
  onAddCenter: (pi: number) => void
  onRemoveCenter: (pi: number, ci: number) => void
  onRemoveParent: (pi: number) => void
}

export function VendorParentCard({
  parent: p,
  parentIndex: pi,
  brands,
  sizes,
  sites,
  onUpdate: upd,
  onUpdateCenter: updC,
  onAddCenter,
  onRemoveCenter,
  onRemoveParent,
}: VendorParentCardProps) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 14, background: 'var(--bg)' }}>
      <div className="grid3">
        <div className="field">
          <label>รหัส VD หลัก</label>
          <input className="inp" value={p.code} onChange={e => upd(pi, { code: e.target.value })} />
        </div>
        <div className="field">
          <label>ชื่อบริษัท</label>
          <input className="inp" value={p.name} onChange={e => upd(pi, { name: e.target.value })} />
        </div>
        <div className="field">
          <label>GP% เริ่มต้น</label>
          <input className="inp" type="number" value={p.defaultGpPct} onChange={e => upd(pi, { defaultGpPct: e.target.value })} />
        </div>
      </div>
      <div className="grid4" style={{ marginTop: 10 }}>
        <div className="field">
          <label>SLA ซ่อมเริ่มต้น (วัน)</label>
          <input className="inp" type="number" value={p.defaultRepairSlaDays} onChange={e => upd(pi, { defaultRepairSlaDays: e.target.value })} />
        </div>
        <div className="field">
          <label>ค่าเปิดเครื่อง (มีประกัน)</label>
          <input className="inp" type="number" value={p.inspectionFeeCovered} onChange={e => upd(pi, { inspectionFeeCovered: e.target.value })} />
        </div>
        <div className="field">
          <label>ค่าเปิดเครื่อง (ไม่มีประกัน)</label>
          <input className="inp" type="number" value={p.inspectionFeeNotCovered} onChange={e => upd(pi, { inspectionFeeNotCovered: e.target.value })} />
        </div>
        <div className="field">
          <label>รับประกันงานซ่อม (วัน)</label>
          <input className="inp" type="number" value={p.repairWarrantyDays} onChange={e => upd(pi, { repairWarrantyDays: e.target.value })} />
        </div>
      </div>
      <div className="checkbox-row">
        <input type="checkbox" id={`auth-${pi}`} checked={!!p.isBrandAuthorized} onChange={e => upd(pi, { isBrandAuthorized: e.target.checked })} />
        <label htmlFor={`auth-${pi}`}>เป็นศูนย์แบรนด์ (Authorized Service Center)</label>
      </div>
      <div className="grid2" style={{ marginTop: 10 }}>
        <div className="field">
          <label>แบรนด์ที่รับผิดชอบ (เลือกได้หลายรายการ)</label>
          <div>
            {p.brandIds && p.brandIds.map(b => (
              <span className="tag" key={b}>
                {brands.find(x => x.id === b)?.name ?? b}
                <button onClick={() => upd(pi, { brandIds: p.brandIds.filter(x => x !== b) })}>✕</button>
              </span>
            ))}
          </div>
          <select
            className="sel"
            value=""
            onChange={e => e.target.value && upd(pi, { brandIds: [...new Set([...(p.brandIds ?? []), Number(e.target.value)])] })}
          >
            <option value="">+ เพิ่มแบรนด์</option>
            {brands.filter(b => !(p.brandIds ?? []).includes(b.id)).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>ขนาดสินค้าที่รับผิดชอบ (ว่าง = ทุกขนาด)</label>
          <div>
            {p.sizeIds && p.sizeIds.map(s => (
              <span className="tag" key={s}>
                {sizes.find(x => x.id === s)?.name ?? s}
                <button onClick={() => upd(pi, { sizeIds: p.sizeIds.filter(x => x !== s) })}>✕</button>
              </span>
            ))}
          </div>
          <select
            className="sel"
            value=""
            onChange={e => e.target.value && upd(pi, { sizeIds: [...new Set([...(p.sizeIds ?? []), Number(e.target.value)])] })}
          >
            <option value="">+ เพิ่มขนาด</option>
            {sizes.filter(s => !(p.sizeIds ?? []).includes(s.id)).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="divider" />
      <VendorCenterTable
        parentIndex={pi}
        parentCode={p.code}
        parentName={p.name}
        defaultGpPct={p.defaultGpPct}
        defaultRepairSlaDays={p.defaultRepairSlaDays}
        centers={p.centers}
        sites={sites}
        onUpdateCenter={updC}
        onAddCenter={onAddCenter}
        onRemoveCenter={onRemoveCenter}
        onRemoveParent={onRemoveParent}
      />
    </div>
  )
}
