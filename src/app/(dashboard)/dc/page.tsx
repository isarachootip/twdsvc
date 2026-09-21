import { guardPage } from '@/lib/page-guard'
import DcClient from './DcClient'

export const dynamic = 'force-dynamic'

export default async function DcPage() {
  const user = await guardPage('dc')
  return <DcClient role={user.role} />
}
