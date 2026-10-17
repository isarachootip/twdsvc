'use client'

import { useState } from 'react'
import { Send, Unlink } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'

interface LineLinkedStatusProps {
  fullName: string
  role: string
  linkedAt: string | null
  lineOaId: string
  busy: boolean
  onUnlink: () => void
}

export function LineLinkedStatus({
  fullName,
  role,
  linkedAt,
  lineOaId,
  busy,
  onUnlink,
}: LineLinkedStatusProps) {
  const [testing, setTesting] = useState(false)
  const [testNotice, setTestNotice] = useState<{ ok: boolean; text: string } | null>(null)

  async function sendTestMessage() {
    setTesting(true)
    setTestNotice(null)
    try {
      const res = await fetch('/api/auth/line-link/test', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setTestNotice({ ok: false, text: data.error ?? 'ส่งข้อความทดสอบไม่สำเร็จ' })
        return
      }
      setTestNotice({ ok: true, text: 'ส่งข้อความทดสอบเข้า LINE สำเร็จแล้ว กรุณาตรวจสอบในแชท LINE ของคุณ' })
    } finally {
      setTesting(false)
    }
  }

  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block shrink-0" />
          <span>บัญชีนี้เชื่อมต่อกับ LINE Official Account {lineOaId || ''} แล้ว</span>
        </div>
        <div className="text-xs space-y-0.5 pl-4" style={{ color: 'var(--text-2)' }}>
          <div>ผู้ใช้งาน: <span className="font-medium" style={{ color: 'var(--text)' }}>{fullName}</span></div>
          <div>สถานะรับแจ้งเตือน: พร้อมรับแจ้งเตือนงานซ่อมและ SLA ตามบทบาท <span className="font-medium text-emerald-700">{roleLabel}</span></div>
          {linkedAt && (
            <div>เชื่อมต่อเมื่อ: {new Date(linkedAt).toLocaleString('th-TH')}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={testing || busy}
          onClick={sendTestMessage}
        >
          <Send size={14} />
          {testing ? 'กำลังส่งข้อความทดสอบ...' : 'ส่งข้อความทดสอบเข้า LINE'}
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy || testing}
          onClick={onUnlink}
        >
          <Unlink size={14} />
          ยกเลิกการเชื่อมต่อ
        </button>
      </div>

      {testNotice && (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${testNotice.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${testNotice.ok ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          <span>{testNotice.text}</span>
        </div>
      )}
    </div>
  )
}
