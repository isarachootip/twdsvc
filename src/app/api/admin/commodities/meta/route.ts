import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN', 'CS', 'EXECUTIVE', 'GR', 'DC', 'VD', 'S2'], req)

    // Top brands and distinct departments
    const [brandRows, deptRows] = await Promise.all([
      prisma.$queryRaw<{ brand: string; count: bigint }[]>`
        SELECT brand, COUNT(*)::bigint as count
        FROM commodities
        WHERE brand IS NOT NULL AND brand != ''
        GROUP BY brand
        ORDER BY count DESC
        LIMIT 100
      `,
      prisma.$queryRaw<{ deptName: string }[]>`
        SELECT DISTINCT "deptName"
        FROM commodities
        WHERE "deptName" IS NOT NULL AND "deptName" != ''
        ORDER BY "deptName" ASC
      `,
    ])

    const brands = brandRows.map(r => r.brand)
    const departments = deptRows.map(r => r.deptName)

    return NextResponse.json({
      brands,
      departments,
    })
  } catch (e) {
    return handleError(e)
  }
}
