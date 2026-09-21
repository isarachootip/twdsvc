/**
 * Lightweight, robust, zero-dependency Test Runner & Assertion Library
 * Thai Watsadu Repair Center System (SVCM) - E2E Test Suite
 */

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

// Assertion library
class Expectation<T> {
  private isNot = false

  constructor(private actual: T) {}

  get not(): Expectation<T> {
    const inverted = new Expectation(this.actual)
    inverted.isNot = !this.isNot
    return inverted
  }

  toBe(expected: unknown): void {
    const pass = Object.is(this.actual, expected)
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion Failed:\n  Expected: ${this.isNot ? 'NOT ' : ''}${JSON.stringify(expected)}\n  Received: ${JSON.stringify(this.actual)}`
      )
    }
  }

  toEqual(expected: unknown): void {
    const actualStr = JSON.stringify(this.actual)
    const expectedStr = JSON.stringify(expected)
    const pass = actualStr === expectedStr
    if (this.isNot ? pass : !pass) {
      throw new Error(
        `Assertion Failed:\n  Expected: ${this.isNot ? 'NOT ' : ''}${expectedStr}\n  Received: ${actualStr}`
      )
    }
  }

  toBeDefined(): void {
    const pass = this.actual !== undefined
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected value ${this.isNot ? 'NOT ' : ''}to be defined. Received: ${this.actual}`)
    }
  }

  toBeUndefined(): void {
    const pass = this.actual === undefined
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected value ${this.isNot ? 'NOT ' : ''}to be undefined. Received: ${this.actual}`)
    }
  }

  toBeNull(): void {
    const pass = this.actual === null
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected value ${this.isNot ? 'NOT ' : ''}to be null. Received: ${this.actual}`)
    }
  }

  toBeTruthy(): void {
    const pass = Boolean(this.actual)
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected value ${this.isNot ? 'NOT ' : ''}to be truthy. Received: ${this.actual}`)
    }
  }

  toBeFalsy(): void {
    const pass = !Boolean(this.actual)
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected value ${this.isNot ? 'NOT ' : ''}to be falsy. Received: ${this.actual}`)
    }
  }

  toBeGreaterThan(expected: number): void {
    const pass = typeof this.actual === 'number' && this.actual > expected
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${this.actual} ${this.isNot ? 'NOT ' : ''}to be > ${expected}`)
    }
  }

  toBeGreaterThanOrEqual(expected: number): void {
    const pass = typeof this.actual === 'number' && this.actual >= expected
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${this.actual} ${this.isNot ? 'NOT ' : ''}to be >= ${expected}`)
    }
  }

  toBeLessThan(expected: number): void {
    const pass = typeof this.actual === 'number' && this.actual < expected
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${this.actual} ${this.isNot ? 'NOT ' : ''}to be < ${expected}`)
    }
  }

  toBeLessThanOrEqual(expected: number): void {
    const pass = typeof this.actual === 'number' && this.actual <= expected
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${this.actual} ${this.isNot ? 'NOT ' : ''}to be <= ${expected}`)
    }
  }

  toContain(item: unknown): void {
    let pass = false
    if (Array.isArray(this.actual)) {
      pass = this.actual.some((x) => Object.is(x, item) || JSON.stringify(x) === JSON.stringify(item))
    } else if (typeof this.actual === 'string' && typeof item === 'string') {
      pass = this.actual.includes(item)
    }
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'NOT ' : ''}to contain ${JSON.stringify(item)}`)
    }
  }

  toMatch(regex: RegExp): void {
    const pass = typeof this.actual === 'string' && regex.test(this.actual)
    if (this.isNot ? pass : !pass) {
      throw new Error(`Assertion Failed: Expected "${this.actual}" ${this.isNot ? 'NOT ' : ''}to match ${regex}`)
    }
  }

  toThrow(expectedMessage?: string | RegExp): void {
    if (typeof this.actual !== 'function') {
      throw new Error('toThrow requires a function')
    }
    let threw = false
    let thrownError: unknown = null
    try {
      (this.actual as () => unknown)()
    } catch (err) {
      threw = true
      thrownError = err
    }

    if (this.isNot) {
      if (threw) {
        throw new Error(`Assertion Failed: Expected function NOT to throw, but it threw: ${thrownError}`)
      }
      return
    }

    if (!threw) {
      throw new Error('Assertion Failed: Expected function to throw, but it did not.')
    }

    if (expectedMessage && thrownError instanceof Error) {
      if (typeof expectedMessage === 'string' && !thrownError.message.includes(expectedMessage)) {
        throw new Error(`Assertion Failed: Expected error message to include "${expectedMessage}", but got "${thrownError.message}"`)
      } else if (expectedMessage instanceof RegExp && !expectedMessage.test(thrownError.message)) {
        throw new Error(`Assertion Failed: Expected error message to match ${expectedMessage}, but got "${thrownError.message}"`)
      }
    }
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual)
}

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
