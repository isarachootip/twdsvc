/**
 * One-off maintenance: hard-delete a Site (store) by code, including all jobs
 * attached to it and their child records.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/delete-site-by-code.ts BNA            # dry-run
 *   DATABASE_URL="postgresql://..." npx tsx scripts/delete-site-by-code.ts BNA --confirm  # execute
 *
 * Safety:
 *   - Dry-run by default; prints everything that would be removed.
 *   - Aborts if any job is referenced by payout lines or trade-ins (financial records).
 *   - All writes run in a single transaction.
 */
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const argsSchema = z.object({
  code: z.string().trim().min(1, "Site code is required"),
  confirm: z.boolean(),
});

type Args = z.infer<typeof argsSchema>;

function parseArgs(argv: readonly string[]): Args {
  const positional = argv.filter((a) => !a.startsWith("--"));
  return argsSchema.parse({ code: positional[0] ?? "", confirm: argv.includes("--confirm") });
}

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const { code, confirm } = parseArgs(process.argv.slice(2));
  const host = (process.env.DATABASE_URL ?? "").replace(/:\/\/[^@]+@/, "://***@");
  console.log(`DB: ${host}`);
  console.log(`Mode: ${confirm ? "EXECUTE" : "DRY-RUN"}\n`);

  const site = await prisma.site.findUnique({ where: { code } });
  if (!site) {
    console.log(`Site code "${code}" not found. Nothing to do.`);
    return;
  }
  console.log("Site:", { id: site.id, code: site.code, name: site.name, nickname: site.nickname });

  const jobs = await prisma.job.findMany({
    where: { branchId: site.id },
    select: {
      id: true, jobNo: true, stage: true, productName: true, customerName: true,
      _count: {
        select: {
          items: true, events: true, charges: true, shipments: true, quotes: true,
          payments: true, publicTokens: true, slaClocks: true, payoutLines: true, tradeIns: true,
        },
      },
    },
  });
  console.log(`\nJobs (${jobs.length}):`);
  for (const j of jobs) console.log(" -", j.jobNo, j.stage, j.productName, j.customerName, j._count);

  const jobIds = jobs.map((j) => j.id);
  const users = await prisma.user.findMany({ where: { siteId: site.id }, select: { username: true } });
  const routes = await prisma.branchVendorRoute.count({
    where: { OR: [{ branchId: site.id }, { dcSiteId: site.id }] },
  });
  const zoneCenters = await prisma.vendorCenter.count({ where: { zoneSiteId: site.id } });
  console.log(`\nUsers to detach (siteId -> null): ${users.map((u) => u.username).join(", ") || "none"}`);
  console.log(`Branch-vendor routes to delete: ${routes}`);
  console.log(`Vendor centers to detach (zoneSiteId -> null): ${zoneCenters}`);

  const blocked = jobs.filter((j) => j._count.payoutLines > 0 || j._count.tradeIns > 0);
  if (blocked.length > 0) {
    console.error(`\nABORT: jobs linked to payout lines / trade-ins: ${blocked.map((j) => j.jobNo).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  if (!confirm) {
    console.log("\nDry-run complete. Re-run with --confirm to delete.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Job children are onDelete: Cascade (items, events->attachments, charges,
    // shipments, quotes->lines, payments, publicTokens, slaClocks).
    const deletedJobs = await tx.job.deleteMany({ where: { id: { in: jobIds } } });
    const deletedRoutes = await tx.branchVendorRoute.deleteMany({
      where: { OR: [{ branchId: site.id }, { dcSiteId: site.id }] },
    });
    const detachedUsers = await tx.user.updateMany({ where: { siteId: site.id }, data: { siteId: null } });
    const detachedCenters = await tx.vendorCenter.updateMany({
      where: { zoneSiteId: site.id },
      data: { zoneSiteId: null },
    });
    await tx.site.delete({ where: { id: site.id } });
    console.log("\nDeleted:", {
      jobs: deletedJobs.count,
      routes: deletedRoutes.count,
      usersDetached: detachedUsers.count,
      vendorCentersDetached: detachedCenters.count,
      site: site.code,
    });
  });
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
