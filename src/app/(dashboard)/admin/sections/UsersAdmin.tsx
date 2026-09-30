'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useSave, Row, Loading, type SiteLite } from './admin-helpers'
import { UserEditModal, type UserEditDraft, type CenterOption } from './UserEditModal'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  EXECUTIVE: 'ผู้บริหาร',
  CS: 'ฝ่ายบริการลูกค้า (CS)',
  GR: 'ฝ่ายรับสินค้า (GR)',
  DC: 'ศูนย์กระจายสินค้า (DC)',
  VD: 'ศูนย์ซ่อม (Vendor)',
  S2: 'ช่างซ่อมสาขา (S2)',
}

interface UserItem {
  id: string
  username: string
  fullName: string
  email?: string | null
  role: string
  siteId?: string | null
  vendorCenterId?: string | null
  active: boolean
  lockedUntil?: string | null
  site?: { name: string } | null
  vendorCenter?: { code: string } | null
}

export function UsersAdmin() {
  const [users, setUsers] = useState<UserItem[] | null>(null)
  const [sites, setSites] = useState<SiteLite[]>([])
  const [centers, setCenters] = useState<CenterOption[]>([])
  const [edit, setEdit] = useState<UserEditDraft | null>(null)
  const { saving, save } = useSave()

  const load = useCallback(() => api<UserItem[]>('/api/admin/users').then(setUsers), [])

  useEffect(() => {
    load()
    api<SiteLite[]>('/api/sites').then(setSites).catch(() => {})
    api<CenterOption[]>('/api/vendor-centers').then(setCenters).catch(() => {})
  }, [load])

  if (!users) return <Loading />

  const handleSaveUser = async () => {
    if (!edit) return
    const ok = await save(() =>
      api('/api/admin/users', {
        method: edit.isNew ? 'POST' : 'PUT',
        body: edit,
      })
    )
    if (ok) {
      setEdit(null)
      load()
    }
  }

  return (
    <div className="pcard">
      <Row between>
        <h3 style={{ margin: 0 }}>ผู้ใช้งานทั้งหมด ({users.length})</h3>
        <button
          className="btn btn-primary"
          onClick={() =>
            setEdit({
              isNew: true,
              username: '',
              fullName: '',
              email: '',
              role: 'CS',
              siteId: '',
              vendorCenterId: '',
              password: '',
              active: true,
            })
          }
        >
          + เพิ่มผู้ใช้
        </button>
      </Row>
      <div className="tbl-wrap" style={{ marginTop: 12 }}>
        <table className="tbl compact">
          <thead>
            <tr>
              <th>Username</th>
              <th>ชื่อ</th>
              <th>Role</th>
              <th>สาขา / ศูนย์ซ่อม</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><b>{u.username}</b></td>
                <td>{u.fullName}</td>
                <td><span className="badge b-blue">{ROLE_LABELS[u.role] ?? u.role}</span></td>
                <td>{u.site?.name ?? u.vendorCenter?.code ?? '-'}</td>
                <td>
                  {!u.active ? (
                    <span className="badge b-gray">ปิดใช้งาน</span>
                  ) : u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                    <span className="badge b-red">ถูกล็อก</span>
                  ) : (
                    <span className="badge b-green">ใช้งาน</span>
                  )}
                </td>
                <td>
                  <button
                    className="link-btn"
                    onClick={() =>
                      setEdit({
                        ...u,
                        email: u.email ?? '',
                        password: '',
                        siteId: u.siteId ?? '',
                        vendorCenterId: u.vendorCenterId ?? '',
                      })
                    }
                  >
                    แก้ไข
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UserEditModal
        edit={edit}
        saving={saving}
        sites={sites}
        centers={centers}
        onChange={setEdit}
        onClose={() => setEdit(null)}
        onSave={handleSaveUser}
      />
    </div>
  )
}
