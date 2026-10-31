'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { VendorSetupWizard } from '@/components/vendor-setup/VendorSetupWizard'
import { VendorDirectoryList } from './VendorDirectoryList'
import { CopyRegisterLinkButton } from '@/components/vendor-setup/CopyRegisterLinkButton'
import { VendorPendingBadgeButton } from './vendor/VendorPendingBadgeButton'
import { VendorProductGroupsPanel } from './vendor/VendorProductGroupsPanel'
import { Users, Wand2, Layers } from 'lucide-react'

export function VendorSection() {
  const [tab, setTab] = useState<'directory' | 'groups' | 'setup'>('directory')

  return (
    <div className="space-y-4">
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
            onClick={() => setTab('groups')}
            className={`btn text-xs flex items-center gap-1.5 transition-all ${
              tab === 'groups' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> จัดการกลุ่มสินค้า (Product Groups)
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
          <Link href="/admin/product-types" className="btn btn-secondary text-xs inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> หน้าจอ Master ประเภทสินค้า
          </Link>
          <CopyRegisterLinkButton />
          <VendorPendingBadgeButton />
        </div>
      </div>

      {tab === 'directory' && <VendorDirectoryList onOpenWizard={() => setTab('setup')} />}
      {tab === 'groups' && <VendorProductGroupsPanel />}
      {tab === 'setup' && (
        <div className="pt-2">
          <VendorSetupWizard mode="admin" onFinish={() => setTab('directory')} />
        </div>
      )}
    </div>
  )
}
