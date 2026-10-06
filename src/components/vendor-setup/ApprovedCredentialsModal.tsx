'use client'

import { useState } from 'react'
import { KeyRound, Copy } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export interface ApprovedCredentials {
  username: string
  tempPassword: string
}

export interface EmailStatus {
  sent: boolean
  mode: 'live' | 'simulated'
  error?: string
}

interface Props {
  credentials: ApprovedCredentials
  storeName: string
  emailStatus?: EmailStatus
  onClose: () => void
}

function emailMessage(s?: EmailStatus): { text: string; ok: boolean } {
  if (s?.sent) return { text: 'ส่งอีเมลแจ้งร้านค้าเรียบร้อยแล้ว (ยังควรคัดลอกรหัสไว้เผื่อกรณีฉุกเฉิน)', ok: true }
  if (s?.mode === 'simulated') return { text: 'ยังไม่ได้ตั้งค่า SMTP ระบบจึงไม่ได้ส่งอีเมล กรุณาส่งข้อมูลนี้ให้ร้านค้าเอง', ok: false }
  return { text: `ส่งอีเมลไม่สำเร็จ${s?.error ? ` (${s.error})` : ''} กรุณาส่งข้อมูลนี้ให้ร้านค้าเอง`, ok: false }
}

/** Shows the one-time VD login right after approval. The password is not stored and cannot be shown again. */
export function ApprovedCredentialsModal({ credentials, storeName, emailStatus, onClose }: Props) {
  const msg = emailMessage(emailStatus)
  const [acknowledged, setAcknowledged] = useState(false)
  const { toast } = useToast()

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(`ชื่อผู้ใช้: ${credentials.username}\nรหัสผ่านชั่วคราว: ${credentials.tempPassword}`)
      toast('คัดลอกข้อมูลเข้าสู่ระบบแล้ว', 'success')
    } catch {
      toast('คัดลอกไม่สำเร็จ กรุณาจดข้อมูลด้วยตนเอง', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="pcard w-full max-w-md space-y-4 p-6" style={{ background: 'var(--surface)' }}>
        <h3 className="flex items-center gap-2 text-base font-bold">
          <KeyRound className="h-5 w-5" style={{ color: 'var(--red)' }} /> อนุมัติแล้ว: {storeName}
        </h3>
        <div className="rounded-lg border p-3 text-sm" style={{ borderColor: 'var(--border)' }}>
          <div>ชื่อผู้ใช้: <b>{credentials.username}</b></div>
          <div>รหัสผ่านชั่วคราว: <b className="font-mono">{credentials.tempPassword}</b></div>
        </div>
        <p className="text-xs" style={{ color: msg.ok ? 'var(--text-2)' : 'var(--red-dark)' }}>{msg.text}</p>
        <p className="text-xs" style={{ color: 'var(--red-dark)' }}>
          รหัสผ่านนี้แสดงครั้งเดียวและไม่ถูกบันทึกในระบบ กรุณาคัดลอกและส่งให้ร้านค้าก่อนปิดหน้าต่างนี้
        </p>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
          ฉันคัดลอกข้อมูลนี้แล้ว
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={copyAll}><Copy size={14} /> <span className="ml-1.5">คัดลอก</span></button>
          <button type="button" className="btn btn-primary" disabled={!acknowledged} onClick={onClose}>ปิด</button>
        </div>
      </div>
    </div>
  )
}
