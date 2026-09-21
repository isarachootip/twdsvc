import { notFound } from 'next/navigation'
import { guardPage } from '@/lib/page-guard'
import AdminClient from '../AdminClient'
import { VALID_SECTIONS } from '../constants'

export const dynamic = 'force-dynamic'

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  await guardPage('admin')
  const { section } = await params
  if (!VALID_SECTIONS.has(section)) {
    notFound()
  }
  return <AdminClient section={section} />
}
