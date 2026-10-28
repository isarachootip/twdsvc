'use client'

import React from 'react'

interface OnsiteLockNoticeProps {
  message?: string
}

export function OnsiteLockNotice({
  message = 'ไม่ต้องกรอก (ไม่ได้เลือกบริการ On-site ในข้อ 2.2)',
}: OnsiteLockNoticeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
      <span>{message}</span>
    </span>
  )
}
