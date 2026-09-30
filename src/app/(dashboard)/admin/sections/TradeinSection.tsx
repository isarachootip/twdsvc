'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useSave, SaveButton, Row, Loading } from './admin-helpers'

interface PromotionRow {
  id?: string
  name: string
  tradeInType: string
  sizeCategoryId: number | string
  subDept?: string
  discountPct: number | string
  startDate: string
  endDate: string
  status: string
}

interface SizeCategoryLite {
  id: number
  name: string
}

export function TradeinSection() {
  const [rows, setRows] = useState<PromotionRow[] | null>(null)
  const [sizes, setSizes] = useState<SizeCategoryLite[]>([])
  const { saving, save, justSaved } = useSave()

  const load = useCallback(
    () =>
      api<PromotionRow[]>('/api/admin/promotions').then(r =>
        setRows(
          r.map(p => ({
            ...p,
            startDate: new Date(new Date(p.startDate).getTime() + 7 * 3600000).toISOString().slice(0, 10),
            endDate: new Date(new Date(p.endDate).getTime() + 7 * 3600000).toISOString().slice(0, 10),
          }))
        )
      ),
    []
  )

  useEffect(() => {
    load()
    api<SizeCategoryLite[]>('/api/size-categories').then(setSizes).catch(() => {})
  }, [load])

  if (!rows) return <Loading />

  const upd = (i: number, p: Partial<PromotionRow>) =>
    setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))

  const overlaps = (i: number) =>
    rows.some(
      (o, j) =>
        j !== i &&
        o.status === 'ACTIVE' &&
        rows[i].status === 'ACTIVE' &&
        o.tradeInType === rows[i].tradeInType &&
        String(o.sizeCategoryId) === String(rows[i].sizeCategoryId) &&
        o.startDate <= rows[i].endDate &&
        rows[i].startDate <= o.endDate
    )

  return (
    <div className="pcard">
      <h3>โปรโมชั่น Trade-in / คูปอง</h3>
      <p className="hint">
        แยกตามประเภท Trade-in, ประเภทสินค้า และ sub_dept พร้อมช่วงวันที่โปรโมชั่นแบบปฏิทิน
      </p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead>
            <tr>
              <th>ชื่อโปร</th>
              <th>ประเภท Trade-in</th>
              <th>ประเภทสินค้า</th>
              <th>sub_dept</th>
              <th>ส่วนลด %</th>
              <th>เริ่ม</th>
              <th>สิ้นสุด</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? `n${i}`}>
                <td>
                  <input className="inp inp-sm" value={r.name} onChange={e => upd(i, { name: e.target.value })} />
                  {overlaps(i) && <div className="flag">ช่วงเวลาซ้อนกับโปรเงื่อนไขเดียวกัน</div>}
                </td>
                <td>
                  <select className="sel" value={r.tradeInType} onChange={e => upd(i, { tradeInType: e.target.value })}>
                    <option value="TYPE1">1 (หน้างาน)</option>
                    <option value="TYPE2">2 (หลังบ้าน)</option>
                  </select>
                </td>
                <td>
                  <select className="sel" value={r.sizeCategoryId ?? ''} onChange={e => upd(i, { sizeCategoryId: e.target.value })}>
                    {sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td>
                  <input className="inp inp-sm" style={{ width: 80 }} value={r.subDept ?? ''} onChange={e => upd(i, { subDept: e.target.value })} />
                </td>
                <td>
                  <input className="inp inp-sm" style={{ width: 60 }} type="number" value={r.discountPct} onChange={e => upd(i, { discountPct: e.target.value })} />
                </td>
                <td>
                  <input className="inp inp-sm" type="date" value={r.startDate} onChange={e => upd(i, { startDate: e.target.value })} />
                </td>
                <td>
                  <input className="inp inp-sm" type="date" value={r.endDate} onChange={e => upd(i, { endDate: e.target.value })} />
                </td>
                <td>
                  <select className="sel" value={r.status} onChange={e => upd(i, { status: e.target.value })}>
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">ร่าง</option>
                    <option value="CLOSED">ปิด</option>
                  </select>
                </td>
                <td>
                  <button className="remove-btn" onClick={() => setRows(x => x!.filter((_, j) => j !== i))}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note">
        หากมีโปรที่ Active ซ้อนช่วงเวลาและตรงเงื่อนไขเดียวกัน ระบบเลือก % ส่วนลดสูงสุดให้อัตโนมัติ หาก % เท่ากัน ใช้โปรที่สร้างล่าสุด
      </div>
      <Row between>
        <button
          className="btn"
          onClick={() =>
            setRows(r => [
              ...r!,
              {
                name: '',
                tradeInType: 'TYPE1',
                sizeCategoryId: sizes[0]?.id ?? '',
                subDept: '',
                discountPct: 0,
                startDate: new Date().toISOString().slice(0, 10),
                endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
                status: 'DRAFT',
              },
            ])
          }
        >
          + เพิ่มโปรโมชั่น
        </button>
        <SaveButton
          label="บันทึกโปรโมชั่น"
          saving={saving}
          justSaved={justSaved}
          onClick={() =>
            save(async () => {
              await api('/api/admin/promotions', { method: 'PUT', body: rows })
              await load()
            })
          }
        />
      </Row>
    </div>
  )
}
