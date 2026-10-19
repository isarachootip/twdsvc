import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError } from '@/lib/api'

// GET /api/customers/lookup?phone=08xxxxxxxx → ข้อมูลลูกค้าจากงานล่าสุด (auto-fill)
export async function GET(req: NextRequest) {
  try {
    await requireUser(['CS', 'ADMIN'], req)
    const phone = (new URL(req.url).searchParams.get('phone') ?? '').replace(/\D/g, '')
    if (phone.length < 9) return NextResponse.json(null)
    const job = await prisma.job.findFirst({
      where: { customerPhone: phone, type: 'CUSTOMER' },
      orderBy: { openedAt: 'desc' },
      select: { customerName: true, customerPhone: true, customerAddress: true, customerZip: true, taxInvoiceName: true, taxInvoiceId: true, taxInvoiceAddr: true, openedAt: true },
    })
    if (!job) return NextResponse.json(null)
    const count = await prisma.job.count({ where: { customerPhone: phone } })
    return NextResponse.json({ ...job, jobCount: count })
  } catch (e) {
    return handleError(e)
  }
}
