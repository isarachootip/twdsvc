import { Suspense } from 'react'
import { guardPage } from '@/lib/page-guard'
import ExecClient from './ExecClient'

export const dynamic = 'force-dynamic'

export default async function ExecPage() {
  await guardPage('exec')
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 text-sm">กำลังโหลด...</div>}>
      <ExecClient />
    </Suspense>
  )
}
