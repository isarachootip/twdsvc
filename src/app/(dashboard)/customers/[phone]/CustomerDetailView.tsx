'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, AlertCircle, Wrench } from 'lucide-react'
import { api } from '@/lib/client'
import type { CustomerDetailProfile } from '@/lib/validations/customer'
import CustomerProfileCard from './components/CustomerProfileCard'
import CustomerDeviceCard from './components/CustomerDeviceCard'

interface Props {
  phone: string
  role: string
}

export default function CustomerDetailView({ phone, role }: Props) {
  const [profile, setProfile] = useState<CustomerDetailProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canCreateJob = ['CS', 'ADMIN'].includes(role)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api<CustomerDetailProfile>(`/api/customers/${encodeURIComponent(phone)}`)
      .then(res => setProfile(res))
      .catch(err => {
        setError(err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลลูกค้าได้')
      })
      .finally(() => setLoading(false))
  }, [phone])

  if (loading) {
    return (
      <div className="page-wide p-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2 min-h-[300px]" style={{ maxWidth: 1180 }}>
        <RefreshCw size={24} className="animate-spin text-red-500" />
        <span>กำลังดึงข้อมูลประวัติลูกค้า 360°...</span>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="page-wide p-8" style={{ maxWidth: 1180 }}>
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 mb-4 transition-colors">
          <ArrowLeft size={14} />
          <span>กลับไปหน้ารายชื่อลูกค้า</span>
        </Link>
        <div className="p-6 rounded-xl border border-red-100 bg-red-50/50 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{error || 'ไม่พบข้อมูลลูกค้าสำหรับเบอร์โทรศัพท์นี้'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wide" style={{ maxWidth: 1180 }}>
      {/* Breadcrumb / Back button */}
      <div className="mb-4">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>กลับไปหน้ารายชื่อลูกค้า</span>
        </Link>
      </div>

      {/* Customer Profile Card */}
      <CustomerProfileCard profile={profile} canCreateJob={canCreateJob} />

      {/* Devices & Repair History Section */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench size={18} className="text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900">
            รายการสินค้าและประวัติการซ่อม ({profile.devices.length} เครื่อง)
          </h3>
        </div>
        <span className="text-xs text-gray-400">
          จัดกลุ่มประวัติตาม Serial Number
        </span>
      </div>

      {/* Device Cards List */}
      {profile.devices.length === 0 ? (
        <div className="p-8 rounded-xl border bg-white text-center text-xs text-gray-400" style={{ borderColor: 'var(--border)' }}>
          ไม่พบรายการสินค้าที่เคยส่งซ่อมสำหรับลูกค้ารายนี้
        </div>
      ) : (
        <div className="space-y-4">
          {profile.devices.map(device => (
            <CustomerDeviceCard
              key={device.deviceKey}
              device={device}
              phone={profile.phone}
              canCreateJob={canCreateJob}
            />
          ))}
        </div>
      )}
    </div>
  )
}
