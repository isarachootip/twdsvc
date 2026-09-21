import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensurePaymentToken, ensureCsatToken } from '@/lib/public-token'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const pt = await prisma.publicToken.findUnique({
    where: { token },
    include: {
      job: {
        include: {
          branch: { select: { name: true, phone: true } },
          charges: true,
          payments: true,
          events: {
            orderBy: { createdAt: 'asc' },
            select: {
              type: true,
              fromStage: true,
              toStage: true,
              note: true,
              createdAt: true,
            },
          },
          quotes: {
            where: { status: { in: ['SENT', 'APPROVED', 'REJECTED'] } },
            orderBy: { version: 'desc' },
            take: 1,
            select: { quoteNo: true, status: true, total: true, repairDays: true },
          },
          publicTokens: {
            where: { type: 'QUOTE' },
            take: 1,
          },
        },
      },
    },
  })

  if (!pt || pt.type !== 'TRACKING') {
    return NextResponse.json({ error: 'Tracking link not found or expired' }, { status: 404 })
  }

  const job = pt.job
  const quoteToken = job.publicTokens[0]?.token
  const activeQuote = job.quotes[0]

  // F13-T03: Mask phone number (0812345678 -> 081-xxx-678)
  const rawPhone = job.customerPhone ? job.customerPhone.replace(/\D/g, '') : ''
  const maskedPhone = rawPhone.length >= 10
    ? `${rawPhone.slice(0, 3)}-xxx-${rawPhone.slice(7)}`
    : rawPhone

  // Mask internal remarks from events
  const publicEvents = job.events.map((e) => ({
    type: e.type,
    fromStage: e.fromStage,
    toStage: e.toStage,
    note: e.note ? e.note.replace(/\[internal\].*?(\]|$)/gi, '').trim() : null,
    createdAt: e.createdAt,
  }))

  // Estimate completion date
  const repairDays = activeQuote?.repairDays ?? 7
  const estimatedCompletionDate = new Date(new Date(job.openedAt).getTime() + (repairDays + 3) * 86400000)

  // Balance & payUrl
  const totalCharges = job.charges.reduce((s, c) => s + c.amount, 0)
  const totalPaid = job.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const balance = Math.max(0, totalCharges - totalPaid)

  let payUrl: string | null = null
  if (balance > 0 && ['REPAIRING', 'READY_FOR_PICKUP'].includes(job.stage)) {
    const payToken = await ensurePaymentToken(job.id)
    payUrl = `/pay/${payToken}`
  }

  let csatUrl: string | null = null
  if (['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'].includes(job.stage)) {
    const csatToken = await ensureCsatToken(job.id)
    csatUrl = `/s/${csatToken}`
  }

  return NextResponse.json({
    jobNo: job.jobNo,
    productName: job.productName,
    brandName: job.brandName,
    customerName: job.customerName,
    customerPhone: maskedPhone,
    stage: job.stage,
    symptom: job.symptom,
    hasWarranty: job.hasWarranty,
    openedAt: job.openedAt,
    estimatedCompletionDate,
    branchName: job.branch.name,
    branchPhone: job.branch.phone,
    events: publicEvents,
    balance,
    payUrl,
    csatUrl,
    activeQuote: activeQuote
      ? {
          ...activeQuote,
          quoteUrl: quoteToken ? `/q/${quoteToken}` : null,
        }
      : null,
  })
}
