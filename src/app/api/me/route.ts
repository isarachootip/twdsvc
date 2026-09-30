import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { menusForRole } from '@/lib/menus'
import { canViewCost, getSetting } from '@/lib/settings'

export async function GET(req: Request) {
  const user = await getCurrentUser(req)
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
