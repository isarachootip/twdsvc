import { Suspense } from 'react'
import { guardPage } from '@/lib/page-guard'
import QuoteForm from './QuoteForm'

export const dynamic = 'force-dynamic'

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await guardPage('vd')
  const { id } = await params
  return (
    <Suspense fallback={<div className="empty">กำลังโหลด…</div>}>
      <QuoteForm jobId={id} role={user.role} />
    </Suspense>
  )
}
