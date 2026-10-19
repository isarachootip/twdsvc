import { describe, it, expect, setTier } from '../framework/core'
import {
  shouldSeedTestData,
  resolveSeedTestPassword,
  DEFAULT_SEED_TEST_PASSWORD,
} from '../../src/lib/seed-guard'

setTier('Tier 1')

const CUSTOM = 'Str0ng-Seed-Pass'

describe('Unit: Seed guard (default test accounts seeding)', () => {
  it('SEEDGUARD-01: disables test data by default in production, enables in development', () => {
    expect(shouldSeedTestData({ NODE_ENV: 'production' })).toBe(false)
    expect(shouldSeedTestData({ NODE_ENV: 'production', SEED_TEST_DATA: 'true' })).toBe(true)
    expect(shouldSeedTestData({ NODE_ENV: 'development' })).toBe(true)
    expect(shouldSeedTestData({})).toBe(true)
  })

  it('SEEDGUARD-02: allows explicit opt-out via SEED_TEST_DATA=false', () => {
    expect(shouldSeedTestData({ NODE_ENV: 'production', SEED_TEST_DATA: 'false' })).toBe(false)
    expect(shouldSeedTestData({ NODE_ENV: 'development', SEED_TEST_DATA: 'false' })).toBe(false)
  })

  it('SEEDGUARD-03: resolveSeedTestPassword rejects retired password123 and uses rotated default when unset or blank', () => {
    expect(resolveSeedTestPassword({})).toBe(DEFAULT_SEED_TEST_PASSWORD)
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: '   ' })).toBe(DEFAULT_SEED_TEST_PASSWORD)
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: 'password123' })).toBe(DEFAULT_SEED_TEST_PASSWORD)
    expect(DEFAULT_SEED_TEST_PASSWORD).not.toBe('password123')
  })

  it('SEEDGUARD-04: resolveSeedTestPassword uses custom password when >= 8 chars', () => {
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: `  ${CUSTOM}  ` })).toBe(CUSTOM)
  })

  it('SEEDGUARD-05: resolveSeedTestPassword falls back to rotated default when custom password is too short', () => {
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: 'short' })).toBe(DEFAULT_SEED_TEST_PASSWORD)
  })
})
