export type VendorTier = 'STANDARD' | 'PRO' | 'VIP'

export interface TierCalculationInput {
  branchesCount: number
  avgRadius: number
  hasVipBranch: boolean
  hasExpressBranch: boolean
  applianceCount: number
  coverageCount: number
  hasCompanyDoc: boolean
  hasTechLicense: boolean
  hasPortfolio: boolean
  isBrandAuthorized: boolean
}

export interface TierCalculationResult {
  score: number
  tier: VendorTier
  tierLabel: string
  estimatedCases: number
  benefits: string[]
}

export function calculateVendorScoreAndTier(input: TierCalculationInput): TierCalculationResult {
  let score = 20 // baseline score

  // Branch score (max 25)
  score += Math.min(25, input.branchesCount * 8)

  // Appliance capabilities (max 20)
  score += Math.min(20, input.applianceCount * 4)

  // SVC Coverage coverage (max 25)
  score += Math.min(25, Math.round(input.coverageCount * 0.35))

  // Extra qualifications (max 30)
  if (input.hasTechLicense) score += 10
  if (input.hasPortfolio) score += 5
  if (input.hasCompanyDoc) score += 5
  if (input.isBrandAuthorized) score += 10
  if (input.hasVipBranch) score += 5
  if (input.hasExpressBranch) score += 5

  score = Math.min(100, Math.max(0, score))

  let tier: VendorTier = 'STANDARD'
  let tierLabel = 'Standard'
  const benefits = ['รับงานซ่อมทั่วไปตามมาตรฐาน SVC', 'ระบบรับประกันงานซ่อม 90 วัน']

  if (score >= 80) {
    tier = 'VIP'
    tierLabel = 'VIP Partner'
    benefits.unshift(
      'รับงานติดตั้งและโครงการพิเศษ',
      'รับประกันโควตางานรายเดือน',
      'รับงานด่วน Express ภายใน 24-48 ชม.'
    )
  } else if (score >= 60) {
    tier = 'PRO'
    tierLabel = 'Pro Partner'
    benefits.unshift(
      'ได้รับงาน Express 48 ชม.',
      'Priority คิวจ่ายงานลำดับแรกในพื้นที่'
    )
  }

  // Estimated monthly cases formula
  const estimatedCases = Math.max(
    5,
    Math.round(
      input.coverageCount * 2.5 +
      input.avgRadius * 0.6 +
      input.branchesCount * 6
    )
  )

  return {
    score,
    tier,
    tierLabel,
    estimatedCases,
    benefits,
  }
}
