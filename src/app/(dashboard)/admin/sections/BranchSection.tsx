'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useSave, SaveButton, Row, Loading } from './admin-helpers'

interface BranchRow {
  id?: string
  code: string
  name: string
  type: string
  manager?: string
  address?: string
  phone?: string
}

export function BranchSection() {
  const [rows, setRows] = useState<BranchRow[] | null>(null)
  const { saving, save, justSaved } = useSave()

  const load = useCallback(() => api<BranchRow[]>('/api/admin/sites').then(setRows), [])

  useEffect(() => {
    load()
  }, [load])

  if (!rows) return <Loading />

  const upd = (i: number, p: Partial<BranchRow>) =>
    setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))

  return (
    <div className="pcard">
      <h3>รายชื่อสาขา / คลัง DC</h3>
      <p className="hint">
        &quot;District&quot; ในที่นี้คือผู้จัดการเขตที่ดูแลหลายสาขา ไม่ใช่พื้นที่ทางภูมิศาสตร์ — ผูกไว้ที่นี่ แล้วค่อยนำสาขาไปจับคู่กับ VD ในหน้าถัดไป
      </p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อสาขา / คลัง</th>
              <th>ประเภท</th>
              <th>ผู้จัดการเขต (District Manager)</th>
              <th>ที่อยู่ (แสดงบนใบเสนอราคา)</th>
              <th>โทร</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? `n${i}`}>
                <td>
                  <input
                    className="inp inp-sm"
                    style={{ width: 70 }}
                    value={r.code}
                    onChange={e => upd(i, { code: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    value={r.name}
                    onChange={e => upd(i, { name: e.target.value })}
                  />
                </td>
                <td>
                  <select
                    className="sel"
                    value={r.type}
                    onChange={e => upd(i, { type: e.target.value })}
                  >
                    <option value="BRANCH">สาขา</option>
                    <option value="DC">DC</option>
                  </select>
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    value={r.manager ?? ''}
                    disabled={r.type === 'DC'}
                    onChange={e => upd(i, { manager: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    value={r.address ?? ''}
                    onChange={e => upd(i, { address: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    style={{ width: 110 }}
                    value={r.phone ?? ''}
                    onChange={e => upd(i, { phone: e.target.value })}
                  />
                </td>
                <td>
                  <button
                    className="remove-btn"
                    onClick={() => setRows(x => x!.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Row between>
        <button
          className="btn"
          onClick={() =>
            setRows(r => [
              ...r!,
              { code: '', name: '', type: 'BRANCH', manager: '', address: '', phone: '' },
            ])
          }
        >
          + เพิ่มสาขา/คลัง
        </button>
        <SaveButton
          label="บันทึกรายชื่อสาขา"
          saving={saving}
          justSaved={justSaved}
          onClick={() =>
            save(async () => {
              await api('/api/admin/sites', { method: 'PUT', body: rows })
              await load()
            })
          }
        />
      </Row>
    </div>
  )
}
