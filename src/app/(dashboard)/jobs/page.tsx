import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import JobsClient from './JobsClient'

export default async function JobsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Server-side initial fetch
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/jobs?limit=100`,
    { cache: 'no-store', headers: { Cookie: `access_token=${process.env.__TEST_TOKEN ?? ''}` } }
  )
  const data = res.ok ? await res.json() : { jobs: [], total: 0 }

  return <JobsClient initialJobs={data.jobs} user={user} />
}
