import { describe, it, expect, setTier } from '../framework/core'
import {
  parsePurgeArgs,
  cutoffFromDate,
  assertConfirmedDb,
  planPayoutCleanup,
} from '../../scripts/lib/purge-jobs-plan'

setTier('Tier 1')

describe('Purge jobs before cutoff — pure plan helpers (purge-jobs-plan)', () => {
  it('PJ-01: defaults to dry-run with cutoff 2026-10-12', () => {
    const a = parsePurgeArgs([])
    expect(a.mode).toBe('dry-run')
    expect(a.before).toBe('2026-10-12')
    expect(a.confirmDb).toBe(undefined)
  })

  it('PJ-02: parses --apply, --before and --confirm-db', () => {
    const a = parsePurgeArgs(['--apply', '--before', '2026-10-01', '--confirm-db', 'svc_new_db'])
    expect(a.mode).toBe('apply')
    expect(a.before).toBe('2026-10-01')
    expect(a.confirmDb).toBe('svc_new_db')
  })

  it('PJ-03: rejects unknown args, bad dates, and --apply without --confirm-db', () => {
    expect(() => parsePurgeArgs(['--force'])).toThrow()
    expect(() => parsePurgeArgs(['--before', '12/10/2026'])).toThrow()
    expect(() => parsePurgeArgs(['--before', '2026-13-40'])).toThrow()
    expect(() => parsePurgeArgs(['--apply'])).toThrow()
  })

  it('PJ-04: cutoff is midnight Bangkok time (UTC+7)', () => {
    expect(cutoffFromDate('2026-10-12').toISOString()).toBe('2026-10-11T17:00:00.000Z')
  })

  it('PJ-05: assertConfirmedDb only passes when name matches the target database', () => {
    expect(() => assertConfirmedDb({ mode: 'apply', before: '2026-10-12', confirmDb: 'prod' }, 'svc_new_db')).toThrow()
    assertConfirmedDb({ mode: 'apply', before: '2026-10-12', confirmDb: 'svc_new_db' }, 'svc_new_db')
    assertConfirmedDb({ mode: 'dry-run', before: '2026-10-12' }, 'anything')
    expect(true).toBe(true)
  })

  it('PJ-06: planPayoutCleanup splits affected batches into empty vs partial', () => {
    const lines = [
      { batchId: 'b1', jobId: 'old1' },
      { batchId: 'b1', jobId: 'old2' },
      { batchId: 'b2', jobId: 'old3' },
      { batchId: 'b2', jobId: 'new1' },
      { batchId: 'b3', jobId: 'new2' },
    ]
    const plan = planPayoutCleanup(lines, ['old1', 'old2', 'old3'])
    expect(plan.emptyBatchIds).toEqual(['b1'])
    expect(plan.partialBatchIds).toEqual(['b2'])
  })
})
