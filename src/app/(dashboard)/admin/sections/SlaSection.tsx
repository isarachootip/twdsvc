'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { useSave, SaveButton, Row, Loading } from './admin-helpers'

const EVENTS = [
  'JOB_OPENED', 'GR_RECEIVED', 'GR_PACKED', 'SHIPMENT_DISPATCHED', 'OUTBOUND_HANDED_OFF',
  'DC_RECEIVED_OUTBOUND', 'DC_HANDED_OFF_VD', 'VD_RECEIVED', 'QUOTE_SENT', 'QUOTE_REVISED',
  'CUSTOMER_APPROVED', 'CUSTOMER_REJECTED', 'REPAIR_STARTED', 'REPAIR_FINISHED',
  'RETURN_PACKED', 'DC_RECEIVED_INBOUND', 'DC_DISPATCHED_TO_BRANCH', 'GR_RETURN_RECEIVED',
  'DELIVERED_TO_CS', 'JOB_CLOSED',
]

function fmtHours(h: number) {
  return h % 24 === 0 && h >= 24 ? `${h / 24} วัน` : `${h} ชม.`
}

function parseHours(s: string): number {
  const n = parseFloat(s)
  if (Number.isNaN(n)) return NaN
  return /วัน|day|d\b/i.test(s) ? Math.round(n * 24) : Math.round(n)
}

interface SlaRow {
  id?: string
  seq?: number
  name: string
  startEvent: string
  stopEvent: string
  hours: number
  hoursText: string
  ownerDept: string
  active: boolean
  condition?: string
}

export function SlaSection() {
  const [rows, setRows] = useState<SlaRow[] | null>(null)
  const { saving, save, justSaved } = useSave()
  const { toast } = useToast()

  const load = useCallback(
    () =>
      api<Array<Omit<SlaRow, 'hoursText'>>>('/api/admin/sla').then(d =>
        setRows(d.map(s => ({ ...s, hoursText: fmtHours(s.hours) })))
      ),
    []
  )

  useEffect(() => {
    load()
  }, [load])

  if (!rows) return <Loading />

  const upd = (i: number, p: Partial<SlaRow>) =>
    setRows(r => r!.map((x, j) => (j === i ? { ...x, ...p } : x)))

  const handleSave = () => {
    const bad = rows.find(r => !(parseHours(r.hoursText) > 0))
    if (bad) {
      toast(`SLA ของ "${bad.name || 'ขั้นตอนใหม่'}" ไม่ถูกต้อง`, 'error')
      return
    }
    save(async () => {
      await api('/api/admin/sla', {
        method: 'PUT',
        body: rows.map(r => ({ ...r, hours: parseHours(r.hoursText) })),
      })
      await load()
    })
  }

  return (
    <div className="pcard">
      <h3>SLA แต่ละขั้นตอน (ตามลำดับ flow เต็ม)</h3>
      <p className="hint">
        กรอกเป็น &quot;24 ชม.&quot; หรือ &quot;2 วัน&quot; — SLA ระยะเวลาซ่อมของ VD ใช้ค่าจาก Vendor Portal (SLA ซ่อมเริ่มต้น/override)
      </p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead>
            <tr>
              <th>#</th>
              <th>ขั้นตอน</th>
              <th>เริ่มนับเมื่อ</th>
              <th>หยุดเมื่อ</th>
              <th>SLA</th>
              <th>เจ้าของ</th>
              <th>เปิดใช้</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? `n${i}`}>
                <td>{r.seq ?? '-'}</td>
                <td>
                  <input className="inp inp-sm" style={{ minWidth: 220 }} value={r.name} onChange={e => upd(i, { name: e.target.value })} />
                </td>
                <td>
                  {r.id ? <span className="sub-mute">{r.startEvent}</span> : (
                    <select className="sel" value={r.startEvent} onChange={e => upd(i, { startEvent: e.target.value })}>
                      {EVENTS.map(ev => <option key={ev}>{ev}</option>)}
                    </select>
                  )}
                  {r.condition && <div className="sub-mute">เงื่อนไข: {r.condition}</div>}
                </td>
                <td>
                  {r.id ? <span className="sub-mute">{r.stopEvent}</span> : (
                    <select className="sel" value={r.stopEvent} onChange={e => upd(i, { stopEvent: e.target.value })}>
                      {EVENTS.map(ev => <option key={ev}>{ev}</option>)}
                    </select>
                  )}
                </td>
                <td>
                  <input className="inp inp-sm" style={{ width: 90 }} placeholder="เช่น 24 ชม. / 2 วัน" value={r.hoursText} onChange={e => upd(i, { hoursText: e.target.value })} />
                </td>
                <td>
                  {r.id ? r.ownerDept : (
                    <select className="sel" value={r.ownerDept} onChange={e => upd(i, { ownerDept: e.target.value })}>
                      {['CS', 'GR', 'DC', 'VD', 'CARRIER', 'CUSTOMER'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  )}
                </td>
                <td>
                  <button className={`toggle ${r.active ? 'on' : ''}`} onClick={() => upd(i, { active: !r.active })} />
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
              { name: '', startEvent: 'JOB_OPENED', stopEvent: 'GR_RECEIVED', ownerDept: 'CS', hours: 24, hoursText: '24 ชม.', active: true },
            ])
          }
        >
          + เพิ่มขั้นตอน
        </button>
        <SaveButton label="บันทึก SLA" saving={saving} justSaved={justSaved} onClick={handleSave} />
      </Row>
    </div>
  )
}
