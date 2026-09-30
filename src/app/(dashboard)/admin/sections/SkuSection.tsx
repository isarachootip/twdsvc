'use client'

import { api } from '@/lib/client'
import { useSave, SaveButton, Row, Loading, useSetting } from './admin-helpers'

interface SkuRow {
  sku: string
  description: string
  chargeType: string
}

export function SkuSection() {
  const { val: rows, setVal: setRows } = useSetting<SkuRow[]>('REPAIR_SKUS')
  const { saving, save, justSaved } = useSave()

  if (!rows) return <Loading />

  const upd = (i: number, p: Partial<SkuRow>) =>
    setRows(rows.map((x, j) => (j === i ? { ...x, ...p } : x)))

  return (
    <div className="pcard">
      <h3>SKU กลางสำหรับค่าซ่อม</h3>
      <p className="hint">
        ใช้ SKU เดียวกันทุก VD เพื่อให้บันทึกบัญชี/ออกใบเสร็จเป็นมาตรฐานเดียวกัน
      </p>
      <table className="tbl compact">
        <thead>
          <tr>
            <th>SKU</th>
            <th>รายละเอียด</th>
            <th>ประเภทรายการเงิน</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <input
                  className="inp inp-sm"
                  value={r.sku}
                  onChange={e => upd(i, { sku: e.target.value })}
                />
              </td>
              <td>
                <input
                  className="inp inp-sm"
                  value={r.description}
                  onChange={e => upd(i, { description: e.target.value })}
                />
              </td>
              <td>
                <select
                  className="sel"
                  value={r.chargeType}
                  onChange={e => upd(i, { chargeType: e.target.value })}
                >
                  {[
                    ['REPAIR', 'ค่าซ่อม'],
                    ['INSPECTION_FEE', 'ค่าเปิดเครื่อง'],
                    ['OPERATION_FEE', 'ค่าดำเนินการ'],
                    ['SHIPPING_FEE', 'ค่าขนส่ง'],
                  ].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  className="remove-btn"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Row between>
        <button
          className="btn"
          onClick={() => setRows([...rows, { sku: '', description: '', chargeType: 'REPAIR' }])}
        >
          + เพิ่ม SKU
        </button>
        <SaveButton
          label="บันทึก SKU"
          saving={saving}
          justSaved={justSaved}
          onClick={() =>
            save(() =>
              api('/api/admin/settings', {
                method: 'PUT',
                body: { REPAIR_SKUS: rows.filter(r => r.sku.trim()) },
              })
            )
          }
        />
      </Row>
    </div>
  )
}
