'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import JobDetailModal from '@/components/jobs/JobDetail'
import StageBadge from '@/components/ui/StageBadge'
import { SlaCell } from '@/components/ui/Queue'
import { useToast } from '@/components/ui/Toast'
import { api, exportXlsx } from '@/lib/client'
import { MENU_DEFS, ROLE_LABELS, CHANNEL_LABELS, fmtDate, fmtPhone } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

// ─── helpers ──────────────────────────────────────────────────────────────────
function useSave() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(0)
  const save = async (fn: () => Promise<unknown>) => {
    setSaving(true)
    try {
      await fn()
      setSavedAt(Date.now())
      toast('บันทึกแล้ว ✓', 'success')
      return true
    } catch (e) {
      toast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', 'error')
      return false
    } finally {
      setSaving(false)
    }
  }
  return { saving, save, justSaved: Date.now() - savedAt < 1500 }
}

function SaveButton({ label, saving, justSaved, onClick }: { label: string; saving: boolean; justSaved: boolean; onClick: () => void }) {
  return <button className="btn btn-primary" disabled={saving} onClick={onClick}>{saving ? 'กำลังบันทึก…' : justSaved ? 'บันทึกแล้ว ✓' : label}</button>
}

function Row({ children, between }: { children: React.ReactNode; between?: boolean }) {
  return <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: between ? 'space-between' : 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
}

function Loading() { return <div className="empty">กำลังโหลด…</div> }

interface SiteLite { id: string; code: string; name: string; type: string }
function useSites() {
  const [sites, setSites] = useState<SiteLite[]>([])
  useEffect(() => { api<SiteLite[]>('/api/sites').then(setSites).catch(() => {}) }, [])
  return sites
}

