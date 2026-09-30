'use client'

import { api } from '@/lib/client'
import { useSave, SaveButton, Row, Loading, useSetting } from './admin-helpers'
import { DashboardExportCard } from './DashboardExportCard'

const EXTRA_REPORTS = [
  'ปริมาณงานตามสาขา',
  'สัดส่วนลูกค้าอนุมัติ/ไม่ซ่อม',
  'Vendor Scorecard สรุป',
  'DC Scorecard สรุป',
  'ยอดขาย Trade-in / คูปอง',
  'งานตามช่องทางจัดส่ง (DSD/DC/3PL)',
  'กำไรขาดทุนต่องาน',
]

const ROLES = ['ADMIN', 'EXECUTIVE', 'CS', 'GR', 'DC', 'VD', 'S2']
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  EXECUTIVE: 'ผู้บริหาร',
  CS: 'ฝ่ายบริการลูกค้า (CS)',
  GR: 'ฝ่ายรับสินค้า (GR)',
  DC: 'ศูนย์กระจายสินค้า (DC)',
  VD: 'ศูนย์ซ่อม (Vendor)',
  S2: 'ช่างซ่อมสาขา (S2)',
}

interface WidgetItem {
  key: string
  label: string
  enabled: boolean
}

export function DashboardSection() {
  const { val: widgets, setVal: setWidgets } =
    useSetting<WidgetItem[]>('DASHBOARD_WIDGETS')
  const { val: costRoles, setVal: setCostRoles } =
    useSetting<string[]>('COST_VIEW_ROLES')
  const { saving, save, justSaved } = useSave()

  if (!widgets || !costRoles) return <Loading />

  return (
    <>
      <div className="pcard">
        <h3>รายการสรุปที่แสดงบน Dashboard</h3>
        <p className="hint">เลือกเปิด/ปิดรายการย่อยแต่ละตัว เพื่อ custom หน้า Dashboard</p>
        <table className="tbl compact">
          <thead>
            <tr>
              <th>รายการ</th>
              <th>แสดงผล</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {widgets.map((w, i) => (
              <tr key={w.key}>
                <td>{w.label}</td>
                <td>
                  <button
                    className={`toggle ${w.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setWidgets(
                        widgets.map((x, j) => (j === i ? { ...x, enabled: !x.enabled } : x))
                      )
                    }
                  />
                </td>
                <td>
                  {w.key.startsWith('custom_') && (
                    <button
                      className="remove-btn"
                      onClick={() => setWidgets(widgets.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="field" style={{ marginTop: 14 }}>
          <label>เพิ่มรายงานอื่นๆ เข้า Dashboard</label>
          <select
            className="sel"
            value=""
            onChange={e =>
              e.target.value &&
              setWidgets([
                ...widgets,
                { key: `custom_${Date.now()}`, label: e.target.value, enabled: true },
              ])
            }
          >
            <option value="">— เลือกรายงานที่ต้องการเพิ่ม —</option>
            {EXTRA_REPORTS.filter(r => !widgets.some(w => w.label === r)).map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <Row>
          <SaveButton
            label="บันทึกการแสดงผล"
            saving={saving}
            justSaved={justSaved}
            onClick={() =>
              save(() =>
                api('/api/admin/settings', {
                  method: 'PUT',
                  body: { DASHBOARD_WIDGETS: widgets },
                })
              )
            }
          />
        </Row>
      </div>
      <div className="pcard">
        <h3>สิทธิ์เห็นข้อมูลต้นทุน/กำไรขาดทุน</h3>
        <p className="hint">ข้อมูลต้นทุนและกำไรเป็นข้อมูลอ่อนไหว เปิดให้เห็นเฉพาะบาง role</p>
        <table className="tbl compact">
          <thead>
            <tr>
              <th>Role</th>
              <th>เห็นต้นทุน/กำไรขาดทุน</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map(r => (
              <tr key={r}>
                <td>{ROLE_LABELS[r]}</td>
                <td>
                  <button
                    className={`toggle ${costRoles.includes(r) ? 'on' : ''}`}
                    onClick={() =>
                      setCostRoles(
                        costRoles.includes(r)
                          ? costRoles.filter(x => x !== r)
                          : [...costRoles, r]
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Row>
          <SaveButton
            label="บันทึกสิทธิ์ต้นทุน"
            saving={saving}
            justSaved={justSaved}
            onClick={() =>
              save(() =>
                api('/api/admin/settings', {
                  method: 'PUT',
                  body: { COST_VIEW_ROLES: costRoles },
                })
              )
            }
          />
        </Row>
      </div>
      <DashboardExportCard />
    </>
  )
}
