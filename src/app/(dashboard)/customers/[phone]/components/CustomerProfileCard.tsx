import Link from 'next/link'
import { User, Phone, MapPin, Receipt, Plus, CheckCircle, Clock, Wrench } from 'lucide-react'
import { fmtPhone, fmtBaht, fmtDate } from '@/lib/constants'
import type { CustomerDetailProfile } from '@/lib/validations/customer'

interface Props {
  profile: CustomerDetailProfile
  canCreateJob: boolean
}

export default function CustomerProfileCard({ profile, canCreateJob }: Props) {
  const { stats } = profile

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 mb-6" style={{ borderColor: 'var(--border)' }}>
      {/* Header Info & Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100/80 text-red-600 font-bold text-lg">
            <User size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">{profile.name}</h2>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {fmtPhone(profile.phone)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
              {stats.firstSeenAt && (
                <span>ลูกค้าตั้งแต่: {fmtDate(stats.firstSeenAt)}</span>
              )}
              {stats.lastSeenAt && (
                <span>รับบริการล่าสุด: {fmtDate(stats.lastSeenAt)}</span>
              )}
            </div>
          </div>
        </div>

        {canCreateJob && (
          <Link
            href={`/cs/new?phone=${encodeURIComponent(profile.phone)}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>เปิดใบแจ้งซ่อมใหม่</span>
          </Link>
        )}
      </div>

      {/* 2-Column: Details and Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact & Tax Info */}
        <div className="space-y-2.5 text-xs text-gray-600 bg-gray-50/60 p-3.5 rounded-lg border border-gray-100">
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-gray-800">ที่อยู่จัดส่ง / ติดต่อ:</span>
              <p className="text-gray-600 mt-0.5">{profile.address || '-'} {profile.zip ? `รหัสไปรษณีย์ ${profile.zip}` : ''}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2 border-t border-gray-200/60">
            <Receipt size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-gray-800">ข้อมูลใบกำกับภาษี:</span>
              {profile.taxInvoiceId ? (
                <p className="text-gray-600 mt-0.5">
                  {profile.taxInvoiceName} (เลขผู้เสียภาษี: {profile.taxInvoiceId})
                  {profile.taxInvoiceAddr && <span className="block text-gray-500">{profile.taxInvoiceAddr}</span>}
                </p>
              ) : (
                <p className="text-gray-400 mt-0.5">ไม่ออกใบกำกับภาษีเต็มรูป</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg border bg-white flex flex-col justify-center" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Wrench size={13} className="text-blue-500" />
              งานซ่อมทั้งหมด
            </span>
            <span className="text-lg font-bold text-gray-900 mt-0.5">{stats.totalJobs} <span className="text-xs font-normal text-gray-500">งาน</span></span>
          </div>

          <div className="p-3 rounded-lg border bg-white flex flex-col justify-center" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Clock size={13} className="text-amber-500" />
              กำลังดำเนินการ
            </span>
            <span className="text-lg font-bold text-amber-600 mt-0.5">{stats.activeJobs} <span className="text-xs font-normal text-gray-500">งาน</span></span>
          </div>

          <div className="p-3 rounded-lg border bg-white flex flex-col justify-center" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <CheckCircle size={13} className="text-emerald-500" />
              ซ่อมเสร็จสิ้น
            </span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5">{stats.completedJobs} <span className="text-xs font-normal text-gray-500">งาน</span></span>
          </div>

          <div className="p-3 rounded-lg border bg-white flex flex-col justify-center" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[11px] text-gray-500">ยอดค่าบริการสะสม</span>
            <span className="text-lg font-bold text-gray-900 mt-0.5">{fmtBaht(stats.totalSpendBaht)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
