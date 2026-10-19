/**
 * Seed guard — decides whether demo/test accounts and sample data may be seeded.
 * Pure functions (no I/O) so the rule can be unit-tested and reused by prisma/seed.ts.
 *
 * Rules:
 *  - In production (NODE_ENV === 'production'), test data is NOT seeded unless SEED_TEST_DATA === 'true'.
 *  - In non-production, test data is seeded unless SEED_TEST_DATA === 'false'.
 *  - Rejects retired leaked password ('password123') and uses SEED_TEST_PASSWORD (>= 8 chars) or rotated default.
 */

export interface SeedEnv {
  NODE_ENV?: string
  SEED_TEST_PASSWORD?: string
  SEED_TEST_DATA?: string
}

export const MIN_SEED_PASSWORD_LENGTH = 8
export const RETIRED_SEED_PASSWORDS = new Set(['password123'])
export const DEFAULT_SEED_TEST_PASSWORD = 'Tws!Test#2026'

export function resolveSeedTestPassword(env: SeedEnv): string {
  const password = env.SEED_TEST_PASSWORD?.trim()
  if (
    password &&
    password.length >= MIN_SEED_PASSWORD_LENGTH &&
    !RETIRED_SEED_PASSWORDS.has(password)
  ) {
    return password
  }
  return DEFAULT_SEED_TEST_PASSWORD
}

export function shouldSeedTestData(env: SeedEnv): boolean {
  const flag = env.SEED_TEST_DATA?.trim().toLowerCase()
  if (flag === 'false' || flag === '0' || flag === 'no') return false
  if (flag === 'true' || flag === '1' || flag === 'yes') return true
  if (env.NODE_ENV === 'production') return false
  return true
}
