import { guardPage } from '@/lib/page-guard'
import CsQueue from './CsQueue'

export const dynamic = 'force-dynamic'

export default async function CsPage() {
  const user = await guardPage('cs')
  return <CsQueue role={user.role} />
}
