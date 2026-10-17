import { loadManualCatalog } from '@/lib/manual-catalog'
import ManualClient from './ManualClient'

export const dynamic = 'force-dynamic'

export default async function ManualPage() {
  const catalog = await loadManualCatalog()
  return <ManualClient catalog={catalog} />
}
