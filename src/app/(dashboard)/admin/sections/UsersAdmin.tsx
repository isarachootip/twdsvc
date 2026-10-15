'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  site?: { code?: string; nickname?: string; name: string } | null
  vendorCenter?: { code: string } | null
}

export function UsersAdmin() {
  const [users, setUsers] = useState<UserItem[] | null>(null)
  const [sites, setSites] = useState<SiteLite[]>([])
  const [centers, setCenters] = useState<CenterOption[]>([])
  const [edit, setEdit] = useState<UserEditDraft | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const { saving, save } = useSave()

  const load = useCallback(() => api<UserItem[]>('/api/admin/users').then(setUsers), [])

  useEffect(() => {
    load()
    api<SiteLite[]>('/api/sites').then(setSites).catch(() => {})
    api<CenterOption[]>('/api/vendor-centers').then(setCenters).catch(() => {})
  }, [load])

  const filteredUsers = useMemo(() => {
    if (!users) return []
    const q = search.trim().toLowerCase()
    return users.filter(u => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
      if (!q) return true
      return (
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        (u.site?.name ?? '').toLowerCase().includes(q) ||
        (u.site?.nickname ?? '').toLowerCase().includes(q) ||
        (u.site?.code ?? '').toLowerCase().includes(q) ||
        (u.vendorCenter?.code ?? '').toLowerCase().includes(q)
      )
    })
  }, [users, search, roleFilter])

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
        <h3 style={{ margin: 0 }}>
          ผู้ใช้งานทั้งหมด ({filteredUsers.length}/{users.length})
        </h3>
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
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <input
          className="inp"
          style={{ maxWidth: 280 }}
          placeholder="ค้นหา Username, ชื่อย่อสาขา (เช่น BNA, BNACS)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="sel"
          style={{ maxWidth: 200 }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="ALL">ทุก Role ({users.length})</option>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <option key={role} value={role}>
              {label}
            </option>
          ))}
        </select>
      </div>
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
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td><b>{u.username}</b></td>
                <td>{u.fullName}</td>
                <td>
                  <span className="text-xs font-semibold text-blue-700">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td>
                  {u.site
                    ? `${u.site.nickname ? `[${u.site.nickname}] ` : ''}${u.site.name}`
                    : u.vendorCenter?.code ?? '-'}
                </td>
                <td>
                  {!u.active ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      ปิดใช้งาน
                    </span>
                  ) : u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      ถูกล็อก
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ใช้งาน
                    </span>
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
