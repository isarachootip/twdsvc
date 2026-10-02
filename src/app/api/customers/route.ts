import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError } from '@/lib/api'
import { customerSearchSchema } from '@/lib/validations/customer'
import { searchCustomerDirectory } from '@/lib/services/customer-service'

// GET /api/customers?q=...&page=...&limit=...
export async function GET(req: NextRequest) {
  try {
    await requireUser(['CS', 'ADMIN', 'EXECUTIVE'], req)

    const url = new URL(req.url)
    const rawParams = {
      q: url.searchParams.get('q') ?? '',
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '20',
    }

    const parsed = customerSearchSchema.parse(rawParams)
    const result = await searchCustomerDirectory(parsed.q, parsed.page, parsed.limit)

    return NextResponse.json({
      customers: result.customers,
      total: result.total,
      page: parsed.page,
      limit: parsed.limit,
    })
  } catch (e) {
    return handleError(e)
  }
}
