import { NextResponse } from 'next/server'
import { listVendorServiceGroups } from '@/lib/services/vendor-product-group.service'

export const dynamic = 'force-dynamic'

// GET /api/vendors/product-groups — Public active product groupings for vendor.vhomesvc.online
export async function GET() {
  try {
    const groups = await listVendorServiceGroups({ activeOnly: true })
    const mapItem = (g: (typeof groups)[number]) => ({
      id: g.id,
      serviceType: g.serviceType,
      name: g.name,
      minInspectionFee: g.minInspectionFee,
      recommendedFee: g.recommendedFee,
      minGpPct: g.minGpPct,
      defaultGpPct: g.defaultGpPct,
    })

    return NextResponse.json({
      carryIn: groups.filter(g => g.serviceType === 'CARRY_IN').map(mapItem),
      onSite: groups.filter(g => g.serviceType === 'ON_SITE').map(mapItem),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
