'use client'

import { statusFilterOptions } from '@/lib/job-status-filter'
import { JobsActiveFilterChips } from './JobsActiveFilterChips'

interface JobsFilterBarProps {
  branch: string
  setBranch: (b: string) => void
  branches: Array<[string, string]>
  channel: string
  setChannel: (c: string) => void
  productGroup?: string
  setProductGroup?: (g: string) => void
  productGroups?: string[]
  status: string
  setStatus: (s: string) => void
  search: string
  setSearch: (s: string) => void
  flag: string | null
  setFlag: (f: string | null) => void
  stageGroup: string[]
  setStageGroup: (g: string[]) => void
  role: string
  onNewJob: () => void
  totalCount?: number
}

export default function JobsFilterBar({
  branch,
  setBranch,
  branches,
  channel,
  setChannel,
  productGroup = '',
  setProductGroup,
  productGroups = [],
  status,
  setStatus,
  search,
  setSearch,
  flag,
  setFlag,
  stageGroup,
  setStageGroup,
  role,
  onNewJob,
}: JobsFilterBarProps) {
  const hasActiveFilters = Boolean(
    branch || channel || productGroup || status || search || flag || stageGroup.length > 0
  )

  const clearAllFilters = () => {
    setBranch('')
    setChannel('')
    if (setProductGroup) setProductGroup('')
    setStatus('')
    setSearch('')
    setFlag(null)
    setStageGroup([])
  }

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs mb-4 space-y-2.5">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา: เลขที่ใบแจ้งซ่อม, ชื่อลูกค้า, เบอร์โทร, สินค้า, ประเภทสินค้า..."
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors cursor-pointer"
            value={branch}
            onChange={e => setBranch(e.target.value)}
          >
            <option value="">ทุกสาขา</option>
            {branches.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          {setProductGroup && (
            <select
              className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors cursor-pointer"
              value={productGroup}
              onChange={e => setProductGroup(e.target.value)}
            >
              <option value="">ทุกประเภทสินค้า</option>
              {productGroups.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}

          <select
            className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors cursor-pointer"
            value={channel}
            onChange={e => setChannel(e.target.value)}
          >
            <option value="">ทุกช่องทาง</option>
            <option value="DSD">DSD</option>
            <option value="DC">DC</option>
            <option value="TPL">3PL</option>
          </select>

          <select
            className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors cursor-pointer"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {statusFilterOptions(true).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {['CS', 'ADMIN'].includes(role) && (
            <button
              type="button"
              onClick={onNewJob}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#C8102E] hover:bg-[#9C0C22] active:bg-[#85091c] rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>เปิดใบแจ้งซ่อม</span>
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <JobsActiveFilterChips
          branch={branch}
          setBranch={setBranch}
          branches={branches}
          channel={channel}
          setChannel={setChannel}
          productGroup={productGroup}
          setProductGroup={setProductGroup ?? (() => {})}
          status={status}
          setStatus={setStatus}
          flag={flag}
          setFlag={setFlag}
          stageGroup={stageGroup}
          setStageGroup={setStageGroup}
          onClearAll={clearAllFilters}
        />
      )}
    </div>
  )
}
