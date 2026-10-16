'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader'

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/exec',
  EXECUTIVE: '/exec',
  CS: '/cs',
  GR: '/gr',
  DC: '/dc',
  VD: '/vd',
  S2: '/s2',
}

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const doLogin = async (u: string, p: string) => {
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'เข้าสู่ระบบไม่สำเร็จ')
      return
    }
    const route = data.mustChangePassword ? '/change-password' : (ROLE_ROUTES[data.role] ?? '/jobs')
    router.push(route)
    router.refresh()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => doLogin(username, password))
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <AuthBrandHeader subtitle="SERVICE CENTER MANAGEMENT" />

        {/* Login card */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--text)' }}>
            เข้าสู่ระบบ
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                ชื่อผู้ใช้
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                required
                className="w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:border-red-400 transition-colors"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:border-red-400 transition-colors"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
            </div>

            {error && (
              <p className="text-sm text-overdue bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'var(--red)' }}
            >
              {isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
