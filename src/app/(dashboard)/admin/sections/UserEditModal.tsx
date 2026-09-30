'use client'

import Modal from '@/components/ui/Modal'
import { type SiteLite } from './admin-helpers'

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

export interface UserEditDraft {
  id?: string
  isNew?: boolean
  username: string
  fullName: string
  email: string
  role: string
  siteId: string
  vendorCenterId: string
  password?: string
  active: boolean
  lockedUntil?: string | null
  unlock?: boolean
}

export interface CenterOption {
  id: string
  code: string
  vendorParent: { name: string }
}

interface UserEditModalProps {
  edit: UserEditDraft | null
  saving: boolean
  sites: SiteLite[]
  centers: CenterOption[]
  onChange: (draft: UserEditDraft) => void
  onClose: () => void
  onSave: () => void
}

export function UserEditModal({
  edit,
  saving,
  sites,
  centers,
  onChange,
  onClose,
  onSave,
}: UserEditModalProps) {
  if (!edit) return null

  return (
    <Modal open={!!edit} onClose={onClose}>
      <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>
        {edit.isNew ? 'เพิ่มผู้ใช้' : `แก้ไขผู้ใช้ ${edit.username}`}
      </h3>
      <div className="grid2">
        <div className="field">
          <label>Username</label>
          <input
            className="inp"
            disabled={!edit.isNew}
            value={edit.username}
            onChange={e => onChange({ ...edit, username: e.target.value })}
          />
        </div>
        <div className="field">
          <label>ชื่อ-นามสกุล</label>
          <input
            className="inp"
            value={edit.fullName}
            onChange={e => onChange({ ...edit, fullName: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Role</label>
          <select
            className="sel"
            value={edit.role}
            onChange={e => onChange({ ...edit, role: e.target.value })}
          >
            {ROLES.map(r => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        {['CS', 'GR', 'S2', 'DC'].includes(edit.role) && (
          <div className="field">
            <label>สาขา / คลัง</label>
            <select
              className="sel"
              value={edit.siteId}
              onChange={e => onChange({ ...edit, siteId: e.target.value })}
            >
              <option value="">เลือก</option>
              {sites
                .filter(s => (edit.role === 'DC' ? s.type === 'DC' : s.type === 'BRANCH'))
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        )}
        {edit.role === 'VD' && (
          <div className="field">
            <label>ศูนย์ซ่อม</label>
            <select
              className="sel"
              value={edit.vendorCenterId}
              onChange={e => onChange({ ...edit, vendorCenterId: e.target.value })}
            >
              <option value="">เลือก</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.vendorParent.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input
            className="inp"
            value={edit.email ?? ''}
            onChange={e => onChange({ ...edit, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label>
            {edit.isNew ? 'รหัสผ่าน (≥10 ตัวอักษร)' : 'ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)'}
          </label>
          <input
            className="inp"
            type="password"
            value={edit.password ?? ''}
            onChange={e => onChange({ ...edit, password: e.target.value })}
          />
        </div>
      </div>
      <div className="checkbox-row">
        <input
          type="checkbox"
          id="u-active"
          checked={edit.active}
          onChange={e => onChange({ ...edit, active: e.target.checked })}
        />
        <label htmlFor="u-active">เปิดใช้งาน</label>
      </div>
      {!edit.isNew && edit.lockedUntil && new Date(edit.lockedUntil) > new Date() && (
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="u-unlock"
            checked={!!edit.unlock}
            onChange={e => onChange({ ...edit, unlock: e.target.checked })}
          />
          <label htmlFor="u-unlock">ปลดล็อกบัญชี</label>
        </div>
      )}
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={saving} onClick={onSave}>บันทึก</button>
      </div>
    </Modal>
  )
}
