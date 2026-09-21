import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { menusForRole } from '@/lib/menus'
import { canViewCost, getSetting } from '@/lib/settings'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [menus, cost, demo] = await Promise.all([
    menusForRole(user.role),
    canViewCost(user.role),
    getSetting('DEMO_MODE'),
  ])

  return NextResponse.json({
    user,
    menus,
    canViewCost: cost,
    demoMode: demo !== 'false',
  })
}
