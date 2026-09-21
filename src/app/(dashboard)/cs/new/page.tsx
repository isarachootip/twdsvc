import { guardPage } from '@/lib/page-guard'
import CsNewForm from './CsNewForm'

export const dynamic = 'force-dynamic'

export default async function CsNewPage() {
  const user = await guardPage('cs')
  return <CsNewForm role={user.role} branchName={user.siteName ?? ''} />
}
