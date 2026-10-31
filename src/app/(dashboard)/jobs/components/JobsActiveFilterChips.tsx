'use client'

import { statusFilterOptions } from '@/lib/job-status-filter'

interface JobsActiveFilterChipsProps {
  branch: string
  setBranch: (b: string) => void
  branches: Array<[string, string]>
  channel: string
  setChannel: (c: string) => void
  productGroup: string
  setProductGroup: (g: string) => void
  status: string
  setStatus: (s: string) => void
  flag: string | null
  setFlag: (f: string | null) => void
  stageGroup: string[]
  setStageGroup: (g: string[]) => void
  onClearAll: () => void
}

export function JobsActiveFilterChips({
  branch,
  setBranch,
  branches,
  channel,
  setChannel,
  productGroup,
  setProductGroup,
  status,
  setStatus,
  flag,
  setFlag,
  stageGroup,
  setStageGroup,
  onClearAll,
}: JobsActiveFilterChipsProps) {
  const getStatusLabel = (stg: string) =>
    statusFilterOptions(true).find(o => o.value === stg)?.label ?? stg

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
      <span className="text-slate-400 font-medium">ตัวกรองที่ใช้งาน:</span>
      {flag && (
        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          เร่งด่วน: {flag}
          <button type="button" onClick={() => setFlag(null)} className="hover:text-rose-900 cursor-pointer ml-0.5 text-xs">×</button>
        </span>
      )}
      {productGroup && (
        <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          ประเภทสินค้า: {productGroup}
          <button type="button" onClick={() => setProductGroup('')} className="hover:text-slate-900 cursor-pointer ml-0.5 text-xs">×</button>
        </span>
      )}
      {status && (
        <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          สถานะ: {getStatusLabel(status)}
          <button type="button" onClick={() => setStatus('')} className="hover:text-slate-900 cursor-pointer ml-0.5 text-xs">×</button>
        </span>
      )}
      {stageGroup.length > 0 && (
        <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          กลุ่มสถานะ ({stageGroup.length})
          <button type="button" onClick={() => setStageGroup([])} className="hover:text-slate-900 cursor-pointer ml-0.5 text-xs">×</button>
        </span>
      )}
      {branch && (
        <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          สาขา: {branches.find(b => b[0] === branch)?.[1] ?? branch}
          <button type="button" onClick={() => setBranch('')} className="hover:text-slate-900 cursor-pointer ml-0.5 text-xs">×</button>
        </span>
      )}
      {channel && (
        <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          ช่องทาง: {channel}
          <button type="button" onClick={() => setChannel('')} className="hover:text-slate-900 cursor-pointer ml-0.5 text-xs">×</button>
        </span>
      )}
      <button
        type="button"
        onClick={onClearAll}
        className="text-[11px] text-red-600 hover:text-red-800 font-medium ml-auto cursor-pointer underline"
      >
        ล้างตัวกรองทั้งหมด
      </button>
    </div>
  )
}
