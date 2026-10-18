import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError } from '@/lib/api'
import {
  listVendorApplications,
  createVendorApplication,
  approveVendorApplication,
} from '@/lib/services/vendor-application.service'
import { fullVendorApplicationSchema } from '@/lib/validations/vendor-setup.schema'
import { saveSignatureDataUrl } from '@/lib/services/file-storage.service'
import { VendorApplicationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get('status') as VendorApplicationStatus | null
    const validStatus = statusParam && Object.values(VendorApplicationStatus).includes(statusParam)
      ? statusParam
      : undefined

    const applications = await listVendorApplications(validStatus)
    return NextResponse.json(applications)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['ADMIN'], req)
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { autoApprove, ...formData } = (body as Record<string, unknown>) || {}
    const validation = fullVendorApplicationSchema.safeParse(formData)
    if (!validation.success) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten() }, { status: 400 })
    }

    const data = validation.data
    data.agreements.signatureUrl = await saveSignatureDataUrl(data.agreements.signatureUrl)
    const app = await createVendorApplication(data)

    if (autoApprove) {
      const { application, credentials } = await approveVendorApplication(app.id, user.id)
      return NextResponse.json({
        ok: true,
        directApproved: true,
        applicationNo: application.applicationNo,
        id: application.id,
        status: application.status,
        estimatedTier: application.estimatedTier,
        score: application.score,
        credentials,
      }, { status: 201 })
    }

    return NextResponse.json({
      ok: true,
      directApproved: false,
      applicationNo: app.applicationNo,
      id: app.id,
      status: app.status,
      estimatedTier: app.estimatedTier,
      score: app.score,
    }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
