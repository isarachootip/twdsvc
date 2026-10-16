/**
 * Phase 3.2 Operator CLI: Inspect and deactivate duplicate or event/test branches reversibly.
 *
 * Usage:
 *   npx tsx scripts/fix-branches.ts                                     # Dry-run: list duplicate & event branches
 *   npx tsx scripts/fix-branches.ts --apply                             # Set active=false + save snapshot
 *   npx tsx scripts/fix-branches.ts --rollback backups/branches-*.json  # Restore active state from snapshot
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { buildBranchCleanupPlan, branchCleanupSnapshotSchema } from './lib/branch-cleanup'

const prisma = new PrismaClient()

async function run(): Promise<void> {
  const argv = process.argv.slice(2)
  const rbIdx = argv.indexOf('--rollback')
  const rollbackFile = rbIdx >= 0 ? argv[rbIdx + 1] : undefined
  const apply = argv.includes('--apply')
  const mode = rollbackFile ? 'rollback' : apply ? 'apply' : 'dry-run'

  console.log(`\n=== [Phase 3.2] Branch Deduplication & Event Filter CLI (mode: ${mode.toUpperCase()}) ===\n`)

  if (mode === 'rollback') {
    if (!rollbackFile || !fs.existsSync(rollbackFile)) {
      throw new Error(`Snapshot file not found: ${rollbackFile ?? '(missing)'}`)
    }
    const snapshot = branchCleanupSnapshotSchema.parse(JSON.parse(fs.readFileSync(rollbackFile, 'utf-8')))
    const toTrue = snapshot.entries.filter(e => e.activeBefore).map(e => e.id)
    const toFalse = snapshot.entries.filter(e => !e.activeBefore).map(e => e.id)

    await prisma.$transaction(async tx => {
      if (toTrue.length > 0) await tx.site.updateMany({ where: { id: { in: toTrue } }, data: { active: true } })
      if (toFalse.length > 0) await tx.site.updateMany({ where: { id: { in: toFalse } }, data: { active: false } })
    })
    console.log(`✓ Rolled back ${snapshot.entries.length} site(s) from ${rollbackFile}`)
    return
  }

  const sites = await prisma.site.findMany({
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
    select: { id: true, code: true, name: true, type: true, active: true },
  })

  const plan = buildBranchCleanupPlan(sites)
  console.log(`Scanned ${sites.length} site(s). Found ${plan.actions.length} branch(es) to deactivate:\n`)

  for (const a of plan.actions) {
    console.log(`  • [${a.code}] ${a.name} (id: ${a.id}) — ${a.reason}`)
  }

  if (mode === 'dry-run') {
    console.log(`\n[DRY-RUN] ยังไม่ได้แก้ไขข้อมูลในฐานข้อมูล`)
    console.log(`หากต้องการซ่อนสาขาข้างต้น (active=false) ให้รัน: npx tsx scripts/fix-branches.ts --apply\n`)
    return
  }

  const backupDir = path.join(process.cwd(), 'backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const snapshotPath = path.join(backupDir, `branches-${stamp}.json`)
  fs.writeFileSync(snapshotPath, JSON.stringify(plan.snapshot, null, 2), 'utf-8')

  if (plan.toDeactivateIds.length > 0) {
    await prisma.site.updateMany({
      where: { id: { in: plan.toDeactivateIds } },
      data: { active: false },
    })
  }

  console.log(`\n✓ Deactivated ${plan.toDeactivateIds.length} branch(es) (active = false).`)
  console.log(`✓ Saved rollback snapshot to: ${snapshotPath}\n`)
}

run()
  .catch(err => {
    console.error('Error:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
