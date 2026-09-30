import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const routes = await prisma.branchVendorRoute.findMany({
      include: {
        branch: { select: { id: true, code: true, name: true } },
        dcSite: { select: { id: true, code: true, name: true } },
        primaryCenter: { select: { id: true, code: true, vendorParent: { select: { name: true } } } },
        backupCenter: { select: { id: true, code: true, vendorParent: { select: { name: true } } } },
      },
      orderBy: [{ branch: { code: 'asc' } }, { priority: 'asc' }],
    })
    return NextResponse.json(routes)
  } catch (e) {
    return handleError(e)
  }
}

interface RouteIn {
  branchId: string
  dcSiteId?: string | null
  primaryCenterId?: string | null
  backupCenterId?: string | null
  standardChannel: 'DC' | 'DSD'
}

// PUT — บันทึกการจับคู่สาขา-VD
export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const list: RouteIn[] = await req.json()
    for (const r of list) {
      if (!r.branchId) throw new HttpError(400, 'กรุณาเลือกสาขา')
      if (!r.primaryCenterId) throw new HttpError(400, 'กรุณาเลือกศูนย์ VD อันดับ 1')
    }
    const prio: Record<string, number> = {}
    await prisma.$transaction(async tx => {
      await tx.branchVendorRoute.deleteMany({})
      for (const r of list) {
        prio[r.branchId] = (prio[r.branchId] ?? 0) + 1
        await tx.branchVendorRoute.create({
          data: {
            branchId: r.branchId,
            dcSiteId: r.dcSiteId || null,
            primaryCenterId: r.primaryCenterId || null,
            backupCenterId: r.backupCenterId || null,
            standardChannel: r.standardChannel === 'DSD' ? 'DSD' : 'DC',
            priority: prio[r.branchId],
          },
        })
      }
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
