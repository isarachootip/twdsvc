'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/exec',
  EXECUTIVE: '/exec',
  CS: '/cs',
  GR: '/gr',
  DC: '/dc',
  VD: '/vd',
  S2: '/s2',
}

const QUICK_LOGINS = [
  { label: 'CS', username: 'test_cs', icon: '👤' },
  { label: 'GR', username: 'test_gr', icon: '📦' },
  { label: 'DC', username: 'test_dc', icon: '🏭' },
  { label: 'VD (ช่าง)', username: 'test_vd', icon: '🔧' },
  { label: 'S2', username: 'test_s2', icon: '🏪' },
  { label: 'Admin', username: 'test_am', icon: '⚙️' },
]

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
    const route = ROLE_ROUTES[data.role] ?? '/jobs'
    router.push(route)
    router.refresh()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => doLogin(username, password))
  }

  const handleQuickLogin = (u: string) => {
    startTransition(() => doLogin(u, 'password123'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-block px-6 py-3 rounded-xl text-white font-bold text-lg mb-2"
            style={{ background: 'var(--red)' }}
          >
            THAIWASADU
          </div>
          <div className="text-sm" style={{ color: 'var(--text-2)' }}>
            SERVICE CENTER MANAGEMENT
          </div>
        </div>

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

          {/* Quick login (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs mb-3 text-center" style={{ color: 'var(--text-mute)' }}>
                🛠 Quick Login (dev only)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_LOGINS.map(q => (
                  <button
                    key={q.username}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleQuickLogin(q.username)}
                    className="flex flex-col items-center px-2 py-2 text-xs rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-50"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
                  >
                    <span className="text-base mb-0.5">{q.icon}</span>
                    {q.label}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-mute)' }}>
                รหัสผ่าน: password123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
