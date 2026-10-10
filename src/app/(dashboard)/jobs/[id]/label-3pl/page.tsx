import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { guardPage } from '@/lib/page-guard'
import { buildCaseA3PlLabel } from '@/lib/threepl-label'
import LabelPrintClient from './LabelPrintClient'

export const dynamic = 'force-dynamic'

export default async function JobLabel3PlPage({ params }: { params: Promise<{ id: string }> }) {
  await guardPage('jobs')
  const { id } = await params

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      branch: true,
      vendorCenter: { include: { vendorParent: true } },
      shipments: { where: { carrier: 'TPL' }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  if (!job) notFound()

  const labelData = buildCaseA3PlLabel({
    jobNo: job.jobNo,
    productName: job.productName,
    symptom: job.symptom,
    sizeCategoryId: job.sizeCategoryId,
    openedAt: job.openedAt,
    branch: job.branch,
    vendor: job.vendorCenter ? {
      name: job.vendorCenter.vendorParent.name,
      centerCode: job.vendorCenter.code,
      phone: job.vendorCenter.phone,
      address: job.vendorCenter.address,
    } : null,
    trackingNo: job.shipments[0]?.trackingNo ?? null,
  })

  return <LabelPrintClient data={labelData} />
}
