import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const pt = await prisma.publicToken.findUnique({
    where: { token },
    include: {
      job: {
        include: {
          branch: { select: { name: true } },
          quotes: {
            where: { status: { in: ['SENT', 'APPROVED', 'REJECTED'] } },
            orderBy: { version: 'desc' },
            take: 1,
            include: { lines: true },
          },
        },
      },
    },
  })

  if (!pt || pt.type !== 'QUOTE') {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 })
  }

  const expired = pt.expiresAt < new Date()
  const job = pt.job
  const quote = job.quotes[0]

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const decided = ['APPROVED', 'REJECTED'].includes(quote.status)

  return NextResponse.json({
    job: {
      jobNo: job.jobNo,
      productName: job.productName,
      brandName: job.brandName,
      branchName: job.branch.name,
      customerName: job.customerName,
      hasWarranty: job.hasWarranty,
    },
    quote: {
      quoteNo: quote.quoteNo,
      subtotal: quote.subtotal,
      vatAmount: quote.vatAmount,
      total: quote.total,
      repairDays: quote.repairDays,
      repairWarrantyDays: quote.repairWarrantyDays,
      vendorNote: quote.vendorNote,
      lines: quote.lines.map(l => ({
        type: l.type,
        description: l.description,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        partWaitDays: l.partWaitDays,
      })),
    },
    token,
    expired,
    decided,
    decision: quote.status,
  })
}
