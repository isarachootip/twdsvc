import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError } from '@/lib/api'
import { customerLookupQuerySchema } from '@/lib/validations/customer'
import {
  lookupCustomerByExactPhone,
  lookupCustomersByPhonePrefix,
} from '@/lib/services/customer-service'

// GET /api/customers/lookup?phone=08xxxxxxxx → ข้อมูลลูกค้าจากงานล่าสุด (auto-fill)
// GET /api/customers/lookup?q=081...         → รายการแนะนำเบอร์โทรลูกค้า (autocomplete)
export async function GET(req: NextRequest) {
  try {
    await requireUser(['CS', 'ADMIN'], req)
    const url = new URL(req.url)
    const parsed = customerLookupQuerySchema.parse({
      phone: url.searchParams.get('phone') ?? '',
      q: url.searchParams.get('q') ?? '',
      limit: url.searchParams.get('limit') ?? '6',
    })

    if (parsed.q.length >= 3) {
      const candidates = await lookupCustomersByPhonePrefix(parsed.q, parsed.limit)
      return NextResponse.json({ candidates })
    }

    if (parsed.phone.length < 9) {
      return NextResponse.json(null)
    }

    const exact = await lookupCustomerByExactPhone(parsed.phone)
    return NextResponse.json(exact)
  } catch (e) {
    return handleError(e)
  }
}
