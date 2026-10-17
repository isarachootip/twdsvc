'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { KeyRound } from 'lucide-react'
import type { LineLinkStatus } from '@/lib/services/line-link.service'
import { LineOaQrBox } from './LineOaQrBox'
import { LineCodeBox } from './LineCodeBox'
import { LineLinkedStatus } from './LineLinkedStatus'

interface IssuedCode {
  code: string
  expiresAt: string
}

export function LineLinkCard() {
  const [status, setStatus] = useState<LineLinkStatus | null>(null)
  const [issued, setIssued] = useState<IssuedCode | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/line-link')
    if (!res.ok) return
    const data = (await res.json()) as LineLinkStatus
    setStatus(data)
    if (data.linked) setIssued(null)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Auto-poll every 3 seconds while waiting for the user to send the 8-digit code in LINE chat
  useEffect(() => {
    if (!issued || status?.linked) return
    const timer = setInterval(() => {
      void refresh()
    }, 3000)
    return () => clearInterval(timer)
  }, [issued, status?.linked, refresh])

  async function call(method: 'POST' | 'DELETE') {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/auth/line-link', { method })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      setIssued(method === 'POST' ? (data as IssuedCode) : null)
      if (method === 'DELETE') await refresh()
    } finally {
      setBusy(false)
    }
  }

  if (status === null) {
    return <div className="card text-sm">กำลังโหลดข้อมูลการเชื่อมต่อ LINE...</div>
  }

  const isAdmin = status.role === 'ADMIN'

  return (
    <div className="card space-y-4">
      {status.linked ? (
        <LineLinkedStatus
          fullName={status.fullName}
          role={status.role}
          linkedAt={status.linkedAt}
          lineOaId={status.lineOaId}
          busy={busy}
          onUnlink={() => void call('DELETE')}
        />
      ) : (
        <>
          <ol className="text-sm list-decimal pl-5 space-y-1.5" style={{ color: 'var(--text-2)' }}>
            <li>กดปุ่ม <strong>“ขอรหัสเชื่อมต่อ”</strong> ด้านล่างเพื่อรับรหัส 8 หลัก</li>
            <li>สแกน QR Code หรือกดปุ่มเพิ่มเพื่อน <strong>LINE Official Account</strong> ของบริษัท</li>
            <li>คัดลอกรหัส 8 หลักไปส่งในแชท LINE (รหัสมีอายุ 10 นาที ระบบจะเชื่อมต่อให้อัตโนมัติ)</li>
          </ol>

          {!status.lineConfigured && (
            <div className="pt-2 border-t text-xs space-y-1" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block shrink-0" />
                <span>ระบบยังไม่ได้ตั้งค่าการเชื่อมต่อ LINE (Channel Secret / Access Token)</span>
              </div>
              {isAdmin ? (
                <div style={{ color: 'var(--text-2)' }}>
                  กรุณาตั้งค่า LINE Messaging API ก่อนใช้งานที่หน้า{' '}
                  <Link href="/admin/integrations" className="underline font-semibold" style={{ color: 'var(--red)' }}>
                    ตั้งค่าระบบหลังบ้าน &gt; 14. เชื่อมต่อระบบ (LINE / อีเมล)
                  </Link>
                </div>
              ) : (
                <div style={{ color: 'var(--text-2)' }}>
                  กรุณาแจ้งผู้ดูแลระบบ (Admin) เพื่อตั้งค่าการเชื่อมต่อ LINE Official Account
                </div>
              )}
            </div>
          )}

          {status.lineConfigured && (
            <LineOaQrBox
              lineOaId={status.lineOaId}
              lineAddFriendUrl={status.lineAddFriendUrl}
              isAdmin={isAdmin}
            />
          )}

          {issued && (
            <LineCodeBox
              code={issued.code}
              expiresAt={issued.expiresAt}
              onRefresh={() => void refresh()}
              onExpired={() => setIssued(null)}
            />
          )}

          <div className="pt-1">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !status.lineConfigured}
              onClick={() => void call('POST')}
            >
              <KeyRound size={14} />
              {busy ? 'กำลังขอรหัส...' : issued ? 'ขอรหัสเชื่อมต่อใหม่' : 'ขอรหัสเชื่อมต่อ'}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-rose-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
