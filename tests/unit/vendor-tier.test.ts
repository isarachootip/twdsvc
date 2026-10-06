import { calculateVendorScoreAndTier } from '../../src/lib/services/vendor-tier.service'

function runTests() {
  console.log('Running vendor-tier.service unit tests...')

  // Test 1: Minimum baseline input
  const baseline = calculateVendorScoreAndTier({
    branchesCount: 1,
    avgRadius: 30,
    hasVipBranch: false,
    hasExpressBranch: false,
    applianceCount: 1,
    coverageCount: 1,
    hasCompanyDoc: false,
    hasTechLicense: false,
    hasPortfolio: false,
    isBrandAuthorized: false,
  })

  if (baseline.tier !== 'STANDARD') {
    throw new Error(`Expected STANDARD, got ${baseline.tier}`)
  }
  if (baseline.score < 20 || baseline.score > 55) {
    throw new Error(`Baseline score out of bounds: ${baseline.score}`)
  }
  console.log('✔ Test 1: Baseline input gives STANDARD tier, score:', baseline.score)

  // Test 2: High capability vendor gives VIP tier
  const vip = calculateVendorScoreAndTier({
    branchesCount: 4,
    avgRadius: 50,
    hasVipBranch: true,
    hasExpressBranch: true,
    applianceCount: 6,
    coverageCount: 40,
    hasCompanyDoc: true,
    hasTechLicense: true,
    hasPortfolio: true,
    isBrandAuthorized: true,
  })

  if (vip.tier !== 'VIP') {
    throw new Error(`Expected VIP, got ${vip.tier} (score: ${vip.score})`)
  }
  if (vip.score < 80) {
    throw new Error(`Expected score >= 80, got ${vip.score}`)
  }
  if (vip.estimatedCases <= baseline.estimatedCases) {
    throw new Error('VIP estimated cases should exceed baseline')
  }
  console.log('✔ Test 2: High capability vendor gives VIP tier, score:', vip.score, 'cases:', vip.estimatedCases)

  // Test 3: Score capping at 100
  const maxed = calculateVendorScoreAndTier({
    branchesCount: 10,
    avgRadius: 100,
    hasVipBranch: true,
    hasExpressBranch: true,
    applianceCount: 10,
    coverageCount: 91,
    hasCompanyDoc: true,
    hasTechLicense: true,
    hasPortfolio: true,
    isBrandAuthorized: true,
  })

  if (maxed.score > 100) {
    throw new Error(`Score should not exceed 100, got ${maxed.score}`)
  }
  console.log('✔ Test 3: Score properly capped at 100:', maxed.score)

  console.log('All vendor-tier tests passed successfully!')
}

runTests()
