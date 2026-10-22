import { VendorSetupWizardV6 } from '@/components/vendor-setup/VendorSetupWizardV6'
import { queryActiveBranchSites } from '@/lib/sites-query'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'สมัครเข้าร่วมโครงการศูนย์ซ่อมสินค้า · ไทวัสดุ (Service Center)',
  description: 'แบบฟอร์มสมัครเข้าร่วมโครงการศูนย์ซ่อมสินค้าพันธมิตร ไทวัสดุ Carry-in และ On-site',
}

export default async function VendorRegisterPage() {
  const activeBranches = await queryActiveBranchSites().catch(() => [])
  const branchCount = activeBranches.length || 85

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: 'var(--bg, #F4F4F3)', fontFamily: "var(--font-sarabun), 'Sarabun', sans-serif" }}>
      {/* Top Brand Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              ท
            </div>
            <div>
              <div className="font-bold text-red-700 leading-tight text-base tracking-tight">ไทวัสดุ</div>
              <div className="text-[10px] text-slate-500 tracking-wider font-semibold">THAIWATSADU · SERVICE CENTER</div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              เปิดรับศูนย์บริการ {branchCount} สาขาทั่วประเทศ
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-red-700 text-white py-6 px-4 shadow-xs">
        <div className="max-w-5xl mx-auto space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            แบบฟอร์มสมัครเข้าร่วมโครงการศูนย์ซ่อมสินค้า (Service Center)
          </h1>
          <p className="text-xs sm:text-sm text-red-100 max-w-3xl">
            สำหรับศูนย์ซ่อมพันธมิตร งาน Carry-in และ On-site • เครือข่ายไทวัสดุทั่วประเทศ
          </p>
        </div>
      </section>

      {/* Main Wizard */}
      <main className="max-w-5xl mx-auto px-4 mt-6">
        <VendorSetupWizardV6 />
      </main>
    </div>
  )
}
