import { guardPage } from '@/lib/page-guard'
import { prisma } from '@/lib/db'
import CsNewForm from './CsNewForm'

export const dynamic = 'force-dynamic'

export default async function CsNewPage() {
  const user = await guardPage('cs')
  const branches = await prisma.site.findMany({
    where: { type: 'BRANCH', active: true },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true },
  })
  return (
    <CsNewForm
      role={user.role}
      branchName={user.siteName ?? ''}
      userBranchId={user.siteId ?? ''}
      branches={branches}
    />
  )
}
