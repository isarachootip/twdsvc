'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastProvider from '@/components/ui/Toast'

interface Props {
  user: { id: string; fullName: string; role: string; siteId?: string | null; siteName?: string | null; vendorLabel?: string | null }
  menus: string[]
  children: React.ReactNode
}

export default function AppShell({ user, menus, children }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <Sidebar user={user} menus={menus} open={open} onClose={() => setOpen(false)} />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar user={user} onMenu={() => setOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
