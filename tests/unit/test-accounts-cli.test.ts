import { describe, it, expect, setTier } from '../framework/core'
import { parseCliArgs, parseDbTarget } from '../../scripts/lib/test-accounts-cli'

setTier('Tier 1')

function throws(fn: () => unknown): boolean {
  try { fn() } catch { return true }
  return false
}

describe('Unit: test-accounts CLI argument safety', () => {
  it('TESTCLI-01: no flags means dry-run', () => {
    expect(parseCliArgs([]).mode).toBe('dry-run')
  })

  it('TESTCLI-02: --apply selects apply mode and reads --confirm-db', () => {
    const a = parseCliArgs(['--apply', '--confirm-db', 'svc_prod'])
    expect(a.mode).toBe('apply')
    expect(a.confirmDb).toBe('svc_prod')
  })

  it('TESTCLI-03: --rollback takes a snapshot path', () => {
    const a = parseCliArgs(['--rollback', 'snap.json', '--confirm-db', 'x'])
    expect(a.mode).toBe('rollback')
    expect(a.snapshotPath).toBe('snap.json')
  })

  it('TESTCLI-04: --apply together with --rollback is rejected', () => {
    expect(throws(() => parseCliArgs(['--apply', '--rollback', 'snap.json']))).toBe(true)
  })

  it('TESTCLI-05: unknown flags are rejected (typos must not silently dry-run or apply)', () => {
    expect(throws(() => parseCliArgs(['--aply']))).toBe(true)
  })

  it('TESTCLI-06: parseDbTarget extracts host and database without credentials', () => {
    const t = parseDbTarget('postgresql://user:secret@db.example.com:5432/svc_prod?schema=public')
    expect(t.host).toBe('db.example.com:5432')
    expect(t.database).toBe('svc_prod')
  })

  it('TESTCLI-07: missing or malformed DATABASE_URL is an error', () => {
    expect(throws(() => parseDbTarget(undefined))).toBe(true)
    expect(throws(() => parseDbTarget('not a url'))).toBe(true)
  })
})
