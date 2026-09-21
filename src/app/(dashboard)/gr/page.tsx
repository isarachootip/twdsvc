import { guardPage } from '@/lib/page-guard'
import GrClient from './GrClient'

export const dynamic = 'force-dynamic'

export default async function GrPage() {
  const user = await guardPage('gr')
  return <GrClient role={user.role} />
}
