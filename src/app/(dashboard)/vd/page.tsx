import { guardPage } from '@/lib/page-guard'
import VdClient from './VdClient'

export const dynamic = 'force-dynamic'

export default async function VdPage() {
  const user = await guardPage('vd')
  return <VdClient role={user.role} />
}
