'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileCheck } from 'lucide-react'

export function VendorPendingBadgeButton() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let unmounted = false
    fetch('/api/admin/vendor-applications?status=PENDING_APPROVAL')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (!unmounted && Array.isArray(data)) {
          setCount(data.length)
        }
      })
      .catch(() => {
        if (!unmounted) setCount(0)
      })
    return () => {
      unmounted = true
    }
  }, [])

  return (
    <Link
      href="/admin/vendors/applications"
      className="btn btn-secondary text-xs flex items-center gap-1.5 transition-all hover:bg-slate-100"
    >
      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
      <span>ใบสมัครรอตรวจสอบ</span>
      {count !== null && count > 0 && (
        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {count}
        </span>
      )}
    </Link>
  )
}
