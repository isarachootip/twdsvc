import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError } from '@/lib/api'
import { listVendorApplications } from '@/lib/services/vendor-application.service'
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
