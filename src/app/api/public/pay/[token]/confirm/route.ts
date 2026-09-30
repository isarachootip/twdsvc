import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeAction } from '@/lib/state-machine'
import { findToken, rateLimited, ensureTrackingToken } from '@/lib/public-token'
import { getSetting } from '@/lib/settings'

// Mock payment provider — ใช้ได้เฉพาะเมื่อ DEMO_MODE=true (STEP-29 จะเปลี่ยนเป็น webhook ของ payment gateway)
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (await rateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  if ((await getSetting('DEMO_MODE')) === 'false') return NextResponse.json({ error: 'ระบบจะยืนยันการชำระเงินอัตโนมัติเมื่อได้รับแจ้งจากธนาคาร' }, { status: 400 })
  const { token } = await params
  const pt = await findToken(token, ['PAYMENT', 'QUOTE'])
  if (!pt || pt.expiresAt < new Date()) return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const method = body.method === 'CARD' || body.paymentMethod === 'CARD_LINK' ? 'CARD_LINK' : 'PROMPTPAY_QR'
  const job = await prisma.job.findUnique({ where: { id: pt.jobId }, select: { id: true, stage: true, version: true } })
  if (!job) return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })

  if (job.stage === 'WAITING_APPROVAL') {
    try {
      const approveRes = await executeAction(
        job.id,
        'customer_approve',
        {
          version: body?.version !== undefined ? Number(body.version) : job.version,
          note: 'อนุมัติและชำระเงินผ่านลิงก์',
        },
        { userId: null, role: 'CUSTOMER' }
      )
      if (!approveRes.success) {
        return NextResponse.json({ error: approveRes.error || 'ไม่สามารถอนุมัติงานซ่อมได้' }, { status: approveRes.status ?? 400 })
      }
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ' }, { status: 500 })
    }
  }

  const action = ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT', 'GR_RECEIVED'].includes(job.stage) ? 'record_intake_payment' : 'record_repair_payment'
  const r = await executeAction(pt.jobId, action, {
    paymentMethod: method,
    amount: body.amount ? Math.round(Number(body.amount)) : undefined,
    posReceiptNo: body.posReceiptNo || `PAY-${Date.now().toString(36).toUpperCase()}`,
    note: 'ชำระผ่านลิงก์ลูกค้า (mock gateway)',
  }, { userId: null, role: 'CUSTOMER' })

  if (!r.success) return NextResponse.json({ error: r.error }, { status: r.status ?? 400 })

  const trackingToken = await ensureTrackingToken(pt.jobId)

  return NextResponse.json({
    success: true,
    paidAmount: (r as any).extra?.paidAmount ?? 0,
    trackingToken,
    trackingUrl: `/t/${trackingToken}`,
    job: r.job,
  })
}

