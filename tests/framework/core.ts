/**
 * Lightweight, robust, zero-dependency Test Runner & Assertion Library
 * Thai Watsadu Repair Center System (SVCM) - E2E Test Suite
 */

export * from './assertions'

export interface TestCase {
  name: string
  fn: () => void | Promise<void>
  suite: string
  tier: string
}

export interface TestResult {
  name: string
  suite: string
  tier: string
  passed: boolean
  durationMs: number
  error?: Error
}

export interface TestSuiteStats {
  total: number
  passed: number
  failed: number
  skipped: number
  durationMs: number
}

// Global registry
const testRegistry: TestCase[] = []
let currentSuite = 'Default Suite'
let currentTier = 'Tier 1'

export function setTier(tier: string) {
  currentTier = tier
}

export function describe(name: string, fn: () => void) {
  const previousSuite = currentSuite
  currentSuite = name
  try {
    fn()
  } finally {
    currentSuite = previousSuite
  }
}

export function it(name: string, fn: () => void | Promise<void>) {
  testRegistry.push({
    name,
    fn,
    suite: currentSuite,
    tier: currentTier,
  })
}

export const test = it

// Test Runner Execution Engine
export async function runTests(options: { tierFilter?: string; suiteFilter?: string } = {}): Promise<{
  results: TestResult[]
  stats: TestSuiteStats
}> {
  const filtered = testRegistry.filter((t) => {
    if (options.tierFilter && !t.tier.toLowerCase().includes(options.tierFilter.toLowerCase())) return false
    if (options.suiteFilter && !t.suite.toLowerCase().includes(options.suiteFilter.toLowerCase())) return false
    return true
  })

  const results: TestResult[] = []
  const startTime = Date.now()

  for (const testCase of filtered) {
    const testStart = Date.now()
    try {
      await testCase.fn()
      results.push({
        name: testCase.name,
        suite: testCase.suite,
        tier: testCase.tier,
        passed: true,
        durationMs: Date.now() - testStart,
      })
    } catch (err: unknown) {
      results.push({
        name: testCase.name,
        suite: testCase.suite,
        tier: testCase.tier,
        passed: false,
        durationMs: Date.now() - testStart,
        error: err instanceof Error ? err : new Error(String(err)),
      })
    }
  }

  const durationMs = Date.now() - startTime
  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  return {
    results,
    stats: {
      total: results.length,
      passed,
      failed,
      skipped: testRegistry.length - filtered.length,
      durationMs,
    },
  }
}

export function getRegistryCount(): number {
  return testRegistry.length
}

export function clearRegistry(): void {
  testRegistry.length = 0
}
