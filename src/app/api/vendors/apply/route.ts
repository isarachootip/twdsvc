import { NextRequest, NextResponse } from 'next/server'
import { fullVendorApplicationSchema } from '@/lib/validations/vendor-setup.schema'
import { vendorApplicationV6Schema } from '@/lib/validations/vendor-application-v6.schema'
import { createVendorApplication } from '@/lib/services/vendor-application.service'
import { createVendorApplicationV6 } from '@/lib/services/vendor-application-v6.service'
import { rateLimited } from '@/lib/public-token'
import { saveSignatureDataUrl } from '@/lib/services/file-storage.service'

export const dynamic = 'force-dynamic'

// POST /api/vendors/apply — public vendor self-registration (supports V6 10-step & legacy)
export async function POST(req: NextRequest) {
  if (await rateLimited(req, { bucket: 'vendor-apply', limit: 10, windowMs: 60 * 60_000 })) {
    return NextResponse.json({ error: 'ส่งใบสมัครถี่เกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const isV6 = Boolean(raw && ('supplierRegistered' in raw || 'cinProducts' in raw))

  try {
    if (isV6) {
      const validation = vendorApplicationV6Schema.safeParse(body)
      if (!validation.success) {
        const issueMessages = Array.from(
          new Set(validation.error.issues.map(i => i.message).filter(Boolean))
        )
        const errorMsg = issueMessages.length > 0
          ? `ข้อมูลไม่ถูกต้อง: ${issueMessages.slice(0, 3).join(', ')}`
          : 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่กรอก'
        return NextResponse.json(
          { error: errorMsg, details: validation.error.flatten() },
          { status: 400 }
        )
      }
      const app = await createVendorApplicationV6(validation.data)
      return NextResponse.json({
        ok: true,
        applicationNo: app.applicationNo,
        id: app.id,
        status: app.status,
        company: app.storeName,
      }, { status: 201 })
    }

    const validation = fullVendorApplicationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten() }, { status: 400 })
    }

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
