import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const managerSignSchema = z.object({
  signatureUrl: z.string().min(1, 'กรุณาลงลายมือชื่อ'),
  signerName: z.string().min(1, 'กรุณาระบุชื่อผู้ลงนาม'),
  isProxy: z.boolean().default(false),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['CS', 'ADMIN', 'EXECUTIVE'], req)
    const { id } = await params

    const body = await req.json().catch(() => ({}))
    const parsed = managerSignSchema.safeParse(body)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง')
    }

    const { signatureUrl, signerName, isProxy } = parsed.data

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

    // Branch tenant scoping for CS
    if (user.role === 'CS' && user.siteId && job.branchId !== user.siteId) {
      throw new HttpError(403, 'ไม่มีสิทธิ์เข้าถึงงานของสาขาอื่น')
    }

    const quote = job.quotes[0]
    if (!quote) {
      throw new HttpError(400, 'ไม่พบใบเสนอราคาที่รอลงนาม')
    }

    const updatedQuote = await prisma.$transaction(async (tx) => {
      const q = await tx.quote.update({
        where: { id: quote.id },
        data: {
          managerSignatureUrl: signatureUrl,
          managerSignerName: signerName,
          isManagerProxy: isProxy,
          managerSignedAt: new Date(),
        },
        include: { lines: true },
      })

      const roleLabel = isProxy ? 'Manager on duty' : 'ผู้จัดการสาขา'
      await tx.jobEvent.create({
        data: {
          jobId: job.id,
          type: 'QUOTE_MANAGER_SIGNED',
          fromStage: job.stage,
          toStage: job.stage,
          actorUserId: user.id,
          actorRole: user.role,
          note: `ผู้มีอำนาจสาขาลงนามอนุมัติใบเสนอราคา: ${signerName} (${roleLabel})`,
        },
      })

      return q
    })

    return NextResponse.json({ success: true, quote: updatedQuote })
  } catch (e) {
    return handleError(e)
  }
}
