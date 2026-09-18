import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

const ROLE_ROUTES: Record<string, string> = {
  ADMIN: '/exec',
  EXECUTIVE: '/exec',
  CS: '/cs',
  GR: '/gr',
  DC: '/dc',
  VD: '/vd',
  S2: '/s2',
}

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  redirect(ROLE_ROUTES[user.role] ?? '/jobs')
}
