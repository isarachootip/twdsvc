'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useSave, SaveButton, Row, Loading, type SiteLite } from './admin-helpers'

interface ZoneRow {
  branchId: string
  dcSiteId: string
  primaryCenterId: string
  backupCenterId: string
  standardChannel: string
}

interface CenterLite {
  id: string
  code: string
  vendorParent: { name: string }
}

interface RouteApiItem {
  branch: { id: string }
  dcSite?: { id: string }
  primaryCenter?: { id: string }
  backupCenter?: { id: string }
  standardChannel: string
}

export function ZoneSection() {
  const [rows, setRows] = useState<ZoneRow[] | null>(null)
  const [sites, setSites] = useState<SiteLite[]>([])
  const [centers, setCenters] = useState<CenterLite[]>([])
  const { saving, save, justSaved } = useSave()

  const load = useCallback(
    () =>
      api<RouteApiItem[]>('/api/admin/routes').then(r =>
        setRows(
          r.map(x => ({
            branchId: x.branch.id,
            dcSiteId: x.dcSite?.id ?? '',
            primaryCenterId: x.primaryCenter?.id ?? '',
            backupCenterId: x.backupCenter?.id ?? '',
            standardChannel: x.standardChannel,
          }))
        )
      ),
    []
  )

  useEffect(() => {
    load()
    api<SiteLite[]>('/api/admin/sites').then(setSites).catch(() => {})
    api<CenterLite[]>('/api/vendor-centers').then(setCenters).catch(() => {})
  }, [load])

  if (!rows) return <Loading />

  const upd = (i: number, p: Partial<ZoneRow>) =>
    setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))

  const branches = sites.filter(s => s.type === 'BRANCH')
  const dcs = sites.filter(s => s.type === 'DC')

  return (
    <div className="pcard">
      <h3>จับคู่สาขา — ศูนย์บริการ VD</h3>
      <p className="hint">
        สาขาดึงมาจากรายชื่อสาขาไทวัสดุ (หน้าก่อนหน้า) ผู้จัดการเขตแสดงอัตโนมัติ — ใช้เลือกศูนย์ซ่อม/ช่องทางอัตโนมัติตอนเปิดงาน และ Book 3PL ให้นำสินค้าไปส่งศูนย์ VD ที่ใกล้ที่สุด (สาขาเดียวกันหลายแถว = ลำดับความสำคัญตามลำดับแถว)
      </p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead>
            <tr>
              <th>สาขา</th>
              <th>ผู้จัดการเขต</th>
              <th>ศูนย์ VD ใกล้เคียงอันดับ 1</th>
              <th>ศูนย์ VD สำรอง</th>
              <th>คลัง DC</th>
              <th>ช่องทางมาตรฐาน</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <select
                    className="sel"
                    value={r.branchId}
                    onChange={e => upd(i, { branchId: e.target.value })}
                  >
                    <option value="">เลือกสาขา</option>
                    {branches.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="inp inp-sm"
                    disabled
                    value={sites.find(s => s.id === r.branchId)?.manager ?? ''}
                  />
                </td>
                <td>
                  <select
                    className="sel"
                    value={r.primaryCenterId}
                    onChange={e => upd(i, { primaryCenterId: e.target.value })}
                  >
                    <option value="">เลือก</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.vendorParent.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="sel"
                    value={r.backupCenterId}
                    onChange={e => upd(i, { backupCenterId: e.target.value })}
                  >
                    <option value="">-</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.vendorParent.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="sel"
                    value={r.dcSiteId}
                    onChange={e => upd(i, { dcSiteId: e.target.value })}
                  >
                    <option value="">-</option>
                    {dcs.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="sel"
                    value={r.standardChannel}
                    onChange={e => upd(i, { standardChannel: e.target.value })}
                  >
                    <option value="DC">DC</option>
                    <option value="DSD">DSD</option>
                  </select>
                </td>
                <td>
                  <button className="remove-btn" onClick={() => setRows(x => x!.filter((_, j) => j !== i))}>
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
              {
                branchId: '',
                dcSiteId: dcs[0]?.id ?? '',
                primaryCenterId: '',
                backupCenterId: '',
                standardChannel: 'DC',
              },
            ])
          }
        >
          + เพิ่มการจับคู่
        </button>
        <SaveButton
          label="บันทึกการจับคู่"
          saving={saving}
          justSaved={justSaved}
          onClick={() =>
            save(async () => {
              await api('/api/admin/routes', { method: 'PUT', body: rows })
              await load()
            })
          }
        />
      </Row>
    </div>
  )
}
