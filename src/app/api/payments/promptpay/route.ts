import { NextRequest, NextResponse } from 'next/server'
import { generatePromptPayQR } from '@/lib/promptpay'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { amount, promptpayId, jobId } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'จำนวนเงินต้องมากกว่า 0' }, { status: 400 })
    }

    const qrResult = await generatePromptPayQR(amount, promptpayId)

    return NextResponse.json({
      amount,
      payload: qrResult.payload,
      qrDataUrl: qrResult.qrDataUrl,
      jobId,
    })
  } catch (err: any) {
    console.error('[PromptPay QR Error]', err)
    return NextResponse.json({ error: 'สร้าง QR ไม่สำเร็จ' }, { status: 500 })
  }
}
