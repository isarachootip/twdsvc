import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { findToken, rateLimited, ensureTrackingToken } from '@/lib/public-token'
import { getSetting } from '@/lib/settings'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (rateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const { token } = await params
  const pt = await findToken(token, ['PAYMENT', 'QUOTE'])
  if (!pt) return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้อง' }, { status: 404 })
  const job = await prisma.job.findUnique({
    where: { id: pt.jobId },
    include: {
      charges: true,
      payments: { orderBy: { createdAt: 'desc' } },
      branch: { select: { name: true, phone: true } },
    },
  })
  if (!job) return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })
  const balance = job.charges.reduce((s, c) => s + c.amount, 0) - job.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const demo = (await getSetting('DEMO_MODE')) !== 'false'
  const trackingToken = await ensureTrackingToken(job.id)

  const lastPayment = job.payments.find(p => p.status === 'PAID')

  return NextResponse.json({
    jobNo: job.jobNo,
    productName: job.productName,
    brandName: job.brandName,
    branchName: job.branch.name,
    branchPhone: job.branch.phone,
    balance: Math.max(0, balance),
    paid: balance <= 0,
    expired: pt.expiresAt < new Date(),
    lines: job.charges.map(c => ({ description: c.description ?? c.type, amount: c.amount })),
    paidAmount: job.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0),
    lastPayment: lastPayment ? {
      amount: lastPayment.amount,
      method: lastPayment.method,
      receivedAt: lastPayment.receivedAt,
      posReceiptNo: lastPayment.posReceiptNo,
    } : null,
    trackingToken,
    trackingUrl: `/t/${trackingToken}`,
    demoMode: demo,
  })
}

