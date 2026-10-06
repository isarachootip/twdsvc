'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateNewPassword } from '@/lib/password-policy'

interface Props {
  /** True when the user arrived because the temporary password must be replaced. */
  forced: boolean
}

export function ChangePasswordForm({ forced }: Props) {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (next !== confirm) return setError('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน')
    const problem = validateNewPassword(next, current)
    if (problem) return setError(problem)

    setBusy(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return setError(data.error ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ')
      router.push('/') // middleware sends each role to its home page
      router.refresh()
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:border-red-400 transition-colors'
  const style = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }

  return (
    <form onSubmit={submit} className="space-y-4">
      {forced && (
        <p className="text-sm rounded-lg px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800">
          บัญชีของคุณใช้รหัสผ่านชั่วคราว กรุณาตั้งรหัสผ่านใหม่ก่อนเข้าใช้งานระบบ
        </p>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">รหัสผ่านปัจจุบัน{forced ? ' (รหัสชั่วคราวที่ได้รับ)' : ''}</label>
        <input type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)} className={input} style={style} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">รหัสผ่านใหม่</label>
        <input type="password" autoComplete="new-password" required value={next} onChange={e => setNext(e.target.value)} className={input} style={style} />
        <p className="text-xs mt-1" style={{ color: 'var(--text-mute)' }}>อย่างน้อย 10 ตัวอักษร มีทั้งตัวอักษรและตัวเลข</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">ยืนยันรหัสผ่านใหม่</label>
        <input type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} className={input} style={style} />
      </div>
      {error && <p className="text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: 'var(--red)' }}
      >
        {busy ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
      </button>
    </form>
  )
}
