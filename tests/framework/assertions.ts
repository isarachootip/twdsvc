/**
 * Assertion library for SVCM Test Suite
 */

export class Expectation<T> {
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
    const pass = !this.actual
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
