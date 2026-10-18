'use client'

import React, { useState } from 'react'
import { VendorSetupWizard } from '@/components/vendor-setup/VendorSetupWizard'
import { VendorDirectoryList } from './VendorDirectoryList'
import { CopyRegisterLinkButton } from '@/components/vendor-setup/CopyRegisterLinkButton'
import { VendorPendingBadgeButton } from './vendor/VendorPendingBadgeButton'
import { Users, Wand2 } from 'lucide-react'

export function VendorSection() {
  const [tab, setTab] = useState<'directory' | 'setup'>('directory')

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Quick Navigation */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('directory')}
            className={`btn text-xs flex items-center gap-1.5 transition-all ${
              tab === 'directory' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> รายชื่อคู่ค้าเดิม (Directory)
          </button>
          <button
            type="button"
            onClick={() => setTab('setup')}
            className={`btn text-xs flex items-center gap-1.5 transition-all ${
              tab === 'setup' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" /> ตัวช่วยตั้งค่า (Vendor Setup Wizard)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CopyRegisterLinkButton />
          <VendorPendingBadgeButton />
        </div>
      </div>

      {/* Main Content Area */}
      {tab === 'directory' ? (
        <VendorDirectoryList onOpenWizard={() => setTab('setup')} />
      ) : (
        <div className="pt-2">
          <VendorSetupWizard mode="admin" onFinish={() => setTab('directory')} />
        </div>
      )}
    </div>
  )
}
