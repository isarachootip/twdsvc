/** Pure helpers for scripts/purge-jobs-before.ts (argument parsing, cutoff, payout cleanup plan). */

export interface PurgeArgs {
  mode: 'dry-run' | 'apply'
  /** Cutoff date (YYYY-MM-DD, Bangkok time). Jobs opened strictly before 00:00 of this day are purged. */
  before: string
  confirmDb?: string
}

export interface PayoutLineRef {
  batchId: string
  jobId: string
}

export interface PayoutCleanupPlan {
  /** Batches whose every line belongs to a purged job — delete the batch. */
  emptyBatchIds: string[]
  /** Batches that keep some lines — totals become stale and need manual review. */
  partialBatchIds: string[]
}

export const DEFAULT_PURGE_BEFORE = '2026-10-12'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function cutoffFromDate(ymd: string): Date {
  if (!DATE_RE.test(ymd)) throw new Error(`Invalid date "${ymd}" (expected YYYY-MM-DD).`)
  const d = new Date(`${ymd}T00:00:00+07:00`)
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== shiftDay(ymd, -1)) {
    throw new Error(`Invalid calendar date "${ymd}".`)
  }
  return d
}

/** Midnight +07:00 is 17:00 UTC of the previous day; used to validate real calendar dates. */
function shiftDay(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function parsePurgeArgs(argv: readonly string[]): PurgeArgs {
  let apply = false
  let before = DEFAULT_PURGE_BEFORE
  let confirmDb: string | undefined

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--apply') apply = true
    else if (arg === '--before') before = argv[++i] ?? ''
    else if (arg === '--confirm-db') confirmDb = argv[++i]
    else throw new Error(`Unknown argument: ${arg}`)
  }

  cutoffFromDate(before)
  if (apply && !confirmDb) throw new Error('--apply requires --confirm-db <dbname>.')
  return { mode: apply ? 'apply' : 'dry-run', before, confirmDb }
}

export function assertConfirmedDb(args: PurgeArgs, targetDatabase: string): void {
  if (args.mode !== 'apply') return
  if (args.confirmDb !== targetDatabase) {
    throw new Error(`--confirm-db "${args.confirmDb ?? ''}" does not match target database "${targetDatabase}".`)
  }
}

export function planPayoutCleanup(linesOfAffectedBatches: readonly PayoutLineRef[], purgeJobIds: readonly string[]): PayoutCleanupPlan {
  const purge = new Set(purgeJobIds)
  const remaining = new Map<string, number>()
  const affected = new Set<string>()

  for (const l of linesOfAffectedBatches) {
    if (!remaining.has(l.batchId)) remaining.set(l.batchId, 0)
    if (purge.has(l.jobId)) affected.add(l.batchId)
    else remaining.set(l.batchId, (remaining.get(l.batchId) ?? 0) + 1)
  }

  const emptyBatchIds: string[] = []
  const partialBatchIds: string[] = []
  for (const batchId of affected) {
    if ((remaining.get(batchId) ?? 0) === 0) emptyBatchIds.push(batchId)
    else partialBatchIds.push(batchId)
  }
  return { emptyBatchIds, partialBatchIds }
}
