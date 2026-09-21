import { Suspense } from 'react'
import { guardPage } from '@/lib/page-guard'
import JobDetailModal from '@/components/jobs/JobDetail'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await guardPage('jobs')
  const { id } = await params

  return (
    <Suspense fallback={<div className="empty">กำลังโหลดรายละเอียดงาน…</div>}>
      <JobDetailModal jobId={id} role={user.role} standalone={true} />
    </Suspense>
  )
}
