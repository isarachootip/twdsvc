import fs from 'fs'
import path from 'path'
import { describe, it, expect, setTier } from '../framework/core'

setTier('Tier 1')

const ROOT = path.resolve(__dirname, '..', '..')
const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.md', '.sh'])
const RETIRED_PASSWORD = 'password123'
const TEST_USERNAME = /\btest_(cs|gr|dc|vd|s2|am|exec)\b/

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (SCAN_EXT.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

function filesContaining(files: string[], matcher: (text: string) => boolean): string[] {
  return files
    .filter(f => matcher(fs.readFileSync(f, 'utf-8')))
    .map(f => path.relative(ROOT, f).replace(/\\/g, '/'))
}

describe('Unit: Credential leak scan (no published test credentials in shipped code)', () => {
  it('LEAK-01: src/ never contains the retired password (except the guard blocklist)', () => {
    // seed-guard.ts keeps the retired password only as a blocklist entry; it is server-side seeding code.
    const files = walk(path.join(ROOT, 'src')).filter(f => !f.endsWith(path.join('lib', 'seed-guard.ts')))
    expect(filesContaining(files, t => t.includes(RETIRED_PASSWORD))).toEqual([])
  })

  it('LEAK-02: src/ never references test_* login usernames (rendered to the browser)', () => {
    const hits = filesContaining(walk(path.join(ROOT, 'src')), t => TEST_USERNAME.test(t))
    expect(hits).toEqual([])
  })

  it('LEAK-03: prisma/ seed code never hard-codes the retired password', () => {
    const files = walk(path.join(ROOT, 'prisma')).filter(f => f.endsWith('.ts'))
    expect(filesContaining(files, t => t.includes(RETIRED_PASSWORD))).toEqual([])
  })

  it('LEAK-04: user manual documentation never publishes the retired password', () => {
    const files = walk(path.join(ROOT, 'docs')).filter(f => f.endsWith('.md'))
    expect(filesContaining(files, t => t.includes(RETIRED_PASSWORD))).toEqual([])
  })

  it('LEAK-05: .env.example documents SEED_TEST_PASSWORD with an empty value', () => {
    const text = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf-8')
    const line = text.split(/\r?\n/).find(l => l.startsWith('SEED_TEST_PASSWORD='))
    expect(line).toBe('SEED_TEST_PASSWORD=')
  })
})
