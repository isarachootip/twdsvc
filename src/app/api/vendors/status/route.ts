import { NextRequest, NextResponse } from 'next/server'
import { rateLimited } from '@/lib/public-token'
import { checkVendorApplicationStatus } from '@/lib/services/vendor-application-v6.service'
import { HttpError } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (await rateLimited(req, { bucket: 'vendor-status', limit: 20, windowMs: 15 * 60_000 })) {
    return NextResponse.json({ error: 'ตรวจสอบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, { status: 400 })
  }

  const { appNo, contact } = (body as Record<string, string>) || {}
  if (!appNo || !contact) {
    return NextResponse.json({ error: 'กรุณาระบุเลขที่ใบสมัครและเบอร์โทร/อีเมล' }, { status: 400 })
  }

  try {
    const result = await checkVendorApplicationStatus(appNo, contact)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[vendors/status]', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ' }, { status: 500 })
  }
}
