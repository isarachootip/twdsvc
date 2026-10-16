import { describe, it, expect, setTier } from '../framework/core'
import { shouldSeedTestData, resolveSeedTestPassword } from '../../src/lib/seed-guard'

setTier('Tier 1')

const STRONG = 'Str0ng-Seed-Pass'

describe('Unit: Seed guard (test accounts must never be seeded in production)', () => {
  it('SEEDGUARD-01: production never seeds test data, even with a password', () => {
    expect(shouldSeedTestData({ NODE_ENV: 'production', SEED_TEST_PASSWORD: STRONG })).toBe(false)
  })

  it('SEEDGUARD-02: development with a strong password seeds test data', () => {
    expect(shouldSeedTestData({ NODE_ENV: 'development', SEED_TEST_PASSWORD: STRONG })).toBe(true)
  })

  it('SEEDGUARD-03: test env with a strong password seeds test data', () => {
    expect(shouldSeedTestData({ NODE_ENV: 'test', SEED_TEST_PASSWORD: STRONG })).toBe(true)
  })

  it('SEEDGUARD-04: unset NODE_ENV is treated as non-production but still needs a password', () => {
    expect(shouldSeedTestData({ SEED_TEST_PASSWORD: STRONG })).toBe(true)
    expect(shouldSeedTestData({})).toBe(false)
  })

  it('SEEDGUARD-05: missing, blank or short password disables seeding (no fallback)', () => {
    expect(shouldSeedTestData({ NODE_ENV: 'development' })).toBe(false)
    expect(shouldSeedTestData({ NODE_ENV: 'development', SEED_TEST_PASSWORD: '   ' })).toBe(false)
    expect(shouldSeedTestData({ NODE_ENV: 'development', SEED_TEST_PASSWORD: 'short' })).toBe(false)
  })

  it('SEEDGUARD-06: resolveSeedTestPassword returns the trimmed password or null', () => {
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: `  ${STRONG}  ` })).toBe(STRONG)
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: 'short' })).toBeNull()
    expect(resolveSeedTestPassword({})).toBeNull()
  })

  it('SEEDGUARD-07: the retired default password is rejected', () => {
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: 'password123' })).toBeNull()
  })
})
