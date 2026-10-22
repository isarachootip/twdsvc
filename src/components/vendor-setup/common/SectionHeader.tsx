'use client'

import React from 'react'

interface SectionHeaderProps {
  stepNo: number
  title: string
  subtitle?: string
}

export function SectionHeader({ stepNo, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white bg-red-700 text-sm shadow-xs shrink-0">
        {stepNo}
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
