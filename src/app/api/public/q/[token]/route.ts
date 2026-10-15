import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensurePaymentToken } from '@/lib/public-token'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const pt = await prisma.publicToken.findUnique({
    where: { token },
    include: {
      job: {
        include: {
          branch: { select: { name: true, phone: true, storeManagerName: true } },
          vendorCenter: {
            include: { vendorParent: { select: { name: true } } },
          },
          events: {
            include: { attachments: true },
            orderBy: { createdAt: 'asc' },
          },
          charges: {
            where: { type: 'OPERATION_FEE' },
            select: { amount: true },
          },
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
  const operationFeePaid = job.charges.reduce((s, c) => s + c.amount, 0)

  // Collect photos from triage/inspection events
  const photos: string[] = []
  job.events.forEach(e => {
    e.attachments.forEach(a => {
      if (a.fileUrl && !photos.includes(a.fileUrl)) {
        photos.push(a.fileUrl)
      }
    })
  })

  let payUrl: string | null = null
  if (quote.status === 'APPROVED' && quote.total > 0) {
    const payToken = await ensurePaymentToken(job.id)
    payUrl = `/pay/${payToken}`
  }

  return NextResponse.json({
    job: {
      id: job.id,
      jobNo: job.jobNo,
      productName: job.productName,
      brandName: job.brandName,
      serialNo: job.serialNo,
      symptom: job.symptom,
      shippingMethod: job.shippingMethod,
      openedAt: job.openedAt,
      operationFeePaid,
      branchName: job.branch.name,
      branchPhone: job.branch.phone,
      storeManagerName: job.branch.storeManagerName,
      vendorName: job.vendorCenter ? `${job.vendorCenter.vendorParent.name} (${job.vendorCenter.code})` : null,
      customerName: job.customerName,
      hasWarranty: job.hasWarranty,
      version: job.version,
      stage: job.stage,
    },
    quote: {
      quoteNo: quote.quoteNo,
      version: quote.version,
      subtotal: quote.subtotal,
      vatAmount: quote.vatAmount,
      total: quote.total,
      repairDays: quote.repairDays,
      repairWarrantyDays: quote.repairWarrantyDays,
      vendorNote: quote.vendorNote,
      sentAt: quote.sentAt,
      expiresAt: quote.expiresAt,
      managerSignatureUrl: quote.managerSignatureUrl,
      managerSignerName: quote.managerSignerName,
      isManagerProxy: quote.isManagerProxy,
      managerSignedAt: quote.managerSignedAt,
      customerSignatureUrl: quote.customerSignatureUrl,
      customerSignedAt: quote.customerSignedAt,
      lines: quote.lines.map(l => ({
        type: l.type,
        description: l.description,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        partWaitDays: l.partWaitDays,
        partWarrantyDays: l.partWarrantyDays,
      })),
    },
    photos,
    payUrl,
    token,
    expired,
    decided,
    decision: quote.status,
  })
}
