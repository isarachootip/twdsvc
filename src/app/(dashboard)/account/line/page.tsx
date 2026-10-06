import { LineLinkCard } from '@/components/account/LineLinkCard'

export const metadata = { title: 'เชื่อมต่อ LINE | SVC' }

export default function LineLinkPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>เชื่อมต่อบัญชี LINE</h1>
      <LineLinkCard />
    </div>
  )
}
