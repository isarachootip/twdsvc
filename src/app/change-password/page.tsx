import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader'

export const metadata = { title: 'เปลี่ยนรหัสผ่าน | SVC' }
export const dynamic = 'force-dynamic'

export default async function ChangePasswordPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/change-password')

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <AuthBrandHeader subtitle={user.fullName} />
        <div className="card">
          <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--text)' }}>เปลี่ยนรหัสผ่าน</h2>
          <ChangePasswordForm forced={Boolean(user.mustChangePassword)} />
        </div>
      </div>
    </div>
  )
}