// ─── 1. Vendor Portal ────────────────────────────────────────────────────────
export function VendorSection() {
  const [list, setList] = useState<any[] | null>(null)
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([])
  const [sizes, setSizes] = useState<Array<{ id: number; name: string }>>([])
  const sites = useSites()
  const { saving, save, justSaved } = useSave()
  const { confirm } = useToast()

  const load = useCallback(() => api<any[]>('/api/admin/vendors').then(v => setList(v.map(p => ({ ...p, centers: p.centers.map((c: any) => ({ ...c })) })))), [])
  useEffect(() => {
    load()
    api<any[]>('/api/brands').then(setBrands).catch(() => {})
    api<any[]>('/api/size-categories').then(setSizes).catch(() => {})
  }, [load])
  if (!list) return <Loading />

  const upd = (pi: number, patch: any) => setList(l => l!.map((p, i) => (i === pi ? { ...p, ...patch } : p)))
  const updC = (pi: number, ci: number, patch: any) => setList(l => l!.map((p, i) => (i === pi ? { ...p, centers: p.centers.map((c: any, j: number) => (j === ci ? { ...c, ...patch } : c)) } : p)))

  return (
    <div className="pcard">
      <h3>VD หลัก (ระดับบริษัท)</h3>
      <p className="hint">ข้อมูลสัญญา/เงื่อนไขทางธุรกิจ ใช้ร่วมกันในทุกศูนย์บริการย่อยของ VD นี้</p>
      {list.map((p, pi) => (
        <div key={p.id ?? `new-${pi}`} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 14, background: 'var(--bg)' }}>
          <div className="grid3">
            <div className="field"><label>รหัส VD หลัก</label><input className="inp" value={p.code} onChange={e => upd(pi, { code: e.target.value })} /></div>
            <div className="field"><label>ชื่อบริษัท</label><input className="inp" value={p.name} onChange={e => upd(pi, { name: e.target.value })} /></div>
            <div className="field"><label>GP% เริ่มต้น</label><input className="inp" type="number" value={p.defaultGpPct} onChange={e => upd(pi, { defaultGpPct: e.target.value })} /></div>
          </div>
          <div className="grid4" style={{ marginTop: 10 }}>
            <div className="field"><label>SLA ซ่อมเริ่มต้น (วัน)</label><input className="inp" type="number" value={p.defaultRepairSlaDays} onChange={e => upd(pi, { defaultRepairSlaDays: e.target.value })} /></div>
            <div className="field"><label>ค่าเปิดเครื่อง (มีประกัน)</label><input className="inp" type="number" value={p.inspectionFeeCovered} onChange={e => upd(pi, { inspectionFeeCovered: e.target.value })} /></div>
            <div className="field"><label>ค่าเปิดเครื่อง (ไม่มีประกัน)</label><input className="inp" type="number" value={p.inspectionFeeNotCovered} onChange={e => upd(pi, { inspectionFeeNotCovered: e.target.value })} /></div>
            <div className="field"><label>รับประกันงานซ่อม (วัน)</label><input className="inp" type="number" value={p.repairWarrantyDays} onChange={e => upd(pi, { repairWarrantyDays: e.target.value })} /></div>
          </div>
          <div className="checkbox-row"><input type="checkbox" id={`auth-${pi}`} checked={!!p.isBrandAuthorized} onChange={e => upd(pi, { isBrandAuthorized: e.target.checked })} /><label htmlFor={`auth-${pi}`}>เป็นศูนย์แบรนด์ (Authorized Service Center)</label></div>
          <div className="grid2" style={{ marginTop: 10 }}>
            <div className="field"><label>แบรนด์ที่รับผิดชอบ (เลือกได้หลายรายการ)</label>
              <div>{p.brandIds && p.brandIds.map((b: number) => <span className="tag" key={b}>{brands.find(x => x.id === b)?.name ?? b}<button onClick={() => upd(pi, { brandIds: p.brandIds.filter((x: number) => x !== b) })}>✕</button></span>)}</div>
              <select className="sel" value="" onChange={e => e.target.value && upd(pi, { brandIds: [...new Set([...(p.brandIds ?? []), Number(e.target.value)])] })}>
                <option value="">+ เพิ่มแบรนด์</option>
                {brands.filter(b => !(p.brandIds ?? []).includes(b.id)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field"><label>ขนาดสินค้าที่รับผิดชอบ (ว่าง = ทุกขนาด)</label>
              <div>{p.sizeIds && p.sizeIds.map((s: number) => <span className="tag" key={s}>{sizes.find(x => x.id === s)?.name ?? s}<button onClick={() => upd(pi, { sizeIds: p.sizeIds.filter((x: number) => x !== s) })}>✕</button></span>)}</div>
              <select className="sel" value="" onChange={e => e.target.value && upd(pi, { sizeIds: [...new Set([...(p.sizeIds ?? []), Number(e.target.value)])] })}>
                <option value="">+ เพิ่มขนาด</option>
                {sizes.filter(s => !(p.sizeIds ?? []).includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="divider" />
          <h4 style={{ fontSize: 13, margin: '0 0 8px' }}>ศูนย์บริการย่อยของ {p.name || '(VD ใหม่)'}</h4>
          <div className="tbl-wrap">
            <table className="tbl compact">
              <thead><tr><th>รหัสศูนย์ย่อย</th><th>โซน (สาขา/คลัง)</th><th>ที่อยู่</th><th>โทร</th><th>วิธีรับ-ส่ง</th><th>GP% override</th><th>SLA override (วัน)</th><th></th></tr></thead>
              <tbody>
                {p.centers.length === 0 && <tr><td colSpan={8} className="empty">ยังไม่มีศูนย์ย่อย</td></tr>}
                {p.centers.map((c: any, ci: number) => (
                  <tr key={c.id ?? `nc-${ci}`}>
                    <td><input className="inp inp-sm" style={{ width: 110 }} value={c.code} onChange={e => updC(pi, ci, { code: e.target.value })} /></td>
                    <td><select className="sel" value={c.zoneSiteId ?? ''} onChange={e => updC(pi, ci, { zoneSiteId: e.target.value })}><option value="">-</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}{s.type === 'DC' ? ' (DC)' : ''}</option>)}</select></td>
                    <td><input className="inp inp-sm" value={c.address ?? ''} onChange={e => updC(pi, ci, { address: e.target.value })} /></td>
                    <td><input className="inp inp-sm" style={{ width: 110 }} value={c.phone ?? ''} onChange={e => updC(pi, ci, { phone: e.target.value })} /></td>
                    <td><select className="sel" value={c.deliveryMethod} onChange={e => updC(pi, ci, { deliveryMethod: e.target.value })}><option value="DSD">DSD</option><option value="DC">DC</option><option value="DC_DSD">DC + DSD</option></select></td>
                    <td><input className="inp inp-sm" style={{ width: 90 }} placeholder={`ค่าเริ่มต้น: ${p.defaultGpPct}%`} value={c.gpPctOverride ?? ''} onChange={e => updC(pi, ci, { gpPctOverride: e.target.value })} /></td>
                    <td><input className="inp inp-sm" style={{ width: 90 }} placeholder={`ค่าเริ่มต้น: ${p.defaultRepairSlaDays} วัน`} value={c.repairSlaDaysOverride ?? ''} onChange={e => updC(pi, ci, { repairSlaDaysOverride: e.target.value })} /></td>
                    <td><button className="remove-btn" onClick={() => upd(pi, { centers: p.centers.filter((_: any, j: number) => j !== ci) })}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Row between>
            <button className="btn" onClick={() => upd(pi, { centers: [...p.centers, { code: `${p.code}-${p.centers.length + 1}`, zoneSiteId: sites[0]?.id ?? '', address: '', phone: '', deliveryMethod: 'DSD', gpPctOverride: '', repairSlaDaysOverride: '' }] })}>+ เพิ่มศูนย์ย่อย</button>
            <button className="remove-btn" style={{ fontSize: 13 }} onClick={async () => { if (await confirm({ message: `ลบ VD หลัก ${p.code}? (ระบบจะปิดใช้งาน ข้อมูลงานเดิมยังอยู่)`, danger: true })) setList(l => l!.filter((_, i) => i !== pi)) }}>ลบ VD หลักนี้ ✕</button>
          </Row>
        </div>
      ))}
      <Row between>
        <button className="btn" onClick={() => setList(l => [...l!, { code: '', name: '', defaultGpPct: 18, defaultRepairSlaDays: 7, repairWarrantyDays: 30, inspectionFeeCovered: 0, inspectionFeeNotCovered: 300, isBrandAuthorized: false, brandIds: [], sizeIds: [], centers: [] }])}>+ เพิ่ม VD หลัก</button>
        <SaveButton label="บันทึก Vendor Portal" saving={saving} justSaved={justSaved} onClick={() => save(async () => { await api('/api/admin/vendors', { method: 'PUT', body: list }); await load() })} />
      </Row>
    </div>
  )
}

// ─── 2. ค่าดำเนินการ / ค่าขนส่ง ─────────────────────────────────────────────────
export function FeeSection() {
  const [rows, setRows] = useState<any[] | null>(null)
  const { saving, save, justSaved } = useSave()
  const load = useCallback(() => api<any[]>('/api/admin/fees').then(d => setRows(d.map(x => ({ sizeCategoryId: x.sizeCategory.id, name: x.sizeCategory.name, operationFee: x.rate?.operationFee ?? 0, shippingFee3pl: x.rate?.shippingFee3pl ?? 0 })))), [])
  useEffect(() => { load() }, [load])
  if (!rows) return <Loading />
  const upd = (i: number, p: any) => setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const doSave = () => save(async () => { await api('/api/admin/fees', { method: 'PUT', body: rows.map(r => ({ ...r, operationFee: Number(r.operationFee), shippingFee3pl: Number(r.shippingFee3pl) })) }); await load() })
  const addType = () => setRows(r => [...r!, { sizeCategoryId: null, name: '', operationFee: 0, shippingFee3pl: 0 }])
  return (
    <>
      <div className="pcard">
        <h3>ค่าดำเนินการ (แสดงเป็น &quot;ค่าดำเนินการ&quot; แทนคำว่ามัดจำ)</h3>
        <p className="hint">แยกตามประเภทสินค้า กดเพิ่มประเภทได้ — ค่าที่บันทึกใหม่มีผลกับงานที่เปิดหลังจากนี้</p>
        <table className="tbl compact"><thead><tr><th>ประเภทสินค้า</th><th>ค่าดำเนินการ (บาท)</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i}><td><input className="inp inp-sm" value={r.name} placeholder="ชื่อประเภทสินค้าใหม่" onChange={e => upd(i, { name: e.target.value })} /></td><td><input className="inp inp-sm" type="number" min={0} value={r.operationFee} onChange={e => upd(i, { operationFee: e.target.value })} /></td></tr>
          ))}</tbody>
        </table>
        <Row between><button className="btn" onClick={addType}>+ เพิ่มประเภท</button><SaveButton label="บันทึกค่าดำเนินการ" saving={saving} justSaved={justSaved} onClick={doSave} /></Row>
      </div>
      <div className="pcard">
        <h3>ค่าขนส่ง 3PL</h3>
        <p className="hint">แยกตามประเภทสินค้า ลูกค้าเป็นผู้รับผิดชอบค่าขนส่งนี้เมื่อเลือกส่งด่วน</p>
        <table className="tbl compact"><thead><tr><th>ประเภทสินค้า</th><th>ค่าขนส่ง (บาท)</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i}><td>{r.name || <span className="sub-mute">(ประเภทใหม่)</span>}</td><td><input className="inp inp-sm" type="number" min={0} value={r.shippingFee3pl} onChange={e => upd(i, { shippingFee3pl: e.target.value })} /></td></tr>
          ))}</tbody>
        </table>
        <Row between><button className="btn" onClick={addType}>+ เพิ่มประเภท</button><SaveButton label="บันทึกค่าขนส่ง" saving={saving} justSaved={justSaved} onClick={doSave} /></Row>
      </div>
    </>
  )
}

