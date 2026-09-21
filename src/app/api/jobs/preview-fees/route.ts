import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError } from '@/lib/api'
import { calcIntakeFees } from '@/lib/fees'

// POST /api/jobs/preview-fees { sizeCategoryId, hasWarranty, shippingMethod }
export async function POST(req: NextRequest) {
  try {
    await requireUser()
    const { sizeCategoryId, hasWarranty, shippingMethod } = await req.json()
    if (!sizeCategoryId) return NextResponse.json({ operationFee: 0, shippingFee: 0, total: 0, rates: null })
    const feeRate = await prisma.feeRate.findFirst({
      where: { sizeCategoryId: Number(sizeCategoryId), effectiveFrom: { lte: new Date() } },
      orderBy: [{ effectiveFrom: 'desc' }, { id: 'desc' }],
    })
    const rates = { operationFee: feeRate?.operationFee ?? 0, shippingFee3pl: feeRate?.shippingFee3pl ?? 0 }
    const fees = calcIntakeFees({ jobType: 'CUSTOMER', hasWarranty: !!hasWarranty, shippingMethod: shippingMethod === 'EXPRESS' ? 'EXPRESS' : 'STANDARD', feeRate: rates })
    return NextResponse.json({ ...fees, rates })
  } catch (e) {
    return handleError(e)
  }
}
