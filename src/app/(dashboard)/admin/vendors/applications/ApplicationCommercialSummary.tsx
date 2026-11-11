'use client'

import React from 'react'
import { extractApplicationCommercialTerms } from '@/lib/vendor-billing-cycle'

interface ApplicationCommercialSummaryProps {
  agreements?: unknown
}

export function ApplicationCommercialSummary({ agreements }: ApplicationCommercialSummaryProps) {
  const commercial = extractApplicationCommercialTerms(agreements)

  return (
    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
      <h4 className="font-bold text-slate-800">เงื่อนไขทางการค้าและรอบการชำระเงิน</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <span className="text-slate-500">เครดิตเทอมการชำระเงิน:</span>{' '}
          <span className="font-semibold text-slate-800">{commercial.creditTerm}</span>
        </div>
        <div>
          <span className="text-slate-500">รอบวางบิล / จ่ายเงิน:</span>{' '}
          <span className="font-semibold text-emerald-700">{commercial.billingCycle}</span>
        </div>
      </div>
    </div>
  )
}