// ─── 3. สาขาไทวัสดุ ──────────────────────────────────────────────────────────
export function BranchSection() {
  const [rows, setRows] = useState<any[] | null>(null)
  const { saving, save, justSaved } = useSave()
  const load = useCallback(() => api<any[]>('/api/admin/sites').then(setRows), [])
  useEffect(() => { load() }, [load])
  if (!rows) return <Loading />
  const upd = (i: number, p: any) => setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))
  return (
    <div className="pcard">
      <h3>รายชื่อสาขา / คลัง DC</h3>
      <p className="hint">&quot;District&quot; ในที่นี้คือผู้จัดการเขตที่ดูแลหลายสาขา ไม่ใช่พื้นที่ทางภูมิศาสตร์ — ผูกไว้ที่นี่ แล้วค่อยนำสาขาไปจับคู่กับ VD ในหน้าถัดไป</p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>รหัส</th><th>ชื่อสาขา / คลัง</th><th>ประเภท</th><th>ผู้จัดการเขต (District Manager)</th><th>ที่อยู่ (แสดงบนใบเสนอราคา)</th><th>โทร</th><th></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.id ?? `n${i}`}>
              <td><input className="inp inp-sm" style={{ width: 70 }} value={r.code} onChange={e => upd(i, { code: e.target.value })} /></td>
              <td><input className="inp inp-sm" value={r.name} onChange={e => upd(i, { name: e.target.value })} /></td>
              <td><select className="sel" value={r.type} onChange={e => upd(i, { type: e.target.value })}><option value="BRANCH">สาขา</option><option value="DC">DC</option></select></td>
              <td><input className="inp inp-sm" value={r.manager ?? ''} disabled={r.type === 'DC'} onChange={e => upd(i, { manager: e.target.value })} /></td>
              <td><input className="inp inp-sm" value={r.address ?? ''} onChange={e => upd(i, { address: e.target.value })} /></td>
              <td><input className="inp inp-sm" style={{ width: 110 }} value={r.phone ?? ''} onChange={e => upd(i, { phone: e.target.value })} /></td>
              <td><button className="remove-btn" onClick={() => setRows(x => x!.filter((_, j) => j !== i))}>✕</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Row between>
        <button className="btn" onClick={() => setRows(r => [...r!, { code: '', name: '', type: 'BRANCH', manager: '', address: '', phone: '' }])}>+ เพิ่มสาขา/คลัง</button>
        <SaveButton label="บันทึกรายชื่อสาขา" saving={saving} justSaved={justSaved} onClick={() => save(async () => { await api('/api/admin/sites', { method: 'PUT', body: rows }); await load() })} />
      </Row>
    </div>
  )
}

