import { Suspense } from 'react'
import { guardPage } from '@/lib/page-guard'
import JobsClient from './JobsClient'

export const dynamic = 'force-dynamic'

export default async function JobsPage() {
  const user = await guardPage('jobs')
  return (
    <Suspense fallback={<div className="page"><div className="empty">กำลังโหลด…</div></div>}>
      <JobsClient role={user.role} user={user} />
    </Suspense>
  )
}
