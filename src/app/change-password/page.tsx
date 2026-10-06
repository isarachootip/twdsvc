import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'

export const metadata = { title: 'เปลี่ยนรหัสผ่าน | SVC' }
export const dynamic = 'force-dynamic'

export default async function ChangePasswordPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/change-password')

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block px-6 py-3 rounded-xl text-white font-bold text-lg mb-2" style={{ background: 'var(--red)' }}>
            THAIWASADU
          </div>
          <div className="text-sm" style={{ color: 'var(--text-2)' }}>{user.fullName}</div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--text)' }}>เปลี่ยนรหัสผ่าน</h2>
          <ChangePasswordForm forced={Boolean(user.mustChangePassword)} />
        </div>
      </div>
    </div>
  )
}
