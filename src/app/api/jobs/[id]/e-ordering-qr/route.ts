import { NextRequest, NextResponse } from 'next/server'
import { requireUser, assertJobInScope, handleError, HttpError } from '@/lib/api'
import { EOrderingCreateQrRequestSchema } from '@/lib/validations/eordering.schema'
import { requestEOrderingQr } from '@/lib/services/eordering.service'

/**
 * POST /api/jobs/[id]/e-ordering-qr
 * ส่งเลขที่ Job, รายการที่สั่งซื้อ และจำนวนเงินไปยังระบบ E-ordering เพื่อขอสร้าง QR Code ชำระเงิน
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser(['CS', 'ADMIN'], req)
    const { id } = await params
    await assertJobInScope(user, id)

    const rawBody: unknown = await req.json().catch(() => ({}))
    const parsed = EOrderingCreateQrRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลคำขอไม่ถูกต้อง')
    }

    const result = await requestEOrderingQr(id, parsed.data.kind, {
      forceNew: parsed.data.forceNew,
      actorUserId: user.id,
      actorRole: user.role,
      req,
    })

    return NextResponse.json(result)
  } catch (e) {
    return handleError(e)
  }
}