// ─── 4. จับคู่สาขา - VD ─────────────────────────────────────────────────────
export function ZoneSection() {
  const [rows, setRows] = useState<any[] | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const [centers, setCenters] = useState<any[]>([])
  const { saving, save, justSaved } = useSave()
  const load = useCallback(() => api<any[]>('/api/admin/routes').then(r => setRows(r.map(x => ({ branchId: x.branch.id, dcSiteId: x.dcSite?.id ?? '', primaryCenterId: x.primaryCenter?.id ?? '', backupCenterId: x.backupCenter?.id ?? '', standardChannel: x.standardChannel })))), [])
  useEffect(() => {
    load()
    api<any[]>('/api/admin/sites').then(setSites).catch(() => {})
    api<any[]>('/api/vendor-centers').then(setCenters).catch(() => {})
  }, [load])
  if (!rows) return <Loading />
  const upd = (i: number, p: any) => setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const branches = sites.filter(s => s.type === 'BRANCH')
  const dcs = sites.filter(s => s.type === 'DC')
  return (
    <div className="pcard">
      <h3>จับคู่สาขา — ศูนย์บริการ VD</h3>
      <p className="hint">สาขาดึงมาจากรายชื่อสาขาไทวัสดุ (หน้าก่อนหน้า) ผู้จัดการเขตแสดงอัตโนมัติ — ใช้เลือกศูนย์ซ่อม/ช่องทางอัตโนมัติตอนเปิดงาน และ Book 3PL ให้นำสินค้าไปส่งศูนย์ VD ที่ใกล้ที่สุด (สาขาเดียวกันหลายแถว = ลำดับความสำคัญตามลำดับแถว)</p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>สาขา</th><th>ผู้จัดการเขต</th><th>ศูนย์ VD ใกล้เคียงอันดับ 1</th><th>ศูนย์ VD สำรอง</th><th>คลัง DC</th><th>ช่องทางมาตรฐาน</th><th></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i}>
              <td><select className="sel" value={r.branchId} onChange={e => upd(i, { branchId: e.target.value })}><option value="">เลือกสาขา</option>{branches.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
              <td><input className="inp inp-sm" disabled value={sites.find(s => s.id === r.branchId)?.manager ?? ''} /></td>
              <td><select className="sel" value={r.primaryCenterId} onChange={e => upd(i, { primaryCenterId: e.target.value })}><option value="">เลือก</option>{centers.map(c => <option key={c.id} value={c.id}>{c.code} — {c.vendorParent.name}</option>)}</select></td>
              <td><select className="sel" value={r.backupCenterId} onChange={e => upd(i, { backupCenterId: e.target.value })}><option value="">-</option>{centers.map(c => <option key={c.id} value={c.id}>{c.code} — {c.vendorParent.name}</option>)}</select></td>
              <td><select className="sel" value={r.dcSiteId} onChange={e => upd(i, { dcSiteId: e.target.value })}><option value="">-</option>{dcs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
              <td><select className="sel" value={r.standardChannel} onChange={e => upd(i, { standardChannel: e.target.value })}><option value="DC">DC</option><option value="DSD">DSD</option></select></td>
              <td><button className="remove-btn" onClick={() => setRows(x => x!.filter((_, j) => j !== i))}>✕</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Row between>
        <button className="btn" onClick={() => setRows(r => [...r!, { branchId: '', dcSiteId: dcs[0]?.id ?? '', primaryCenterId: '', backupCenterId: '', standardChannel: 'DC' }])}>+ เพิ่มการจับคู่</button>
        <SaveButton label="บันทึกการจับคู่" saving={saving} justSaved={justSaved} onClick={() => save(async () => { await api('/api/admin/routes', { method: 'PUT', body: rows }); await load() })} />
      </Row>
    </div>
  )
}

// ─── 5. SLA ──────────────────────────────────────────────────────────────────
const EVENTS = ['JOB_OPENED', 'GR_RECEIVED', 'GR_PACKED', 'SHIPMENT_DISPATCHED', 'OUTBOUND_HANDED_OFF', 'DC_RECEIVED_OUTBOUND', 'DC_HANDED_OFF_VD', 'VD_RECEIVED', 'QUOTE_SENT', 'QUOTE_REVISED', 'CUSTOMER_APPROVED', 'CUSTOMER_REJECTED', 'REPAIR_STARTED', 'REPAIR_FINISHED', 'RETURN_PACKED', 'DC_RECEIVED_INBOUND', 'DC_DISPATCHED_TO_BRANCH', 'GR_RETURN_RECEIVED', 'DELIVERED_TO_CS', 'JOB_CLOSED']
function fmtHours(h: number) { return h % 24 === 0 && h >= 24 ? `${h / 24} วัน` : `${h} ชม.` }
function parseHours(s: string): number {
  const n = parseFloat(s)
  if (Number.isNaN(n)) return NaN
  return /วัน|day|d\b/i.test(s) ? Math.round(n * 24) : Math.round(n)
}
export function SlaSection() {
  const [rows, setRows] = useState<any[] | null>(null)
  const { saving, save, justSaved } = useSave()
  const { toast } = useToast()
  const load = useCallback(() => api<any[]>('/api/admin/sla').then(d => setRows(d.map(s => ({ ...s, hoursText: fmtHours(s.hours) })))), [])
  useEffect(() => { load() }, [load])
  if (!rows) return <Loading />
  const upd = (i: number, p: any) => setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))
  return (
    <div className="pcard">
      <h3>SLA แต่ละขั้นตอน (ตามลำดับ flow เต็ม)</h3>
      <p className="hint">กรอกเป็น &quot;24 ชม.&quot; หรือ &quot;2 วัน&quot; — SLA ระยะเวลาซ่อมของ VD ใช้ค่าจาก Vendor Portal (SLA ซ่อมเริ่มต้น/override)</p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>#</th><th>ขั้นตอน</th><th>เริ่มนับเมื่อ</th><th>หยุดเมื่อ</th><th>SLA</th><th>เจ้าของ</th><th>เปิดใช้</th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.id ?? `n${i}`}>
              <td>{r.seq ?? '-'}</td>
              <td><input className="inp inp-sm" style={{ minWidth: 220 }} value={r.name} onChange={e => upd(i, { name: e.target.value })} /></td>
              <td>{r.id ? <span className="sub-mute">{r.startEvent}</span> : <select className="sel" value={r.startEvent} onChange={e => upd(i, { startEvent: e.target.value })}>{EVENTS.map(ev => <option key={ev}>{ev}</option>)}</select>}{r.condition && <div className="sub-mute">เงื่อนไข: {r.condition}</div>}</td>
              <td>{r.id ? <span className="sub-mute">{r.stopEvent}</span> : <select className="sel" value={r.stopEvent} onChange={e => upd(i, { stopEvent: e.target.value })}>{EVENTS.map(ev => <option key={ev}>{ev}</option>)}</select>}</td>
              <td><input className="inp inp-sm" style={{ width: 90 }} placeholder="เช่น 24 ชม. / 2 วัน" value={r.hoursText} onChange={e => upd(i, { hoursText: e.target.value })} /></td>
              <td>{r.id ? r.ownerDept : <select className="sel" value={r.ownerDept} onChange={e => upd(i, { ownerDept: e.target.value })}>{['CS', 'GR', 'DC', 'VD', 'CARRIER', 'CUSTOMER'].map(o => <option key={o}>{o}</option>)}</select>}</td>
              <td><button className={`toggle ${r.active ? 'on' : ''}`} onClick={() => upd(i, { active: !r.active })} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Row between>
        <button className="btn" onClick={() => setRows(r => [...r!, { name: '', startEvent: 'JOB_OPENED', stopEvent: 'GR_RECEIVED', ownerDept: 'CS', hoursText: '24 ชม.', active: true }])}>+ เพิ่มขั้นตอน</button>
        <SaveButton label="บันทึก SLA" saving={saving} justSaved={justSaved} onClick={() => {
          const bad = rows.find(r => !(parseHours(r.hoursText) > 0))
          if (bad) { toast(`SLA ของ "${bad.name || 'ขั้นตอนใหม่'}" ไม่ถูกต้อง`, 'error'); return }
          save(async () => { await api('/api/admin/sla', { method: 'PUT', body: rows.map(r => ({ ...r, hours: parseHours(r.hoursText) })) }); await load() })
        }} />
      </Row>
    </div>
  )
}

// ─── 6. สิทธิ์ผู้ใช้งาน ─────────────────────────────────────────────────────────
const ROLES = ['ADMIN', 'EXECUTIVE', 'CS', 'GR', 'DC', 'VD', 'S2']
export function RoleSection() {
  const [tab, setTab] = useState<'matrix' | 'users'>('matrix')
  return (
    <>
      <div className="tabs">
        <button className={`tab-btn ${tab === 'matrix' ? 'active' : ''}`} onClick={() => setTab('matrix')}>สิทธิ์การเข้าถึงเมนู</button>
        <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>จัดการผู้ใช้</button>
      </div>
      {tab === 'matrix' ? <MenuMatrix /> : <UsersAdmin />}
    </>
  )
}

