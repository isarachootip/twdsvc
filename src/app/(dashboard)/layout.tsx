import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { menusForRole } from '@/lib/menus'
import AppShell from '@/components/layout/AppShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const menus = await menusForRole(user.role)
  return <AppShell user={user} menus={menus}>{children}</AppShell>
}
