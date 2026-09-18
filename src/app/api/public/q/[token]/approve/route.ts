import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { QuoteStatus, JobStage, QuoteDecision } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const pt = await prisma.publicToken.findUnique({
    where: { token },
    include: {
      job: {
        include: {
          quotes: { orderBy: { version: 'desc' }, take: 1 },
        },
      },
    },
  })

  if (!pt || pt.type !== 'QUOTE' || pt.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Token invalid or expired' }, { status: 400 })
  }

  const job = pt.job
  const quote = job.quotes[0]
  if (!quote) return NextResponse.json({ error: 'No quote found' }, { status: 404 })
  if (['APPROVED', 'REJECTED'].includes(quote.status)) {
    return NextResponse.json({ error: 'Quote already decided' }, { status: 400 })
  }

  // Update quote + job stage
  await prisma.$transaction([
    prisma.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.APPROVED, decidedAt: new Date() } }),
    prisma.job.update({
      where: { id: job.id },
      data: {
        stage: JobStage.REPAIRING,
        decision: QuoteDecision.APPROVED,
        stageEnteredAt: new Date(),
        version: { increment: 1 },
      },
    }),
    prisma.jobEvent.create({
      data: {
        jobId: job.id, type: 'CUSTOMER_APPROVED',
        fromStage: JobStage.WAITING_APPROVAL,
        toStage: JobStage.REPAIRING,
        actorRole: 'CUSTOMER',
      },
    }),
    prisma.publicToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ])

  return NextResponse.json({ success: true })
}
