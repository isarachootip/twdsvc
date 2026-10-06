import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, handleError, HttpError } from '@/lib/api'
import {
  getVendorApplication,
  approveVendorApplication,
  rejectVendorApplication,
} from '@/lib/services/vendor-application.service'
import { sendApprovalEmail } from '@/lib/services/vendor-notify.service'

export const dynamic = 'force-dynamic'

const decisionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('APPROVE') }),
  z.object({ action: z.literal('REJECT'), reason: z.string().trim().min(1, 'กรุณาระบุเหตุผลการปฏิเสธ').max(1000) }),
])

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(['ADMIN'], req)
    const { id } = await params
    const app = await getVendorApplication(id)
    if (!app) throw new HttpError(404, 'ไม่พบใบสมัคร')
    return NextResponse.json(app)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['ADMIN'], req)
    const { id } = await params
    const parsed = decisionSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'การกระทำไม่ถูกต้อง (ต้องเป็น APPROVE หรือ REJECT)')
    }

    if (parsed.data.action === 'APPROVE') {
      const { application, credentials } = await approveVendorApplication(id, user.id)
      const email = await sendApprovalEmail(application.email, application.storeName, credentials)
      return NextResponse.json({ ok: true, result: application, credentials, email })
    }
    const result = await rejectVendorApplication(id, parsed.data.reason, user.id)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return handleError(error)
  }
}
