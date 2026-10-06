'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { VendorSetupWizard } from '@/components/vendor-setup/VendorSetupWizard'
import { VendorDirectoryList } from './VendorDirectoryList'
import { Settings, Users, FileCheck } from 'lucide-react'

export function VendorSection() {
  const [tab, setTab] = useState<'setup' | 'directory'>('setup')

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Quick Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('setup')}
            className={`btn text-xs flex items-center gap-1.5 transition-all ${
              tab === 'setup' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> ตั้งค่าคู่ค้า (Vendor Setup Wizard)
          </button>
          <button
            type="button"
            onClick={() => setTab('directory')}
            className={`btn text-xs flex items-center gap-1.5 transition-all ${
              tab === 'directory' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> รายชื่อคู่ค้าเดิม (Directory)
          </button>
        </div>

        <Link
          href="/admin/vendors/applications"
          className="btn btn-secondary text-xs flex items-center gap-1.5"
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> ตรวจสอบใบสมัครคู่ค้าใหม่
        </Link>
      </div>

      {/* Main Content Area */}
      {tab === 'setup' ? (
        <div className="pt-2">
          <VendorSetupWizard />
        </div>
      ) : (
        <VendorDirectoryList onOpenWizard={() => setTab('setup')} />
      )}
    </div>
  )
}
