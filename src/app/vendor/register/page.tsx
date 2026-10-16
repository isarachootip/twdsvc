import { VendorSetupWizard } from '@/components/vendor-setup/VendorSetupWizard'
import { Wrench } from 'lucide-react'
import { queryActiveBranchSites } from '@/lib/sites-query'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'สมัครเข้าร่วมเป็นคู่ค้าศูนย์บริการ (Vendor Onboarding) | SVC',
  description: 'ระบบลงทะเบียนและตั้งค่าคู่ค้าศูนย์บริการซ่อมมาตรฐานเครือข่าย SVC',
}

export default async function VendorRegisterPage() {
  const activeBranches = await queryActiveBranchSites().catch(() => [])
  const branchCount = activeBranches.length || 92

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--red)' }}>
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              SVC Vendor Onboarding Portal
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              ลงทะเบียนคู่ค้าศูนย์ซ่อม • เครือข่าย {branchCount} สาขาทั่วประเทศ • ระบบจ่ายงานและประกันรายได้
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            เปิดรับสมัครคู่ค้าใหม่
          </span>
        </div>
      </div>

      {/* Main Wizard */}
      <VendorSetupWizard />
    </div>
  )
}
