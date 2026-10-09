'use client'

import { STAGE_ORDER, STAGE_LABELS } from '@/lib/constants'

interface JobsFilterBarProps {
  branch: string
  setBranch: (b: string) => void
  branches: Array<[string, string]>
  channel: string
  setChannel: (c: string) => void
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
}

export default function JobsFilterBar({
  branch,
  setBranch,
  branches,
  channel,
  setChannel,
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
  return (
    <div className="filter-bar">
      <select className="sel" value={branch} onChange={e => setBranch(e.target.value)}>
        <option value="">ทุกสาขา</option>
        {branches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
      <select className="sel" value={channel} onChange={e => setChannel(e.target.value)}>
        <option value="">ทุกช่องทาง</option>
        <option value="DSD">DSD</option>
        <option value="DC">DC</option>
        <option value="TPL">3PL</option>
      </select>
      <select className="sel" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="">ทุกสถานะ</option>
        {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
      </select>
      <input
        className="inp"
        style={{ flex: 1, minWidth: 220 }}
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="ค้นหา: เลขที่ใบแจ้งซ่อม / ชื่อลูกค้า / เบอร์โทร"
      />
      {flag && <button className="clear-filter" onClick={() => setFlag(null)}>✕ ล้างตัวกรองรายการเร่งด่วน</button>}
      {stageGroup.length > 0 && <button className="clear-filter" onClick={() => setStageGroup([])}>✕ ล้างตัวกรองกลุ่มสถานะ ({stageGroup.length})</button>}
      {status && <button className="clear-filter" onClick={() => setStatus('')}>✕ ล้างสถานะ</button>}
      {['CS', 'ADMIN'].includes(role) && (
        <button className="btn btn-primary" onClick={onNewJob}>+ เปิดใบแจ้งซ่อม</button>
      )}
    </div>
  )
}
