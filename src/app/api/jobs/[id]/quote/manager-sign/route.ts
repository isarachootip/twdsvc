import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const signActionSchema = z.object({
  action: z.literal('sign').default('sign'),
  signatureUrl: z.string().min(1, 'กรุณาลงลายมือชื่อ'),
  signerName: z.string().min(1, 'กรุณาระบุชื่อผู้ลงนาม'),
  isProxy: z.boolean().default(false),
})

const requestRevisionSchema = z.object({
  action: z.literal('request_revision'),
  reason: z.string().min(1, 'กรุณาระบุเหตุผลที่ส่งกลับให้ช่างประเมินใหม่'),
})

const rejectActionSchema = z.object({
  action: z.literal('reject'),
  reason: z.string().min(1, 'กรุณาระบุเหตุผลที่ไม่อนุมัติ'),
})

const managerReviewSchema = z.union([
  signActionSchema,
  requestRevisionSchema,
  rejectActionSchema,
])

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['CS', 'ADMIN', 'EXECUTIVE'], req)
    const { id } = await params

    const rawBody = await req.json().catch(() => ({}))
    const bodyWithDefault = typeof rawBody === 'object' && rawBody !== null && !rawBody.action
      ? { ...rawBody, action: 'sign' }
      : rawBody

    const parsed = managerReviewSchema.safeParse(bodyWithDefault)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง')
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        branch: true,
        quotes: {
          where: { status: { in: ['SENT', 'APPROVED'] } },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    })

    if (!job) throw new HttpError(404, 'ไม่พบงานแจ้งซ่อม')

    if (user.role === 'CS' && user.siteId && job.branchId !== user.siteId) {
      throw new HttpError(403, 'ไม่มีสิทธิ์เข้าถึงงานของสาขาอื่น')
    }

    const quote = job.quotes[0]
    if (!quote) {
      throw new HttpError(400, 'ไม่พบใบเสนอราคาที่รอลงนาม')
    }

    const data = parsed.data
    const now = new Date()

    const updatedQuote = await prisma.$transaction(async (tx) => {
      if (data.action === 'sign') {
        const isZeroTotal = quote.total === 0
        const q = await tx.quote.update({
          where: { id: quote.id },
          data: {
            managerSignatureUrl: data.signatureUrl,
            managerSignerName: data.signerName,
            isManagerProxy: data.isProxy,
            managerSignedAt: now,
            ...(isZeroTotal ? { status: 'APPROVED', decidedAt: now } : {}),
          },
          include: { lines: true },
        })

        if (isZeroTotal) {
          await tx.job.update({
            where: { id: job.id },
            data: {
              stage: 'REPAIRING',
              decision: 'AUTO_APPROVED',
              stageEnteredAt: now,
            },
          })
          await tx.publicToken.updateMany({
            where: { jobId: job.id, type: 'QUOTE', usedAt: null },
            data: { usedAt: now },
          })
        }

        const roleLabel = data.isProxy ? 'Manager on duty' : 'ผู้จัดการสาขา'
        const noteMsg = isZeroTotal
          ? `ผู้มีอำนาจสาขาลงนามอนุมัติใบเสนอราคา (ยอด ฿0 — ส่งซ่อมทันที): ${data.signerName} (${roleLabel})`
          : `ผู้มีอำนาจสาขาลงนามอนุมัติใบเสนอราคา: ${data.signerName} (${roleLabel})`

        await tx.jobEvent.create({
          data: {
            jobId: job.id,
            type: 'QUOTE_MANAGER_SIGNED',
            fromStage: job.stage,
            toStage: isZeroTotal ? 'REPAIRING' : job.stage,
            actorUserId: user.id,
            actorRole: user.role,
            note: noteMsg,
          },
        })

        return q
      }

      if (data.action === 'request_revision') {
        const q = await tx.quote.update({
          where: { id: quote.id },
          data: { status: 'SUPERSEDED' },
          include: { lines: true },
        })

        await tx.publicToken.updateMany({
          where: { jobId: job.id, type: 'QUOTE', usedAt: null },
          data: { usedAt: now },
        })

        await tx.job.update({
          where: { id: job.id },
          data: { stage: 'VD_INSPECTING', stageEnteredAt: now },
        })

        await tx.jobEvent.create({
          data: {
            jobId: job.id,
            type: 'QUOTE_REVISION_REQUESTED',
            fromStage: job.stage,
            toStage: 'VD_INSPECTING',
            actorUserId: user.id,
            actorRole: user.role,
            note: `ผจก. สาขาส่งกลับให้ช่างประเมินใหม่: ${data.reason}`,
          },
        })

        return q
      }

      // data.action === 'reject'
      const q = await tx.quote.update({
        where: { id: quote.id },
        data: { status: 'REJECTED', decidedAt: now },
        include: { lines: true },
      })

      await tx.publicToken.updateMany({
        where: { jobId: job.id, type: 'QUOTE', usedAt: null },
        data: { usedAt: now },
      })

      await tx.job.update({
        where: { id: job.id },
        data: { stage: 'RETURN_PACKING', decision: 'REJECTED', stageEnteredAt: now },
      })

      await tx.jobEvent.create({
        data: {
          jobId: job.id,
          type: 'QUOTE_REJECTED',
          fromStage: job.stage,
          toStage: 'RETURN_PACKING',
          actorUserId: user.id,
          actorRole: user.role,
          note: `ผจก. สาขาไม่อนุมัติการซ่อม: ${data.reason}`,
        },
      })

      return q
    })

    return NextResponse.json({ success: true, quote: updatedQuote, action: data.action })
  } catch (e) {
    return handleError(e)
  }
}