function MenuMatrix() {
  const [perms, setPerms] = useState<Record<string, { canAccess: boolean; canWrite: boolean }> | null>(null)
  const { saving, save, justSaved } = useSave()
  const load = useCallback(() => api<any>('/api/admin/rbac').then(d => {
    const m: Record<string, { canAccess: boolean; canWrite: boolean }> = {}
    for (const p of d.perms) m[`${p.menuKey}|${p.role}`] = { canAccess: p.canAccess, canWrite: p.canWrite }
    setPerms(m)
  }), [])
  useEffect(() => { load() }, [load])
  if (!perms) return <Loading />
  const get = (k: string, r: string) => perms[`${k}|${r}`] ?? { canAccess: false, canWrite: false }
  const set = (k: string, r: string, p: Partial<{ canAccess: boolean; canWrite: boolean }>) => setPerms(x => ({ ...x!, [`${k}|${r}`]: { ...get(k, r), ...p } }))
  return (
    <div className="pcard">
      <h3>สิทธิ์การเข้าถึงเมนู</h3>
      <p className="hint">เปิด/ปิดเมนูของแต่ละ Role (สิทธิ์ทำรายการในแต่ละคิวผูกกับ Role ตามเอกสาร 08 — Admin เข้าเมนูตั้งค่าได้เสมอ)</p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>เมนู</th>{ROLES.map(r => <th key={r} style={{ textAlign: 'center' }}>{ROLE_LABELS[r]}</th>)}</tr></thead>
          <tbody>{MENU_DEFS.map(m => (
            <tr key={m.key}>
              <td>{m.label}</td>
              {ROLES.map(r => (
                <td key={r} style={{ textAlign: 'center' }}>
                  <button className={`toggle ${get(m.key, r).canAccess ? 'on' : ''}`} disabled={m.key === 'admin' && r === 'ADMIN'} onClick={() => set(m.key, r, { canAccess: !get(m.key, r).canAccess, canWrite: !get(m.key, r).canAccess && r !== 'EXECUTIVE' })} />
                </td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Row><SaveButton label="บันทึกสิทธิ์" saving={saving} justSaved={justSaved} onClick={() => save(async () => {
        const body = MENU_DEFS.flatMap(m => ROLES.map(r => ({ menuKey: m.key, role: r, ...get(m.key, r), ...(m.key === 'admin' && r === 'ADMIN' ? { canAccess: true, canWrite: true } : {}) })))
        await api('/api/admin/rbac', { method: 'PUT', body })
        await load()
      })} /></Row>
    </div>
  )
}

function UsersAdmin() {
  const [users, setUsers] = useState<any[] | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const [centers, setCenters] = useState<any[]>([])
  const [edit, setEdit] = useState<any | null>(null)
  const { saving, save } = useSave()
  const load = useCallback(() => api<any[]>('/api/admin/users').then(setUsers), [])
  useEffect(() => {
    load()
    api<any[]>('/api/sites').then(setSites).catch(() => {})
    api<any[]>('/api/vendor-centers').then(setCenters).catch(() => {})
  }, [load])
  if (!users) return <Loading />
  return (
    <div className="pcard">
      <Row between><h3 style={{ margin: 0 }}>ผู้ใช้งานทั้งหมด ({users.length})</h3><button className="btn btn-primary" onClick={() => setEdit({ isNew: true, username: '', fullName: '', email: '', role: 'CS', siteId: '', vendorCenterId: '', password: '', active: true })}>+ เพิ่มผู้ใช้</button></Row>
      <div className="tbl-wrap" style={{ marginTop: 12 }}>
        <table className="tbl compact">
          <thead><tr><th>Username</th><th>ชื่อ</th><th>Role</th><th>สาขา / ศูนย์ซ่อม</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id}>
              <td><b>{u.username}</b></td><td>{u.fullName}</td><td><span className="badge b-blue">{ROLE_LABELS[u.role] ?? u.role}</span></td>
              <td>{u.site?.name ?? u.vendorCenter?.code ?? '-'}</td>
              <td>{!u.active ? <span className="badge b-gray">ปิดใช้งาน</span> : u.lockedUntil && new Date(u.lockedUntil) > new Date() ? <span className="badge b-red">ถูกล็อก</span> : <span className="badge b-green">ใช้งาน</span>}</td>
              <td><button className="link-btn" onClick={() => setEdit({ ...u, password: '', siteId: u.siteId ?? '', vendorCenterId: u.vendorCenterId ?? '' })}>แก้ไข</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)}>
        {edit && (
          <>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>{edit.isNew ? 'เพิ่มผู้ใช้' : `แก้ไขผู้ใช้ ${edit.username}`}</h3>
            <div className="grid2">
              <div className="field"><label>Username</label><input className="inp" disabled={!edit.isNew} value={edit.username} onChange={e => setEdit({ ...edit, username: e.target.value })} /></div>
              <div className="field"><label>ชื่อ-นามสกุล</label><input className="inp" value={edit.fullName} onChange={e => setEdit({ ...edit, fullName: e.target.value })} /></div>
              <div className="field"><label>Role</label><select className="sel" value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })}>{ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></div>
              {['CS', 'GR', 'S2', 'DC'].includes(edit.role) && <div className="field"><label>สาขา / คลัง</label><select className="sel" value={edit.siteId} onChange={e => setEdit({ ...edit, siteId: e.target.value })}><option value="">เลือก</option>{sites.filter(s => (edit.role === 'DC' ? s.type === 'DC' : s.type === 'BRANCH')).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
              {edit.role === 'VD' && <div className="field"><label>ศูนย์ซ่อม</label><select className="sel" value={edit.vendorCenterId} onChange={e => setEdit({ ...edit, vendorCenterId: e.target.value })}><option value="">เลือก</option>{centers.map(c => <option key={c.id} value={c.id}>{c.code} — {c.vendorParent.name}</option>)}</select></div>}
              <div className="field"><label>Email</label><input className="inp" value={edit.email ?? ''} onChange={e => setEdit({ ...edit, email: e.target.value })} /></div>
              <div className="field"><label>{edit.isNew ? 'รหัสผ่าน (≥10 ตัวอักษร)' : 'ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)'}</label><input className="inp" type="password" value={edit.password} onChange={e => setEdit({ ...edit, password: e.target.value })} /></div>
            </div>
            <div className="checkbox-row"><input type="checkbox" id="u-active" checked={edit.active} onChange={e => setEdit({ ...edit, active: e.target.checked })} /><label htmlFor="u-active">เปิดใช้งาน</label></div>
            {!edit.isNew && edit.lockedUntil && new Date(edit.lockedUntil) > new Date() && <div className="checkbox-row"><input type="checkbox" id="u-unlock" checked={!!edit.unlock} onChange={e => setEdit({ ...edit, unlock: e.target.checked })} /><label htmlFor="u-unlock">ปลดล็อกบัญชี</label></div>}
            <div className="modal-actions">
              <button className="btn" onClick={() => setEdit(null)}>ยกเลิก</button>
              <button className="btn btn-primary" disabled={saving} onClick={async () => { if (await save(() => api('/api/admin/users', { method: edit.isNew ? 'POST' : 'PUT', body: edit }))) { setEdit(null); load() } }}>บันทึก</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

// ─── 7. SKU ค่าซ่อม ──────────────────────────────────────────────────────────
function useSetting<T>(key: string) {
  const [val, setVal] = useState<T | null>(null)
  const load = useCallback(() => api<Record<string, string>>('/api/admin/settings').then(s => { try { setVal(JSON.parse(s[key])) } catch { setVal(s[key] as unknown as T) } }), [key])
  useEffect(() => { load() }, [load])
  return { val, setVal, load }
}
export function SkuSection() {
  const { val: rows, setVal: setRows } = useSetting<any[]>('REPAIR_SKUS')
  const { saving, save, justSaved } = useSave()
  if (!rows) return <Loading />
  const upd = (i: number, p: any) => setRows(rows.map((x, j) => (j === i ? { ...x, ...p } : x)))
  return (
    <div className="pcard">
      <h3>SKU กลางสำหรับค่าซ่อม</h3>
      <p className="hint">ใช้ SKU เดียวกันทุก VD เพื่อให้บันทึกบัญชี/ออกใบเสร็จเป็นมาตรฐานเดียวกัน</p>
      <table className="tbl compact">
        <thead><tr><th>SKU</th><th>รายละเอียด</th><th>ประเภทรายการเงิน</th><th></th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>
            <td><input className="inp inp-sm" value={r.sku} onChange={e => upd(i, { sku: e.target.value })} /></td>
            <td><input className="inp inp-sm" value={r.description} onChange={e => upd(i, { description: e.target.value })} /></td>
            <td><select className="sel" value={r.chargeType} onChange={e => upd(i, { chargeType: e.target.value })}>{[['REPAIR', 'ค่าซ่อม'], ['INSPECTION_FEE', 'ค่าเปิดเครื่อง'], ['OPERATION_FEE', 'ค่าดำเนินการ'], ['SHIPPING_FEE', 'ค่าขนส่ง']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
            <td><button className="remove-btn" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button></td>
          </tr>
        ))}</tbody>
      </table>
      <Row between>
        <button className="btn" onClick={() => setRows([...rows, { sku: '', description: '', chargeType: 'REPAIR' }])}>+ เพิ่ม SKU</button>
        <SaveButton label="บันทึก SKU" saving={saving} justSaved={justSaved} onClick={() => save(() => api('/api/admin/settings', { method: 'PUT', body: { REPAIR_SKUS: rows.filter(r => r.sku.trim()) } }))} />
      </Row>
    </div>
  )
}

// ─── 8. รอบจ่ายเงิน Vendor ──────────────────────────────────────────────────
export function PayoutSection() {
  const [cfg, setCfg] = useState<any | null>(null)
  const { saving, save, justSaved } = useSave()
  useEffect(() => { api<any>('/api/admin/payout-config').then(setCfg) }, [])
  if (!cfg) return <Loading />
  return (
    <div className="pcard">
      <h3>รอบจ่ายเงิน Vendor</h3>
      <div className="grid3" style={{ marginTop: 10 }}>
        <div className="field"><label>รูปแบบรอบจ่าย</label>
          <select className="sel" value={cfg.cycleType} onChange={e => setCfg({ ...cfg, cycleType: e.target.value })}>
            <option value="BIMONTHLY">ทุกวันที่กำหนดของเดือน (2 รอบ)</option>
            <option value="MONTHLY">ทุกวันที่กำหนดของเดือน (1 รอบ)</option>
            <option value="EVERY_15_DAYS">ทุก 15 วัน (1 และ 16)</option>
            <option value="WEEKLY">ทุกสัปดาห์ (วันศุกร์)</option>
          </select>
        </div>
        <div className="field"><label>วันที่ในเดือน (รอบที่ 1)</label><input className="inp" type="number" min={1} max={28} value={cfg.dayOfMonth1} onChange={e => setCfg({ ...cfg, dayOfMonth1: e.target.value })} /></div>
        <div className="field"><label>วันที่ในเดือน (รอบที่ 2)</label><input className="inp" type="number" min={1} max={28} value={cfg.dayOfMonth2} disabled={cfg.cycleType !== 'BIMONTHLY'} onChange={e => setCfg({ ...cfg, dayOfMonth2: e.target.value })} /></div>
      </div>
      <div className="note">ยอดจ่ายคำนวณจากรายงานงานที่ VD ปิดงานสำเร็จ (ยอดใบเสนอราคาที่อนุมัติ ก่อน VAT) หัก GP% ตามที่ตั้งไว้ในหน้า Vendor Portal และหักเพิ่มกรณี VD ทำผิดพลาด (บันทึกที่หน้ารายงานจ่ายเงิน VD › + รายการหักเงิน VD)</div>
      <Row><SaveButton label="บันทึกรอบจ่าย" saving={saving} justSaved={justSaved} onClick={() => save(() => api('/api/admin/payout-config', { method: 'PUT', body: cfg }))} /></Row>
    </div>
  )
}

// ─── 9. Trade-in / คูปอง ─────────────────────────────────────────────────────
export function TradeinSection() {
  const [rows, setRows] = useState<any[] | null>(null)
  const [sizes, setSizes] = useState<any[]>([])
  const { saving, save, justSaved } = useSave()
  const load = useCallback(() => api<any[]>('/api/admin/promotions').then(r => setRows(r.map(p => ({ ...p, startDate: new Date(new Date(p.startDate).getTime() + 7 * 3600000).toISOString().slice(0, 10), endDate: new Date(new Date(p.endDate).getTime() + 7 * 3600000).toISOString().slice(0, 10) })))), [])
  useEffect(() => { load(); api<any[]>('/api/size-categories').then(setSizes).catch(() => {}) }, [load])
  if (!rows) return <Loading />
  const upd = (i: number, p: any) => setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const overlaps = (i: number) => rows.some((o, j) => j !== i && o.status === 'ACTIVE' && rows[i].status === 'ACTIVE' && o.tradeInType === rows[i].tradeInType && String(o.sizeCategoryId) === String(rows[i].sizeCategoryId) && o.startDate <= rows[i].endDate && rows[i].startDate <= o.endDate)
  return (
    <div className="pcard">
      <h3>โปรโมชั่น Trade-in / คูปอง</h3>
      <p className="hint">แยกตามประเภท Trade-in, ประเภทสินค้า และ sub_dept พร้อมช่วงวันที่โปรโมชั่นแบบปฏิทิน</p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>ชื่อโปร</th><th>ประเภท Trade-in</th><th>ประเภทสินค้า</th><th>sub_dept</th><th>ส่วนลด %</th><th>เริ่ม</th><th>สิ้นสุด</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.id ?? `n${i}`}>
              <td><input className="inp inp-sm" value={r.name} onChange={e => upd(i, { name: e.target.value })} />{overlaps(i) && <div className="flag">ช่วงเวลาซ้อนกับโปรเงื่อนไขเดียวกัน</div>}</td>
              <td><select className="sel" value={r.tradeInType} onChange={e => upd(i, { tradeInType: e.target.value })}><option value="TYPE1">1 (หน้างาน)</option><option value="TYPE2">2 (หลังบ้าน)</option></select></td>
              <td><select className="sel" value={r.sizeCategoryId ?? ''} onChange={e => upd(i, { sizeCategoryId: e.target.value })}>{sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
              <td><input className="inp inp-sm" style={{ width: 80 }} value={r.subDept ?? ''} onChange={e => upd(i, { subDept: e.target.value })} /></td>
              <td><input className="inp inp-sm" style={{ width: 60 }} type="number" value={r.discountPct} onChange={e => upd(i, { discountPct: e.target.value })} /></td>
              <td><input className="inp inp-sm" type="date" value={r.startDate} onChange={e => upd(i, { startDate: e.target.value })} /></td>
              <td><input className="inp inp-sm" type="date" value={r.endDate} onChange={e => upd(i, { endDate: e.target.value })} /></td>
              <td><select className="sel" value={r.status} onChange={e => upd(i, { status: e.target.value })}><option value="ACTIVE">Active</option><option value="DRAFT">ร่าง</option><option value="CLOSED">ปิด</option></select></td>
              <td><button className="remove-btn" onClick={() => setRows(x => x!.filter((_, j) => j !== i))}>✕</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="note">หากมีโปรที่ Active ซ้อนช่วงเวลาและตรงเงื่อนไขเดียวกัน ระบบเลือก % ส่วนลดสูงสุดให้อัตโนมัติ หาก % เท่ากัน ใช้โปรที่สร้างล่าสุด</div>
      <Row between>
        <button className="btn" onClick={() => setRows(r => [...r!, { name: '', tradeInType: 'TYPE1', sizeCategoryId: sizes[0]?.id ?? '', subDept: '', discountPct: 0, startDate: new Date().toISOString().slice(0, 10), endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10), status: 'DRAFT' }])}>+ เพิ่มโปรโมชั่น</button>
        <SaveButton label="บันทึกโปรโมชั่น" saving={saving} justSaved={justSaved} onClick={() => save(async () => { await api('/api/admin/promotions', { method: 'PUT', body: rows }); await load() })} />
      </Row>
    </div>
  )
}

// ─── 10. Dashboard ───────────────────────────────────────────────────────────
const EXTRA_REPORTS = ['ปริมาณงานตามสาขา', 'สัดส่วนลูกค้าอนุมัติ/ไม่ซ่อม', 'Vendor Scorecard สรุป', 'DC Scorecard สรุป', 'ยอดขาย Trade-in / คูปอง', 'งานตามช่องทางจัดส่ง (DSD/DC/3PL)', 'กำไรขาดทุนต่องาน']
export function DashboardSection() {
  const { val: widgets, setVal: setWidgets } = useSetting<Array<{ key: string; label: string; enabled: boolean }>>('DASHBOARD_WIDGETS')
  const { val: costRoles, setVal: setCostRoles } = useSetting<string[]>('COST_VIEW_ROLES')
  const { saving, save, justSaved } = useSave()
  const [range, setRange] = useState({ from: '', to: '' })
  const { toast } = useToast()
  if (!widgets || !costRoles) return <Loading />
  const doExport = async () => {
    try {
      const qs = new URLSearchParams({ limit: '1000' })
      if (range.from) qs.set('from', range.from)
      if (range.to) qs.set('to', range.to)
      const r = await api<{ jobs: JobView[] }>(`/api/jobs?${qs}`)
      await exportXlsx([{ name: 'งานซ่อม', rows: r.jobs.map(j => ({ 'เลขที่ใบแจ้งซ่อม': j.jobNo, 'วันที่เปิด': fmtDate(j.openedAt), 'สาขา': j.branch.name, 'ลูกค้า': j.customerName ?? '', 'สินค้า': j.productName, 'ช่องทาง': j.channel ? CHANNEL_LABELS[j.channel] : '', 'สถานะ': j.stageLabel, 'ศูนย์ซ่อม': j.vendor ? `${j.vendor.code} ${j.vendor.name}` : '', 'ยอดค้าง': j.money?.balance ?? '', 'เกิน SLA': j.overdue ? 'ใช่' : 'ไม่' })) }], `dashboard_export_${range.from || 'all'}_${range.to || 'all'}.xlsx`)
    } catch (e) { toast(e instanceof Error ? e.message : 'ส่งออกไม่สำเร็จ', 'error') }
  }
  return (
    <>
      <div className="pcard">
        <h3>รายการสรุปที่แสดงบน Dashboard</h3>
        <p className="hint">เลือกเปิด/ปิดรายการย่อยแต่ละตัว เพื่อ custom หน้า Dashboard</p>
        <table className="tbl compact"><thead><tr><th>รายการ</th><th>แสดงผล</th><th></th></tr></thead>
          <tbody>
            {widgets.map((w, i) => (
              <tr key={w.key}>
                <td>{w.label}</td>
                <td>
                  <button
                    className={`toggle ${w.enabled ? 'on' : ''}`}
                    onClick={() => setWidgets(widgets.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x)))}
                  />
                </td>
                <td>
                  {w.key.startsWith('custom_') && (
                    <button className="remove-btn" onClick={() => setWidgets(widgets.filter((_, j) => j !== i))}>
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="field" style={{ marginTop: 14 }}><label>เพิ่มรายงานอื่นๆ เข้า Dashboard</label>
          <select className="sel" value="" onChange={e => e.target.value && setWidgets([...widgets, { key: `custom_${Date.now()}`, label: e.target.value, enabled: true }])}>
            <option value="">— เลือกรายงานที่ต้องการเพิ่ม —</option>
            {EXTRA_REPORTS.filter(r => !widgets.some(w => w.label === r)).map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <Row><SaveButton label="บันทึกการแสดงผล" saving={saving} justSaved={justSaved} onClick={() => save(() => api('/api/admin/settings', { method: 'PUT', body: { DASHBOARD_WIDGETS: widgets } }))} /></Row>
      </div>
      <div className="pcard">
        <h3>สิทธิ์เห็นข้อมูลต้นทุน/กำไรขาดทุน</h3>
        <p className="hint">ข้อมูลต้นทุนและกำไรเป็นข้อมูลอ่อนไหว เปิดให้เห็นเฉพาะบาง role</p>
        <table className="tbl compact"><thead><tr><th>Role</th><th>เห็นต้นทุน/กำไรขาดทุน</th></tr></thead>
          <tbody>{ROLES.map(r => (
            <tr key={r}><td>{ROLE_LABELS[r]}</td><td><button className={`toggle ${costRoles.includes(r) ? 'on' : ''}`} onClick={() => setCostRoles(costRoles.includes(r) ? costRoles.filter(x => x !== r) : [...costRoles, r])} /></td></tr>
          ))}</tbody>
        </table>
        <Row><SaveButton label="บันทึกสิทธิ์ต้นทุน" saving={saving} justSaved={justSaved} onClick={() => save(() => api('/api/admin/settings', { method: 'PUT', body: { COST_VIEW_ROLES: costRoles } }))} /></Row>
      </div>
      <div className="pcard">
        <h3>Export รายงาน</h3>
        <p className="hint">ส่งออกข้อมูลงานซ่อมเป็นไฟล์ Excel ตามช่วงวันที่ที่เลือก</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: 1 }}><label>ตั้งแต่วันที่</label><input className="inp" type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} /></div>
          <div className="field" style={{ flex: 1 }}><label>ถึงวันที่</label><input className="inp" type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={doExport}>Export เป็น Excel</button>
        </div>
      </div>
    </>
  )
}

// ─── 11. ตั้งค่าทั่วไป ──────────────────────────────────────────────────────────
export function GeneralSection() {
  const [s, setS] = useState<Record<string, string> | null>(null)
  const { saving, save, justSaved } = useSave()
  useEffect(() => { api<Record<string, string>>('/api/admin/settings').then(setS) }, [])
  if (!s) return <Loading />
  const f = (k: string, label: string, hint?: string, type = 'number') => (
    <div className="field"><label>{label}</label><input className="inp" type={type} value={s[k] ?? ''} onChange={e => setS({ ...s, [k]: e.target.value })} />{hint && <span className="sub-mute">{hint}</span>}</div>
  )
  const t = (k: string, label: string, hint: string) => (
    <div className="info-row" style={{ alignItems: 'center', padding: '10px 0' }}>
      <span><b style={{ fontWeight: 500 }}>{label}</b><div className="sub-mute">{hint}</div></span>
      <button className={`toggle ${s[k] !== 'false' ? 'on' : ''}`} onClick={() => setS({ ...s, [k]: s[k] === 'false' ? 'true' : 'false' })} />
    </div>
  )
  return (
    <div className="pcard">
      <h3>ตั้งค่าทั่วไป</h3>
      <div className="grid3" style={{ marginTop: 10 }}>
        {f('VAT_RATE', 'อัตรา VAT', 'เช่น 0.07 = 7%')}
        {f('QUOTE_EXPIRY_DAYS', 'อายุลิงก์ใบเสนอราคา (วัน)')}
        {f('TRADEIN_COUPON_VALID_DAYS', 'อายุคูปอง Trade-in (วัน)')}
        {f('VENDOR_SLA_THRESHOLD', 'เกณฑ์ SLA VD (%)', 'ต่ำกว่านี้ 3 เดือนติด → แจ้งเตือนผู้บริหาร')}
        {f('PUBLIC_BASE_URL', 'URL หลักของระบบ (สำหรับลิงก์ลูกค้า)', 'เช่น https://svc.thaiwatsadu.com', 'text')}
      </div>
      <div className="divider" />
      {t('CHARGE_3PL_RETURN_FEE', 'คิดค่า 3PL ขากลับ', 'เพิ่มค่าขนส่งขากลับอีก 1 รายการสำหรับงานส่งด่วน (C3)')}
      {t('REQUIRE_PHOTOS', 'บังคับถ่ายภาพก่อนยืนยันส่งมอบ', 'GR / DC / VD ต้องแนบภาพตามขั้นตอนที่กำหนด')}
      {t('DEMO_MODE', 'โหมดทดสอบ (DEMO_MODE)', 'แสดงปุ่มจำลอง: ลูกค้ากดอนุมัติใน LON, 3PL แจ้งส่งสำเร็จ, ลูกค้าชำระเงินสำเร็จ — ปิดเมื่อเชื่อม integration จริงแล้ว')}
      <Row><SaveButton label="บันทึกการตั้งค่า" saving={saving} justSaved={justSaved} onClick={() => save(() => api('/api/admin/settings', { method: 'PUT', body: Object.fromEntries(['VAT_RATE', 'QUOTE_EXPIRY_DAYS', 'TRADEIN_COUPON_VALID_DAYS', 'VENDOR_SLA_THRESHOLD', 'PUBLIC_BASE_URL', 'CHARGE_3PL_RETURN_FEE', 'REQUIRE_PHOTOS', 'DEMO_MODE'].map(k => [k, s[k] ?? ''])) }))} /></Row>
    </div>
  )
}

// ─── 12. รอกำหนดศูนย์ซ่อม ──────────────────────────────────────────────────────
export function PendingVendorSection() {
  const [jobs, setJobs] = useState<JobView[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const load = useCallback(() => api<{ tabs: Record<string, JobView[]> }>('/api/queues/ADMIN').then(d => setJobs(d.tabs.pendingVendor ?? [])).catch(() => setJobs([])), [])
  useEffect(() => { load() }, [load])
  if (!jobs) return <Loading />
  return (
    <div className="pcard">
      <h3>งานรอกำหนดศูนย์ซ่อม</h3>
      <p className="hint">งานที่ระบบหาศูนย์ซ่อมที่รองรับแบรนด์/ขนาด/สาขาไม่ได้ — กำหนดศูนย์ซ่อมและช่องทางเพื่อให้งานเข้าคิว GR ต่อ</p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>เลขที่ใบแจ้งซ่อม</th><th>สาขา</th><th>ลูกค้า</th><th>สินค้า / แบรนด์</th><th>วิธีจัดส่ง</th><th>สถานะ</th><th>รอมาแล้ว</th><th></th></tr></thead>
          <tbody>
            {jobs.length === 0 && <tr><td colSpan={8} className="empty">ไม่มีงานรอกำหนดศูนย์ซ่อม</td></tr>}
            {jobs.map(j => (
              <tr key={j.id}>
                <td><b>{j.jobNo}</b><div className="sub-mute">{fmtDate(j.openedAt)}</div></td>
                <td>{j.branch.name}</td><td>{j.customerName}<div className="sub-mute">{fmtPhone(j.customerPhone)}</div></td>
                <td>{j.productName}<div className="sub-mute">{j.brandName}</div></td>
                <td>{j.shippingMethod === 'EXPRESS' ? 'ส่งด่วน (3PL)' : 'มาตรฐาน'}</td>
                <td><StageBadge stage={j.stage} /></td>
                <td><SlaCell job={j} /></td>
                <td><button className="btn btn-primary" onClick={() => setOpenId(j.id)}>กำหนดศูนย์ซ่อม</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <JobDetailModal jobId={openId} role="ADMIN" onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  )
}
