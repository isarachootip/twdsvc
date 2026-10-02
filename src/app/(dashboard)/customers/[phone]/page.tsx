import { guardPage } from '@/lib/page-guard'
import CustomerDetailView from './CustomerDetailView'

export const dynamic = 'force-dynamic'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>
}) {
  const user = await guardPage('customers')
  const { phone } = await params

  return <CustomerDetailView phone={phone} role={user.role} />
}
