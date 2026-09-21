import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateJobNo } from '@/lib/number-generator'
import { slaOnEvent } from '@/lib/sla-engine'
import { JobType, JobStage, Channel } from '@prisma/client'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['S2', 'ADMIN'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { vendorCenterId, receiverName, channel, items } = await req.json()

    if (!vendorCenterId || !receiverName || !items?.length)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    let branchId = user.siteId ?? ''
    if (!branchId) {
      const firstBranch = await prisma.site.findFirst({ where: { type: 'BRANCH' } })
      branchId = firstBranch?.id ?? ''
    }
    if (!branchId)
      return NextResponse.json({ error: 'ไม่พบข้อมูลสาขา' }, { status: 400 })

    const jobNo = await generateJobNo('STOCK')
    const now = new Date()

    const job = await prisma.$transaction(async (tx) => {
      const newJob = await tx.job.create({
        data: {
          jobNo,
          type: JobType.STOCK,
          stage: JobStage.CS_OPENED,
          channel: channel as Channel,
          branchId,
          vendorCenterId,
          receiverName,
          productName: items[0]?.productName ?? 'สินค้าสต็อก',
          brandName: '-',
          createdBy: user.username,
          items: {
            create: items.map((item: { sku: string; productName: string; quantity?: number; holdStockNo?: string; symptom?: string }) => ({
              sku: item.sku,
              productName: item.productName,
              quantity: item.quantity ?? 1,
              holdStockNo: item.holdStockNo || null,
              symptom: item.symptom ?? '',
            })),
          },
        },
        include: { items: true, vendorCenter: { select: { code: true, vendorParent: { select: { name: true } } } } },
      })

      // Create JOB_OPENED event
      await tx.jobEvent.create({
        data: {
          jobId: newJob.id,
          type: 'JOB_OPENED',
          toStage: JobStage.CS_OPENED,
          actorUserId: user.id,
          actorRole: user.role,
        },
      })

      // SLA clock creation (C3)
      await slaOnEvent(tx, { id: newJob.id, type: 'STOCK', channel: newJob.channel, vendorCenterId: newJob.vendorCenterId }, 'JOB_OPENED', now)

      return newJob
    })

    return NextResponse.json(job, { status: 201 })
  } catch (e) {
    console.error('[POST /api/jobs/stock]', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
