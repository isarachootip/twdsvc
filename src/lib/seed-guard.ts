/**
 * Seed guard — decides whether demo/test accounts and sample data may be seeded.
 * Pure functions (no I/O) so the rule can be unit-tested and reused by prisma/seed.ts.
 *
 * Rules:
 *  - Seeds default test_* accounts by default unless SEED_TEST_DATA === 'false'.
 *  - Uses SEED_TEST_PASSWORD when provided (>= 8 chars), otherwise defaults to 'password123'.
 */

export interface SeedEnv {
  NODE_ENV?: string
  SEED_TEST_PASSWORD?: string
  SEED_TEST_DATA?: string
}

export const MIN_SEED_PASSWORD_LENGTH = 8
export const DEFAULT_SEED_TEST_PASSWORD = 'password123'

export function resolveSeedTestPassword(env: SeedEnv): string {
  const password = env.SEED_TEST_PASSWORD?.trim()
  if (password && password.length >= MIN_SEED_PASSWORD_LENGTH) {
    return password
  }
  return DEFAULT_SEED_TEST_PASSWORD
}

export function shouldSeedTestData(env: SeedEnv): boolean {
  if (env.SEED_TEST_DATA?.trim().toLowerCase() === 'false') return false
  return true
}
