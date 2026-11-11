'use client'

import React from 'react'

interface SectionCardProps {
  stepNo: number | string
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function SectionCard({ stepNo, title, subtitle, children }: SectionCardProps) {
  return (
    <section className="pcard space-y-4 print:break-inside-avoid">
      <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
        <div className="w-7 h-7 rounded-lg bg-red-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
          {stepNo}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4 text-xs">{children}</div>
    </section>
  )
}

interface InfoItemProps {
  label: string
  value: React.ReactNode
  mono?: boolean
  highlightClass?: string
}

export function InfoItem({ label, value, mono = false, highlightClass }: InfoItemProps) {
  const isEmpty = value === null || value === undefined || value === '' || value === '-'
  return (
    <div className="space-y-0.5">
      <span className="block text-[11px] text-slate-500">{label}</span>
      <span
        className={`block text-xs font-semibold ${mono ? 'font-mono' : ''} ${
          isEmpty ? 'text-slate-400 font-normal' : highlightClass || 'text-slate-900'
        }`}
      >
        {isEmpty ? '-' : value}
      </span>
    </div>
  )
}

interface InlineDotListProps {
  items: string[]
  dotColorClass?: string
  textColorClass?: string
  emptyText?: string
}

export function InlineDotList({
  items,
  dotColorClass = 'bg-slate-500',
  textColorClass = 'text-slate-800',
  emptyText = '-',
}: InlineDotListProps) {
  if (!items || items.length === 0) {
    return <span className="text-xs text-slate-400">{emptyText}</span>
  }
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item, idx) => (
        <span key={`${item}-${idx}`} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${textColorClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`} />
          {item}
        </span>
      ))}
    </div>
  )
}
