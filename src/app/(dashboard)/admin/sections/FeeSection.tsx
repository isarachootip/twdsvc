'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useSave, SaveButton, Row, Loading } from './admin-helpers'

interface FeeRow {
  sizeCategoryId: number | null
  name: string
  operationFee: number
  shippingFee3pl: number
}

interface FeeApiItem {
  sizeCategory: { id: number; name: string }
  rate?: { operationFee: number; shippingFee3pl: number }
}

export function FeeSection() {
  const [rows, setRows] = useState<FeeRow[] | null>(null)
  const { saving, save, justSaved } = useSave()

  const load = useCallback(
    () =>
      api<FeeApiItem[]>('/api/admin/fees').then(d =>
        setRows(
          d.map(x => ({
            sizeCategoryId: x.sizeCategory.id,
            name: x.sizeCategory.name,
            operationFee: x.rate?.operationFee ?? 0,
            shippingFee3pl: x.rate?.shippingFee3pl ?? 0,
          }))
        )
      ),
    []
  )

  useEffect(() => {
    load()
  }, [load])

  if (!rows) return <Loading />

  const upd = (i: number, p: Partial<FeeRow>) =>
    setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))

  const doSave = () =>
    save(async () => {
      await api('/api/admin/fees', {
        method: 'PUT',
        body: rows.map(r => ({
          ...r,
          operationFee: Number(r.operationFee),
          shippingFee3pl: Number(r.shippingFee3pl),
        })),
      })
      await load()
    })

  const addType = () =>
    setRows(r => [...r!, { sizeCategoryId: null, name: '', operationFee: 0, shippingFee3pl: 0 }])

  return (
    <>
      <div className="pcard">
        <h3>ค่าดำเนินการ (แสดงเป็น &quot;ค่าดำเนินการ&quot; แทนคำว่ามัดจำ)</h3>
        <p className="hint">
          แยกตามประเภทสินค้า กดเพิ่มประเภทได้ — ค่าที่บันทึกใหม่มีผลกับงานที่เปิดหลังจากนี้
        </p>
        <table className="tbl compact">
          <thead>
            <tr>
              <th>ประเภทสินค้า</th>
              <th>ค่าดำเนินการ (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="inp inp-sm"
                    value={r.name}
                    placeholder="ชื่อประเภทสินค้าใหม่"
                    onChange={e => upd(i, { name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    type="number"
                    min={0}
                    value={r.operationFee}
                    onChange={e => upd(i, { operationFee: Number(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Row between>
          <button className="btn" onClick={addType}>+ เพิ่มประเภท</button>
          <SaveButton label="บันทึกค่าดำเนินการ" saving={saving} justSaved={justSaved} onClick={doSave} />
        </Row>
      </div>
      <div className="pcard">
        <h3>ค่าขนส่ง 3PL</h3>
        <p className="hint">แยกตามประเภทสินค้า ลูกค้าเป็นผู้รับผิดชอบค่าขนส่งนี้เมื่อเลือกส่งด่วน</p>
        <table className="tbl compact">
          <thead>
            <tr>
              <th>ประเภทสินค้า</th>
              <th>ค่าขนส่ง (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.name || <span className="sub-mute">(ประเภทใหม่)</span>}</td>
                <td>
                  <input
                    className="inp inp-sm"
                    type="number"
                    min={0}
                    value={r.shippingFee3pl}
                    onChange={e => upd(i, { shippingFee3pl: Number(e.target.value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Row between>
          <button className="btn" onClick={addType}>+ เพิ่มประเภท</button>
          <SaveButton label="บันทึกค่าขนส่ง" saving={saving} justSaved={justSaved} onClick={doSave} />
        </Row>
      </div>
    </>
  )
}
