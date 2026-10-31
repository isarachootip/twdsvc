import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError } from '@/lib/api'
import { listVendorServiceGroups } from '@/lib/services/vendor-product-group.service'
import { deduplicateActiveProductTypes } from '@/lib/services/product-type-matcher'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireUser(undefined, req)
    const groups = await listVendorServiceGroups({ activeOnly: true })
    return NextResponse.json(deduplicateActiveProductTypes(groups))
  } catch (error) {
    return handleError(error)
  }
}
