/**
 * Seed guard — decides whether demo/test accounts and sample data may be seeded.
 * Pure functions (no I/O) so the rule can be unit-tested and reused by prisma/seed.ts.
 *
 * Rules:
 *  - NEVER seed test data when NODE_ENV === 'production'.
 *  - The password must come from SEED_TEST_PASSWORD (no hard-coded fallback).
 *  - Blank, too-short or retired default passwords are rejected.
 */

export interface SeedEnv {
  NODE_ENV?: string
  SEED_TEST_PASSWORD?: string
}

export const MIN_SEED_PASSWORD_LENGTH = 8

/** Passwords that were previously published and must never be reused. */
const RETIRED_PASSWORDS: readonly string[] = ['password123', '1234']

export function resolveSeedTestPassword(env: SeedEnv): string | null {
  const password = env.SEED_TEST_PASSWORD?.trim()
  if (!password) return null
  if (password.length < MIN_SEED_PASSWORD_LENGTH) return null
  if (RETIRED_PASSWORDS.includes(password)) return null
  return password
}

export function shouldSeedTestData(env: SeedEnv): boolean {
  if (env.NODE_ENV === 'production') return false
  return resolveSeedTestPassword(env) !== null
}
