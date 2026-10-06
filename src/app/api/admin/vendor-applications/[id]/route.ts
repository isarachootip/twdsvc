import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'
import {
  getVendorApplication,
  approveVendorApplication,
  rejectVendorApplication,
} from '@/lib/services/vendor-application.service'

export const dynamic = 'force-dynamic'

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
    const body = await req.json()
    const { action, reason } = body

    if (action === 'APPROVE') {
      const result = await approveVendorApplication(id, user.id)
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'REJECT') {
      if (!reason?.trim()) throw new HttpError(400, 'กรุณาระบุเหตุผลการปฏิเสธ')
      const result = await rejectVendorApplication(id, reason.trim(), user.id)
      return NextResponse.json({ ok: true, result })
    }

    throw new HttpError(400, 'การกระทำไม่ถูกต้อง (ต้องเป็น APPROVE หรือ REJECT)')
  } catch (error) {
    return handleError(error)
  }
}
