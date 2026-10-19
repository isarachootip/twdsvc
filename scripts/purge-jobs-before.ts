/**
 * Permanently delete jobs opened before a cutoff date (Bangkok time), then clear isTest on all remaining jobs.
 *
 *   npx tsx scripts/purge-jobs-before.ts                                         # dry-run (default cutoff 2026-10-12)
 *   npx tsx scripts/purge-jobs-before.ts --before 2026-10-12                     # dry-run with explicit cutoff
 *   npx tsx scripts/purge-jobs-before.ts --apply --confirm-db <dbname>           # delete for real (irreversible)
 *
 * In one transaction: payout lines of purged jobs are removed (batches left empty are deleted),
 * trade-in coupons are detached (jobId = null), jobs are deleted (children cascade), and isTest is reset.
 */
import { PrismaClient } from '@prisma/client'
import { assertConfirmedDb, cutoffFromDate, parsePurgeArgs, planPayoutCleanup } from './lib/purge-jobs-plan'
import { parseDbTarget } from './lib/test-accounts-cli'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  const args = parsePurgeArgs(process.argv.slice(2))
  const target = parseDbTarget(process.env.DATABASE_URL)
  assertConfirmedDb(args, target.database)
  const cutoff = cutoffFromDate(args.before)

  console.log(`Target database : ${target.host}/${target.database}`)
  console.log(`Mode            : ${args.mode.toUpperCase()}`)
  console.log(`Purge jobs with openedAt < ${cutoff.toISOString()} (${args.before} 00:00 Asia/Bangkok)\n`)

  const jobs = await prisma.job.findMany({
    where: { openedAt: { lt: cutoff } },
    select: { id: true },
  })
  const ids = jobs.map(j => j.id)
  const [total, flagged, payoutLines, tradeIns] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { isTest: true, openedAt: { gte: cutoff } } }),
    prisma.payoutBatchLine.findMany({ where: { jobId: { in: ids } }, select: { batchId: true } }),
    prisma.tradeIn.count({ where: { jobId: { in: ids } } }),
  ])
  const affectedBatchIds = [...new Set(payoutLines.map(l => l.batchId))]
  const batchLines = await prisma.payoutBatchLine.findMany({
    where: { batchId: { in: affectedBatchIds } },
    select: { batchId: true, jobId: true },
  })
  const payout = planPayoutCleanup(batchLines, ids)

  console.log(`Jobs total                 : ${total}`)
  console.log(`Jobs to DELETE             : ${ids.length}`)
  console.log(`Jobs kept                  : ${total - ids.length}`)
  console.log(`Kept jobs to un-flag isTest: ${flagged}`)
  console.log(`Payout lines to delete     : ${payoutLines.length} (empty batches deleted: ${payout.emptyBatchIds.length})`)
  console.log(`Trade-ins to detach        : ${tradeIns}`)
  if (payout.partialBatchIds.length > 0) {
    const partial = await prisma.payoutBatch.findMany({ where: { id: { in: payout.partialBatchIds } }, select: { batchNo: true } })
    console.log(`⚠ Batches keeping other jobs (totalAmount not recalculated): ${partial.map(b => b.batchNo).join(', ')}`)
  }

  if (args.mode === 'dry-run') {
    console.log('\nDRY-RUN: nothing was changed. Re-run with --apply --confirm-db <dbname> to delete.')
    return
  }

  await prisma.$transaction(
    async tx => {
      await tx.payoutBatchLine.deleteMany({ where: { jobId: { in: ids } } })
      await tx.payoutBatch.deleteMany({ where: { id: { in: payout.emptyBatchIds } } })
      await tx.tradeIn.updateMany({ where: { jobId: { in: ids } }, data: { jobId: null } })
      await tx.job.deleteMany({ where: { id: { in: ids } } })
      await tx.job.updateMany({ where: { isTest: true }, data: { isTest: false } })
    },
    { timeout: 120_000 }
  )
  console.log(`\n✓ Deleted ${ids.length} job(s); remaining jobs: ${await prisma.job.count()}; isTest reset on all jobs.`)
}

main()
  .catch(e => {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
