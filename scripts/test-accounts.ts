/**
 * Disable the published test_* accounts (reversible). NEVER runs automatically.
 *
 *   npx tsx scripts/test-accounts.ts                                   # dry-run (default): lists what would change
 *   npx tsx scripts/test-accounts.ts --apply --confirm-db <dbname>     # deactivate + revoke refresh tokens, writes snapshot
 *   npx tsx scripts/test-accounts.ts --rollback <snapshot.json> --confirm-db <dbname>
 *
 * - Only exact usernames from the allow-list are touched (see scripts/lib/test-account-plan.ts).
 * - Users are never deleted and passwords are never modified; only `active` is toggled.
 * - Rollback re-activates only accounts that were active before; revoked refresh tokens stay
 *   revoked (affected users simply log in again).
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import {
  TEST_USERNAMES,
  buildSnapshot,
  parseSnapshot,
  planDisable,
  planRollback,
  type AccountRow,
} from './lib/test-account-plan'
import { parseDbTarget, parseCliArgs } from './lib/test-accounts-cli'

const STATE_DIR = path.join(__dirname, '.state')
const prisma = new PrismaClient()

async function loadAccounts(): Promise<AccountRow[]> {
  return prisma.user.findMany({
    where: { username: { in: [...TEST_USERNAMES] } },
    select: { id: true, username: true, active: true },
    orderBy: { username: 'asc' },
  })
}

function printRows(title: string, rows: { username: string }[]): void {
  console.log(`${title} (${rows.length})`)
  for (const r of rows) console.log(`  - ${r.username}`)
}

async function dryRun(rows: AccountRow[]): Promise<void> {
  const plan = planDisable(rows)
  console.log('DRY-RUN: no changes were made.')
  printRows('Would deactivate', plan.toDisable)
  printRows('Already inactive', plan.alreadyInactive)
  const missing = TEST_USERNAMES.filter(u => !rows.some(r => r.username === u))
  printRows('Not found in this database', missing.map(username => ({ username })))
}

import crypto from 'crypto'
import bcrypt from 'bcryptjs'

async function apply(rows: AccountRow[]): Promise<void> {
  const plan = planDisable(rows)
  const allMatchedIds = [...plan.toDisable, ...plan.alreadyInactive].map(r => r.id)
  if (allMatchedIds.length === 0) {
    console.log('Nothing to do: no test accounts found.')
    return
  }
  const snapshot = buildSnapshot(rows, new Date())
  fs.mkdirSync(STATE_DIR, recursiveDirOpts)
  const file = path.join(STATE_DIR, `test-accounts-${snapshot.createdAt.replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf-8')
  console.log(`Snapshot written: ${file}`)

  const rotatedHash = await bcrypt.hash(crypto.randomBytes(24).toString('base64url'), 10)
  await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: { in: allMatchedIds } },
      data: { active: false, password: rotatedHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: { in: allMatchedIds }, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ])
  printRows('Deactivated & rotated passwords for', [...plan.toDisable, ...plan.alreadyInactive])
  console.log(`Rollback with: npx tsx scripts/test-accounts.ts --rollback "${file}" --confirm-db <dbname>`)
}

const recursiveDirOpts = { recursive: true } as const

async function rollback(snapshotPath: string, rows: AccountRow[]): Promise<void> {
  const snapshot = parseSnapshot(JSON.parse(fs.readFileSync(snapshotPath, 'utf-8')))
  const restore = planRollback(snapshot, rows)
  if (restore.length === 0) {
    console.log('Nothing to restore.')
    return
  }
  await prisma.user.updateMany({ where: { id: { in: restore.map(e => e.id) } }, data: { active: true } })
  printRows('Re-activated', restore)
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2))
  const target = parseDbTarget(process.env.DATABASE_URL)
  console.log(`Target database: ${target.host}/${target.database}`)

  const rows = await loadAccounts()
  if (args.mode === 'dry-run') return dryRun(rows)

  if (args.confirmDb !== target.database) {
    throw new Error(`Refusing to write: pass --confirm-db ${target.database} to confirm the target database.`)
  }
  if (args.mode === 'apply') return apply(rows)
  if (!args.snapshotPath) throw new Error('--rollback requires a snapshot file path.')
  return rollback(args.snapshotPath, rows)
}

main()
  .catch(e => { console.error(e instanceof Error ? e.message : e); process.exit(1) })
  .finally(() => prisma.$disconnect())
