import { describe, it, expect, setTier } from '../framework/core'
import {
  TEST_USERNAMES,
  planDisable,
  buildSnapshot,
  planRollback,
  parseSnapshot,
  type AccountRow,
} from '../../scripts/lib/test-account-plan'

setTier('Tier 1')

const row = (username: string, active = true, id = `id-${username}`): AccountRow => ({ id, username, active })

const ALL_TEST = TEST_USERNAMES.map(u => row(u))

describe('Unit: Test-account disable plan (reversible, exact-match only)', () => {
  it('TESTACC-01: covers exactly the 7 documented test usernames', () => {
    expect([...TEST_USERNAMES].sort()).toEqual(
      ['test_am', 'test_cs', 'test_dc', 'test_exec', 'test_gr', 'test_s2', 'test_vd'],
    )
  })

  it('TESTACC-02: only exact username matches are planned (no LIKE wildcard, no look-alikes)', () => {
    const rows = [...ALL_TEST, row('testXcs'), row('test_cs2'), row('xtest_cs'), row('BNA_cs'), row('test_')]
    const plan = planDisable(rows)
    expect(plan.toDisable.map(r => r.username).sort()).toEqual([...TEST_USERNAMES].sort())
  })

  it('TESTACC-03: already-inactive accounts are reported but not re-disabled (idempotent)', () => {
    const rows = [row('test_cs', false), row('test_gr', true)]
    const plan = planDisable(rows)
    expect(plan.toDisable.map(r => r.username)).toEqual(['test_gr'])
    expect(plan.alreadyInactive.map(r => r.username)).toEqual(['test_cs'])
  })

  it('TESTACC-04: snapshot records the pre-change active state of every matched account', () => {
    const snap = buildSnapshot([row('test_cs', true), row('test_gr', false), row('someone', true)], new Date('2026-10-16T00:00:00Z'))
    expect(snap.version).toBe(1)
    expect(snap.createdAt).toBe('2026-10-16T00:00:00.000Z')
    expect(snap.entries).toEqual([
      { id: 'id-test_cs', username: 'test_cs', activeBefore: true },
      { id: 'id-test_gr', username: 'test_gr', activeBefore: false },
    ])
  })

  it('TESTACC-05: rollback restores only accounts that were active before and are inactive now', () => {
    const snap = buildSnapshot([row('test_cs', true), row('test_gr', false)], new Date())
    const current = [row('test_cs', false), row('test_gr', false)]
    const restore = planRollback(snap, current)
    expect(restore.map(e => e.username)).toEqual(['test_cs'])
  })

  it('TESTACC-06: rollback skips accounts that no longer exist or are already active', () => {
    const snap = buildSnapshot([row('test_cs', true), row('test_gr', true)], new Date())
    const current = [row('test_cs', true)]
    expect(planRollback(snap, current)).toEqual([])
  })

  it('TESTACC-07: parseSnapshot validates the file shape and rejects bad input', () => {
    const snap = buildSnapshot([row('test_cs', true)], new Date())
    expect(parseSnapshot(JSON.parse(JSON.stringify(snap))).entries.length).toBe(1)
    let threw = false
    try { parseSnapshot({ version: 2, entries: [] }) } catch { threw = true }
    expect(threw).toBe(true)
  })
})
