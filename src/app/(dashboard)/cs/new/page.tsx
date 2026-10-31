import { guardPage } from '@/lib/page-guard'
import { prisma } from '@/lib/db'
import { dedupeAndFilterSites } from '@/lib/sites-query'
import CsNewForm from './CsNewForm'

export const dynamic = 'force-dynamic'

export default async function CsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; productName?: string; serialNo?: string }>
}) {
  const user = await guardPage('cs')
  const resolvedParams = await searchParams
  const rawBranches = await prisma.site.findMany({
    where: { type: 'BRANCH', active: true },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      stCode: true,
      nickname: true,
      name: true,
      nameEn: true,
      legalName: true,
      address: true,
      subdistrict: true,
      district: true,
      province: true,
      postalCode: true,
      phone: true,
    },
  })
  const branches = dedupeAndFilterSites(rawBranches)
  return (
    <CsNewForm
      role={user.role}
      branchName={user.siteName ?? ''}
      userBranchId={user.siteId ?? ''}
      branches={branches}
      initialPhone={resolvedParams.phone ?? ''}
      initialProduct={resolvedParams.productName ?? ''}
      initialSerialNo={resolvedParams.serialNo ?? ''}
    />
  )
}
