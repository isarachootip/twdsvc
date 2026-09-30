import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeAction } from '@/lib/state-machine'
import { findToken, rateLimited, ensureTrackingToken } from '@/lib/public-token'
import { JobStage } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (await rateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { token } = await params
  const pt = await findToken(token, ['QUOTE', 'PAYMENT'])
  if (!pt) return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' }, { status: 404 })

  if (pt.expiresAt < new Date()) {
    return NextResponse.json({ error: 'ลิงก์หมดอายุแล้ว' }, { status: 400 })
  }

  const job = await prisma.job.findUnique({
    where: { id: pt.jobId },
    include: {
      charges: true,
      payments: true,
      quotes: { orderBy: { version: 'desc' }, take: 1 },
    },
  })

  if (!job) return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  // If job is in WAITING_APPROVAL, execute customer_approve first
  if (job.stage === JobStage.WAITING_APPROVAL) {
    const approveRes = await executeAction(
      job.id,
      'customer_approve',
      {
        version: body?.version !== undefined ? Number(body.version) : job.version,
        note: 'อนุมัติการซ่อมและชำระเงินผ่านลิงก์ลูกค้า',
      },
      { userId: null, role: 'CUSTOMER' }
    )
    if (!approveRes.success) {
      return NextResponse.json({ error: approveRes.error }, { status: approveRes.status ?? 400 })
    }
  }

  // Reload job after approval to get latest charges
  const freshJob = await prisma.job.findUnique({
    where: { id: job.id },
    include: { charges: true, payments: true },
  })
  if (!freshJob) return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })

  const totalCharges = freshJob.charges.reduce((s, c) => s + c.amount, 0)
  const totalPaid = freshJob.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const balance = totalCharges - totalPaid

  if (balance <= 0) {
    const trackingToken = await ensureTrackingToken(job.id)
    return NextResponse.json({
      success: true,
      paidAmount: 0,
      balance: 0,
      trackingUrl: `/t/${trackingToken}`,
      message: 'งานนี้ชำระเงินครบถ้วนแล้ว',
    })
  }

  const amountToPay = body.amount !== undefined ? Math.round(Number(body.amount)) : balance
  if (amountToPay <= 0 || amountToPay > balance) {
    return NextResponse.json({ error: `ยอดชำระต้องไม่เกินยอดค้าง ฿${balance.toLocaleString()}` }, { status: 400 })
  }

  const rawMethod = String(body.paymentMethod ?? body.method ?? 'PROMPTPAY_QR').toUpperCase()
  const method = rawMethod === 'CARD' || rawMethod === 'CARD_LINK' ? 'CARD_LINK' : 'PROMPTPAY_QR'

  const payRes = await executeAction(
    job.id,
    'record_repair_payment',
    {
      amount: amountToPay,
      paymentMethod: method,
      posReceiptNo: body.posReceiptNo || `ONLINE-${Date.now().toString(36).toUpperCase()}`,
      note: body.note || (method === 'CARD_LINK' ? 'ชำระผ่านบัตรเครดิตออนไลน์' : 'ชำระผ่าน PromptPay QR ออนไลน์'),
    },
    { userId: null, role: 'CUSTOMER' }
  )

  if (!payRes.success) {
    return NextResponse.json({ error: payRes.error }, { status: payRes.status ?? 400 })
  }

  const trackingToken = await ensureTrackingToken(job.id)

  return NextResponse.json({
    success: true,
    paidAmount: amountToPay,
    remainingBalance: Math.max(0, balance - amountToPay),
    trackingToken,
    trackingUrl: `/t/${trackingToken}`,
    job: payRes.job,
  })
}
