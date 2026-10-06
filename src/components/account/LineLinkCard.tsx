'use client'

import { useCallback, useEffect, useState } from 'react'

interface IssuedCode { code: string; expiresAt: string }

export function LineLinkCard() {
  const [linked, setLinked] = useState<boolean | null>(null)
  const [issued, setIssued] = useState<IssuedCode | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/line-link')
    if (res.ok) setLinked(Boolean((await res.json()).linked))
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function call(method: 'POST' | 'DELETE') {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/auth/line-link', { method })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'เกิดข้อผิดพลาด'); return }
      setIssued(method === 'POST' ? (data as IssuedCode) : null)
      if (method === 'DELETE') await refresh()
    } finally { setBusy(false) }
  }

  if (linked === null) return <div className="card text-sm">กำลังโหลด...</div>

  return (
    <div className="card space-y-4">
      {linked ? (
        <>
          <p className="text-sm" style={{ color: 'var(--text)' }}>✅ บัญชีนี้เชื่อมต่อกับ LINE แล้ว</p>
          <button className="btn-secondary" disabled={busy} onClick={() => call('DELETE')}>ยกเลิกการเชื่อมต่อ</button>
        </>
      ) : (
        <>
          <ol className="text-sm list-decimal pl-5 space-y-1" style={{ color: 'var(--text-2)' }}>
            <li>กด “ขอรหัสเชื่อมต่อ”</li>
            <li>เพิ่มเพื่อน LINE Official Account ของบริษัท</li>
            <li>พิมพ์รหัสที่ได้ส่งในแชท (หมดอายุใน 10 นาที)</li>
          </ol>
          {issued && (
            <div className="text-center">
              <div className="text-3xl font-mono tracking-widest font-bold" style={{ color: 'var(--text)' }}>{issued.code}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-mute)' }}>
                หมดอายุ {new Date(issued.expiresAt).toLocaleTimeString('th-TH')}
              </div>
            </div>
          )}
          <button className="btn-primary" disabled={busy} onClick={() => call('POST')}>ขอรหัสเชื่อมต่อ</button>
          {issued && <button className="btn-secondary ml-2" onClick={refresh}>ตรวจสอบสถานะ</button>}
        </>
      )}
      {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
    </div>
  )
}
