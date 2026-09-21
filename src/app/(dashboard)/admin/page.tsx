import { redirect } from 'next/navigation'
import { guardPage } from '@/lib/page-guard'

export const dynamic = 'force-dynamic'

export default async function AdminIndex() {
  await guardPage('admin')
  redirect('/admin/vendor')
}
