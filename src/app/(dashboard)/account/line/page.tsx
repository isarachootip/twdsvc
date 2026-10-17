import { LineLinkCard } from '@/components/account/LineLinkCard'

export const metadata = { title: 'เชื่อมต่อ LINE | SVC' }

export default function LineLinkPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>เชื่อมต่อบัญชี LINE</h1>
      <p className="text-xs mb-4" style={{ color: 'var(--text-2)' }}>
        ผูกบัญชีผู้ใช้งานของคุณกับ LINE Official Account เพื่อรับแจ้งเตือนงานซ่อมและสถานะ SLA อัตโนมัติ
      </p>
      <LineLinkCard />
    </div>
  )
}

