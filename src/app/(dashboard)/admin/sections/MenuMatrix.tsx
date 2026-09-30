'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { MENU_DEFS } from '@/lib/constants'
import { useSave, SaveButton, Row, Loading } from './admin-helpers'

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

export function MenuMatrix() {
  const [perms, setPerms] = useState<
    Record<string, { canAccess: boolean; canWrite: boolean }> | null
  >(null)
  const { saving, save, justSaved } = useSave()

  const load = useCallback(
    () =>
      api<{ perms: Array<{ menuKey: string; role: string; canAccess: boolean; canWrite: boolean }> }>(
        '/api/admin/rbac'
      ).then(d => {
        const m: Record<string, { canAccess: boolean; canWrite: boolean }> = {}
        for (const p of d.perms)
          m[`${p.menuKey}|${p.role}`] = { canAccess: p.canAccess, canWrite: p.canWrite }
        setPerms(m)
      }),
    []
  )

  useEffect(() => {
    load()
  }, [load])

  if (!perms) return <Loading />

  const get = (k: string, r: string) => perms[`${k}|${r}`] ?? { canAccess: false, canWrite: false }
  const set = (k: string, r: string, p: Partial<{ canAccess: boolean; canWrite: boolean }>) =>
    setPerms(x => ({ ...x!, [`${k}|${r}`]: { ...get(k, r), ...p } }))

  return (
    <div className="pcard">
      <h3>สิทธิ์การเข้าถึงเมนู</h3>
      <p className="hint">
        เปิด/ปิดเมนูของแต่ละ Role (สิทธิ์ทำรายการในแต่ละคิวผูกกับ Role ตามเอกสาร 08 — Admin เข้าเมนูตั้งค่าได้เสมอ)
      </p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead>
            <tr>
              <th>เมนู</th>
              {ROLES.map(r => (
                <th key={r} style={{ textAlign: 'center' }}>
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MENU_DEFS.map(m => (
              <tr key={m.key}>
                <td>{m.label}</td>
                {ROLES.map(r => (
                  <td key={r} style={{ textAlign: 'center' }}>
                    <button
                      className={`toggle ${get(m.key, r).canAccess ? 'on' : ''}`}
                      disabled={m.key === 'admin' && r === 'ADMIN'}
                      onClick={() =>
                        set(m.key, r, {
                          canAccess: !get(m.key, r).canAccess,
                          canWrite: !get(m.key, r).canAccess && r !== 'EXECUTIVE',
                        })
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Row>
        <SaveButton
          label="บันทึกสิทธิ์"
          saving={saving}
          justSaved={justSaved}
          onClick={() =>
            save(async () => {
              const body = MENU_DEFS.flatMap(m =>
                ROLES.map(r => ({
                  menuKey: m.key,
                  role: r,
                  ...get(m.key, r),
                  ...(m.key === 'admin' && r === 'ADMIN'
                    ? { canAccess: true, canWrite: true }
                    : {}),
                }))
              )
              await api('/api/admin/rbac', { method: 'PUT', body })
              await load()
            })
          }
        />
      </Row>
    </div>
  )
}
