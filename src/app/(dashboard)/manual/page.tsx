import { loadManualCatalog } from '@/lib/manual-loader'
import ManualClient from './ManualClient'

export const dynamic = 'force-dynamic'

export default async function ManualPage() {
  const catalog = await loadManualCatalog()
  return <ManualClient catalog={catalog} />
}
