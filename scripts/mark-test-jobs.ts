/**
 * Phase 3.1 Operator CLI: Inspect, mark (isTest = true), or rollback test jobs.
 *
 * Usage:
 *   npx tsx scripts/mark-test-jobs.ts                                     # Dry-run: list candidates for inspection
 *   npx tsx scripts/mark-test-jobs.ts --job-nos JB-2609-00001             # Dry-run with extra explicit jobNo(s)
 *   npx tsx scripts/mark-test-jobs.ts --apply                             # Mark candidates isTest=true + save snapshot
 *   npx tsx scripts/mark-test-jobs.ts --rollback backups/test-jobs-*.json # Restore isTest from snapshot
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import {
  buildMarkTestJobsPlan,
  buildRollbackTestJobsPlan,
  testJobsSnapshotSchema,
} from './lib/test-jobs-detector'

interface CliOptions {
  mode: 'dry-run' | 'apply' | 'rollback'
  rollbackFile?: string
  explicitJobNos: string[]
}

function parseCli(argv: readonly string[]): CliOptions {
  const apply = argv.includes('--apply')
  const rbIdx = argv.indexOf('--rollback')
  const rollbackFile = rbIdx >= 0 ? argv[rbIdx + 1] : undefined
  const jnIdx = argv.indexOf('--job-nos')
  const explicitJobNos =
    jnIdx >= 0 && argv[jnIdx + 1]
      ? argv[jnIdx + 1].split(',').map(s => s.trim()).filter(Boolean)
      : []

  if (rollbackFile) return { mode: 'rollback', rollbackFile, explicitJobNos }
  if (apply) return { mode: 'apply', explicitJobNos }
  return { mode: 'dry-run', explicitJobNos }
}

const prisma = new PrismaClient()

async function run(): Promise<void> {
  const opts = parseCli(process.argv.slice(2))
  console.log(`\n=== [Phase 3.1] Test Jobs Inspector & Marker (mode: ${opts.mode.toUpperCase()}) ===\n`)

  if (opts.mode === 'rollback') {
    if (!opts.rollbackFile || !fs.existsSync(opts.rollbackFile)) {
      throw new Error(`Snapshot file not found: ${opts.rollbackFile ?? '(missing)'}`)
    }
    const raw = JSON.parse(fs.readFileSync(opts.rollbackFile, 'utf-8'))
    const snapshot = testJobsSnapshotSchema.parse(raw)
    const plan = buildRollbackTestJobsPlan(snapshot)

    await prisma.$transaction(async tx => {
      if (plan.setFalseIds.length > 0) {
        await tx.job.updateMany({ where: { id: { in: plan.setFalseIds } }, data: { isTest: false } })
      }
      if (plan.setTrueIds.length > 0) {
        await tx.job.updateMany({ where: { id: { in: plan.setTrueIds } }, data: { isTest: true } })
      }
    })
    console.log(`✓ Rolled back ${snapshot.entries.length} job(s) from ${opts.rollbackFile}`)
    return
  }

  const rows = await prisma.job.findMany({
    orderBy: { openedAt: 'desc' },
    select: {
      id: true,
      jobNo: true,
      customerName: true,
      customerPhone: true,
      productName: true,
      symptom: true,
      createdBy: true,
      stage: true,
      openedAt: true,
      isTest: true,
      branch: { select: { name: true } },
    },
  })

  const inputs = rows.map(r => ({
    id: r.id,
    jobNo: r.jobNo,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    productName: r.productName,
    symptom: r.symptom,
    createdBy: r.createdBy,
    stage: r.stage,
    branchName: r.branch.name,
    openedAt: r.openedAt,
    isTest: r.isTest,
  }))

  const plan = buildMarkTestJobsPlan(inputs, opts.explicitJobNos)
  console.log(`Scanned ${rows.length} total jobs. Found ${plan.candidates.length} test job candidate(s):\n`)

  for (const c of plan.candidates) {
    const statusTag = c.isTest ? '[ALREADY isTest=true]' : '[WILL MARK isTest=true]'
    console.log(
      `  • ${c.jobNo} | ลูกค้า: ${c.customerName ?? '-'} | สินค้า: ${c.productName} | สาขา: ${c.branchName} | สถานะ: ${c.stage} | ${statusTag}`
    )
    console.log(`    เหตุผล: ${c.reasons.join(', ')}`)
  }

  if (opts.mode === 'dry-run') {
    console.log(`\n[DRY-RUN] ยังไม่ได้แก้ไขข้อมูลในฐานข้อมูล (${plan.toUpdateIds.length} รายการที่จะถูกตั้ง isTest=true)`)
    console.log(`หากตรวจสอบรายการแล้วถูกต้อง ให้รัน: npx tsx scripts/mark-test-jobs.ts --apply\n`)
    return
  }

  const backupDir = path.join(process.cwd(), 'backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const snapshotPath = path.join(backupDir, `test-jobs-${stamp}.json`)
  fs.writeFileSync(snapshotPath, JSON.stringify(plan.snapshot, null, 2), 'utf-8')

  if (plan.toUpdateIds.length > 0) {
    await prisma.job.updateMany({
      where: { id: { in: plan.toUpdateIds } },
      data: { isTest: true },
    })
  }

  console.log(`\n✓ Marked ${plan.toUpdateIds.length} job(s) as isTest = true.`)
  console.log(`✓ Saved rollback snapshot to: ${snapshotPath}`)
  console.log(`  (To undo: npx tsx scripts/mark-test-jobs.ts --rollback "${snapshotPath}")\n`)
}

run()
  .catch(err => {
    console.error('Error:', err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
