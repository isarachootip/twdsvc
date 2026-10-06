import { prisma } from '@/lib/db'
import { sendLinePush } from '@/lib/line'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'
import { buildVendorJobMessage } from '@/lib/services/job-notify-message'

export async function findVendorLineRecipients(vendorCenterId: string): Promise<{ id: string; lineUserId: string }[]> {
  const users = await prisma.user.findMany({
    where: { role: 'VD', active: true, vendorCenterId, lineUserId: { not: null } },
    select: { id: true, lineUserId: true },
  })
  return users.flatMap((u) => (u.lineUserId ? [{ id: u.id, lineUserId: u.lineUserId }] : []))
}

/** Best-effort LINE notice to linked VD users of the job's vendor center. Never throws. */
export async function notifyVendorOfJob(job: {
  jobNo: string
  vendorCenterId: string
}): Promise<void> {
  try {
    const full = await prisma.job.findFirst({
      where: { jobNo: job.jobNo },
      select: { productName: true, brandName: true },
    })
    if (!full) return
    const recipients = await findVendorLineRecipients(job.vendorCenterId)
    if (recipients.length === 0) return
    const baseUrl = (await getIntegrationConfig()).APP_BASE_URL || 'http://localhost:3000'
    const text = buildVendorJobMessage({ jobNo: job.jobNo, ...full }, baseUrl)
    await Promise.all(recipients.map((r) => sendLinePush(r.lineUserId, [{ type: 'text', text }])))
  } catch (err) {
    console.error('[notifyVendorOfJob]', err instanceof Error ? err.message : err)
  }
}
