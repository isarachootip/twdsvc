import { NextRequest, NextResponse } from 'next/server'
import { requireUser, assertJobInScope, handleError } from '@/lib/api'
import { ensurePaymentToken } from '@/lib/public-token'

// POST → { payUrl } ลิงก์ชำระเงินสำหรับลูกค้า (QR PromptPay / บัตร)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['CS', 'ADMIN'], req)
    const { id } = await params
    await assertJobInScope(user, id)
    const token = await ensurePaymentToken(id)
    return NextResponse.json({ payUrl: `/pay/${token}`, token })
  } catch (e) {
    return handleError(e)
  }
}
