import { NextRequest, NextResponse } from 'next/server'
import { fullVendorApplicationSchema } from '@/lib/validations/vendor-setup.schema'
import { createVendorApplication } from '@/lib/services/vendor-application.service'
import { rateLimited } from '@/lib/public-token'
import { saveSignatureDataUrl } from '@/lib/services/file-storage.service'

// POST /api/vendors/apply — public vendor self-registration
export async function POST(req: NextRequest) {
  if (await rateLimited(req, { bucket: 'vendor-apply', limit: 5, windowMs: 60 * 60_000 })) {
    return NextResponse.json({ error: 'ส่งใบสมัครถี่เกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = fullVendorApplicationSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten() }, { status: 400 })
  }

  try {
    const data = validation.data
    data.agreements.signatureUrl = await saveSignatureDataUrl(data.agreements.signatureUrl)
    const app = await createVendorApplication(data)

    return NextResponse.json({
      ok: true,
      applicationNo: app.applicationNo,
      id: app.id,
      status: app.status,
      estimatedTier: app.estimatedTier,
      score: app.score,
    }, { status: 201 })
  } catch (error) {
    console.error('[vendors/apply]', error)
    return NextResponse.json({ error: 'ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
