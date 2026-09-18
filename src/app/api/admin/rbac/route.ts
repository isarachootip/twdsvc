import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'

const MENU_KEYS = ['exec', 'analytics', 'jobs', 'cs', 'gr', 'dc', 'vd', 'tradein', 's2', 'vd_payment', 'admin']
const ROLES: Role[] = ['CS', 'GR', 'DC', 'VD', 'S2', 'ADMIN', 'EXECUTIVE']

export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const perms = await prisma.roleMenuPermission.findMany({
    where: { menuKey: { in: MENU_KEYS }, role: { in: ROLES } },
  })

  return NextResponse.json({ perms, menuKeys: MENU_KEYS, roles: ROLES })
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const updates: Array<{ menuKey: string; role: Role; canAccess: boolean; canWrite: boolean }> =
      await req.json()

    const results = await prisma.$transaction(
      updates.map((u) =>
        prisma.roleMenuPermission.upsert({
          where: { menuKey_role: { menuKey: u.menuKey, role: u.role } },
          update: { canAccess: u.canAccess, canWrite: u.canWrite },
          create: { menuKey: u.menuKey, role: u.role, canAccess: u.canAccess, canWrite: u.canWrite },
        })
      )
    )

    return NextResponse.json(results)
  } catch (e) {
    console.error('[PUT /api/admin/rbac]', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
