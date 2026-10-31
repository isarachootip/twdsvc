export interface VendorRateItem {
  serviceType: 'CARRY_IN' | 'ON_SITE'
  groupName: string
  minInspectionFee: number
  gpPct: number
}

export interface VendorParentRateContext {
  defaultGpPct: number
  inspectionFeeCovered: number
  inspectionFeeNotCovered: number
  productRates?: VendorRateItem[]
}

export interface ResolveVendorRateParams {
  vendorParent: VendorParentRateContext
  gpPctOverride?: number | null
  hasWarranty?: boolean
  productGroupName?: string | null
}

export interface ResolvedVendorRate {
  inspectionFee: number
  gpPct: number
  matchedGroupName: string | null
  matchedServiceType: 'CARRY_IN' | 'ON_SITE' | null
}

export function isVendorEligibleForProductGroup(
  productRates: Array<{ groupName: string }> | undefined | null,
  productGroupName?: string | null
): boolean {
  const cleanGroup = (productGroupName ?? '').trim()
  if (!cleanGroup) return true
  if (!productRates || productRates.length === 0) return true
  return productRates.some(r => r.groupName.trim() === cleanGroup)
}

export function resolveVendorGroupRate(params: ResolveVendorRateParams): ResolvedVendorRate {
  const { vendorParent, gpPctOverride, hasWarranty = false, productGroupName } = params
  const cleanGroup = (productGroupName ?? '').trim()
  const rates = vendorParent.productRates ?? []

  let matched: VendorRateItem | undefined
  if (cleanGroup && rates.length > 0) {
    const groupMatches = rates.filter(r => r.groupName.trim() === cleanGroup)
    matched =
      groupMatches.find(r => r.serviceType === 'CARRY_IN') ??
      groupMatches.find(r => r.serviceType === 'ON_SITE')
  }

  const inspectionFee = hasWarranty
    ? vendorParent.inspectionFeeCovered
    : (matched ? matched.minInspectionFee : vendorParent.inspectionFeeNotCovered)

  const gpPct =
    gpPctOverride !== null && gpPctOverride !== undefined
      ? gpPctOverride
      : (matched ? matched.gpPct : vendorParent.defaultGpPct)

  return {
    inspectionFee,
    gpPct,
    matchedGroupName: matched?.groupName ?? null,
    matchedServiceType: matched?.serviceType ?? null,
  }
}
