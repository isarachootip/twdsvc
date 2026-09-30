import { Suspense } from 'react'
import { guardPage } from '@/lib/page-guard'
import GrClient from './GrClient'

export const dynamic = 'force-dynamic'

export default async function GrPage() {
  const user = await guardPage('gr')
  return (
    <Suspense fallback={<div className="page-wide"><div className="empty">กำลังโหลด…</div></div>}>
      <GrClient role={user.role} />
    </Suspense>
  )
}
