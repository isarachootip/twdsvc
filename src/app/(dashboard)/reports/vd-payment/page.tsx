import { Suspense } from 'react'
import { guardPage } from '@/lib/page-guard'
import VdPaymentClient from './VdPaymentClient'

export const dynamic = 'force-dynamic'

export default async function VdPaymentPage() {
  const user = await guardPage('vd_payment')
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 text-sm">กำลังโหลด...</div>}>
      <VdPaymentClient role={user.role} />
    </Suspense>
  )
}
