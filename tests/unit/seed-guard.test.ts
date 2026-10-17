import { describe, it, expect, setTier } from '../framework/core'
import { shouldSeedTestData, resolveSeedTestPassword } from '../../src/lib/seed-guard'

setTier('Tier 1')

const CUSTOM = 'Str0ng-Seed-Pass'

describe('Unit: Seed guard (default test accounts seeding)', () => {
  it('SEEDGUARD-01: seeds test data by default in both development and production', () => {
    expect(shouldSeedTestData({ NODE_ENV: 'production' })).toBe(true)
    expect(shouldSeedTestData({ NODE_ENV: 'development' })).toBe(true)
    expect(shouldSeedTestData({})).toBe(true)
  })

  it('SEEDGUARD-02: allows explicit opt-out via SEED_TEST_DATA=false', () => {
    expect(shouldSeedTestData({ NODE_ENV: 'production', SEED_TEST_DATA: 'false' })).toBe(false)
    expect(shouldSeedTestData({ NODE_ENV: 'development', SEED_TEST_DATA: 'false' })).toBe(false)
  })

  it('SEEDGUARD-03: resolveSeedTestPassword falls back to password123 when unset or blank', () => {
    expect(resolveSeedTestPassword({})).toBe('password123')
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: '   ' })).toBe('password123')
  })

  it('SEEDGUARD-04: resolveSeedTestPassword uses custom password when >= 8 chars', () => {
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: `  ${CUSTOM}  ` })).toBe(CUSTOM)
  })

  it('SEEDGUARD-05: resolveSeedTestPassword falls back to default when custom password is too short', () => {
    expect(resolveSeedTestPassword({ SEED_TEST_PASSWORD: 'short' })).toBe('password123')
  })
})
