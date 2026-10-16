/**
 * Test-account disable plan — pure functions (no I/O).
 * Used by scripts/test-accounts.ts to deactivate the published test_* accounts
 * on production in a reversible way.
 *
 * Safety rules:
 *  - Match usernames EXACTLY against the allow-list (never LIKE 'test_%': "_" is a SQL wildcard).
 *  - Never delete users or touch passwords; only toggle `active`.
 *  - A snapshot of the previous `active` state is written before any change, so rollback
 *    restores precisely what was changed and nothing else.
 */
import { z } from 'zod'

export const TEST_USERNAMES = [
  'test_cs',
  'test_gr',
  'test_dc',
  'test_vd',
  'test_s2',
  'test_am',
  'test_exec',
] as const

const TEST_USERNAME_SET: ReadonlySet<string> = new Set(TEST_USERNAMES)

export interface AccountRow {
  id: string
  username: string
  active: boolean
}

export interface DisablePlan {
  toDisable: AccountRow[]
  alreadyInactive: AccountRow[]
}

const snapshotEntrySchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  activeBefore: z.boolean(),
})

const snapshotSchema = z.object({
  version: z.literal(1),
  createdAt: z.string().min(1),
  entries: z.array(snapshotEntrySchema),
})

export type SnapshotEntry = z.infer<typeof snapshotEntrySchema>
export type Snapshot = z.infer<typeof snapshotSchema>

function matchesTestAccount(row: AccountRow): boolean {
  return TEST_USERNAME_SET.has(row.username)
}

export function planDisable(rows: AccountRow[]): DisablePlan {
  const matched = rows.filter(matchesTestAccount)
  return {
    toDisable: matched.filter(r => r.active),
    alreadyInactive: matched.filter(r => !r.active),
  }
}

export function buildSnapshot(rows: AccountRow[], now: Date): Snapshot {
  return {
    version: 1,
    createdAt: now.toISOString(),
    entries: rows
      .filter(matchesTestAccount)
      .map(r => ({ id: r.id, username: r.username, activeBefore: r.active })),
  }
}

/** Entries that must be re-activated: were active before, exist now, and are inactive now. */
export function planRollback(snapshot: Snapshot, current: AccountRow[]): SnapshotEntry[] {
  const currentById = new Map(current.map(r => [r.id, r]))
  return snapshot.entries.filter(e => {
    if (!e.activeBefore) return false
    const now = currentById.get(e.id)
    return now !== undefined && !now.active
  })
}

export function parseSnapshot(raw: unknown): Snapshot {
  return snapshotSchema.parse(raw)
}
