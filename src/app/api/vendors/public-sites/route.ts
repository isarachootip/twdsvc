import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/vendors/public-sites — ดึงรายชื่อสาขา SVC 95 แห่งสำหรับหน้าลงทะเบียนคู่ค้า
export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      where: { active: true, type: 'BRANCH' },
      select: {
        id: true,
        code: true,
        nickname: true,
        name: true,
        province: true,
        region: true,
      },
      orderBy: [{ region: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(sites)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
