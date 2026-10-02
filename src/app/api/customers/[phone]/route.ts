import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError } from '@/lib/api'
import { customerPhoneParamSchema } from '@/lib/validations/customer'
import { getCustomerDetail } from '@/lib/services/customer-service'

// GET /api/customers/[phone]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    await requireUser(['CS', 'ADMIN', 'EXECUTIVE'], req)

    const resolvedParams = await params
    const parsed = customerPhoneParamSchema.parse(resolvedParams)
    const detail = await getCustomerDetail(parsed.phone)

    if (!detail) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลลูกค้าสำหรับเบอร์โทรนี้' }, { status: 404 })
    }

    return NextResponse.json(detail)
  } catch (e) {
    return handleError(e)
  }
}
