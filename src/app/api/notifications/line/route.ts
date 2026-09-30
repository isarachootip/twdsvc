import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendQuoteFlexMessage, sendJobStatusFlexMessage } from '@/lib/line'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { type, jobId, toUserId } = await req.json()

    const job = await prisma.job.findUniqueOrThrow({
      where: { id: jobId },
      include: {
        quotes: { orderBy: { version: 'desc' }, take: 1 },
        publicTokens: true,
      },
    })

    const targetUser = toUserId || job.customerPhone || 'U-CUSTOMER-LINE-ID'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    if (type === 'QUOTE') {
      const quote = job.quotes[0]
      if (!quote) return NextResponse.json({ error: 'No quote found' }, { status: 404 })

      const quoteToken = job.publicTokens.find(t => t.type === 'QUOTE')?.token || 'quote-token'
      const quoteUrl = `${baseUrl}/q/${quoteToken}`

      const result = await sendQuoteFlexMessage(targetUser, {
        jobNo: job.jobNo,
        productName: job.productName,
        brandName: job.brandName,
        totalAmount: quote.total,
        repairDays: quote.repairDays,
        quoteUrl,
      })

      return NextResponse.json(result)
    }

    if (type === 'STATUS') {
      const trackToken = job.publicTokens.find(t => t.type === 'TRACKING')?.token || 'track-token'
      const trackingUrl = `${baseUrl}/t/${trackToken}`

      const result = await sendJobStatusFlexMessage(targetUser, {
        jobNo: job.jobNo,
        productName: job.productName,
        stageName: job.stage,
        trackingUrl,
      })

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
  } catch (err: any) {
    console.error('[Notification Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
