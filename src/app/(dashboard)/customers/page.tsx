import { guardPage } from '@/lib/page-guard'
import CustomerDirectoryView from './CustomerDirectoryView'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const user = await guardPage('customers')
  return <CustomerDirectoryView role={user.role} />
}
