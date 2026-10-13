'use client'

import StageBadge from '@/components/ui/StageBadge'
import { Th, type SortDir } from '@/components/ui/Sortable'
import { CHANNEL_LABELS, OWNER_LABELS, fmtDateTime, fmtPhone } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

export function ownerOf(j: JobView) {
  return j.overdue ? j.overdueOwner : j.sla?.owner ?? null
}

export function flags(j: JobView) {
  const out: string[] = []
  if (j.overdue) out.push(`เกิน SLA (${OWNER_LABELS[j.overdueOwner ?? ''] ?? j.overdueOwner})`)
  if (j.unpaid) out.push('ค้างชำระ')
  if (j.intakeUnpaid && ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'].includes(j.stage)) out.push('รอชำระค่าดำเนินการ')
  if (j.stage === 'PENDING_VENDOR_ASSIGNMENT') out.push('รอกำหนดศูนย์ซ่อม')
  return out
}

interface JobsTableProps {
  jobs: JobView[]
  sort: { key: string | null; dir: SortDir }
  toggle: (key: string) => void
  loading: boolean
  onOpenJob: (id: string) => void
}

export default function JobsTable({ jobs, sort, toggle, loading, onOpenJob }: JobsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <Th k="id" label="เลขที่ใบแจ้งซ่อม" sort={sort} toggle={toggle} className="py-3 px-4" />
              <Th k="systemTime" label="วัน-เวลาระบบ" sort={sort} toggle={toggle} className="py-3 px-4" />
              <Th k="customer" label="ลูกค้า" sort={sort} toggle={toggle} className="py-3 px-4" />
              <Th k="product" label="สินค้า" sort={sort} toggle={toggle} className="py-3 px-4" />
              <Th k="branch" label="สาขา" sort={sort} toggle={toggle} className="py-3 px-4" />
              <Th k="channel" label="ช่องทาง" sort={sort} toggle={toggle} className="py-3 px-4" />
              <Th k="status" label="สถานะ" sort={sort} toggle={toggle} className="py-3 px-4" />
              <Th k="owner" label="ส่วนงานรับผิดชอบ" sort={sort} toggle={toggle} className="py-3 px-4" />
              <Th k="hours" label="อยู่ใน step นี้มา" sort={sort} toggle={toggle} className="py-3 px-4" />
              <th className="py-3 px-4">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    <span>กำลังโหลดข้อมูล…</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && jobs.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  ไม่พบรายการที่ตรงกับตัวกรอง
                </td>
              </tr>
            )}
            {!loading && jobs.map(j => {
              const jobFlags = flags(j)
              return (
                <tr
                  key={j.id}
                  onClick={() => onOpenJob(j.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 align-middle">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold font-mono text-slate-800 group-hover:text-red-600 transition-colors">
                        {j.jobNo}
                      </span>
                      {j.overdue && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="เกินกำหนด SLA" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <div className="font-medium text-slate-800">{fmtDateTime(j.stageEnteredAt)}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      เปิด {new Date(j.openedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle">
                    {j.type === 'STOCK' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        สต็อกสาขา
                      </span>
                    ) : (
                      <div className="font-medium text-slate-800">{j.customerName}</div>
                    )}
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {j.customerPhone && !j.customerPhone.includes('x') ? fmtPhone(j.customerPhone) : j.customerPhone}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-middle max-w-[220px]">
                    <div className="font-medium text-slate-800 truncate" title={j.productName}>
                      {j.productName}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{j.brandName}</div>
                  </td>
                  <td className="py-3 px-4 align-middle text-slate-700">{j.branch.name}</td>
                  <td className="py-3 px-4 align-middle">
                    {j.channel ? (
                      <span className="inline-block text-[11px] font-medium text-slate-600">
                        {CHANNEL_LABELS[j.channel] ?? j.channel}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 align-middle">
                    <StageBadge stage={j.stage} intakeUnpaid={j.intakeUnpaid} />
                  </td>
                  <td className="py-3 px-4 align-middle text-slate-700">
                    {OWNER_LABELS[ownerOf(j) ?? ''] ?? '-'}
                  </td>
                  <td className="py-3 px-4 align-middle">
                    {j.sla ? (
                      <div>
                        <span className={`font-semibold ${j.sla.overdue ? 'text-rose-600' : 'text-slate-700'}`}>
                          {j.sla.hoursInStep} ชม.
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">SLA {j.sla.slaHours} ชม.</div>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 align-middle">
                    {jobFlags.length ? (
                      <div className="flex flex-col gap-1.5">
                        {jobFlags.map((f, idx) => {
                          const isOver = f.startsWith('เกิน SLA')
                          const isUnpaid = f.includes('ค้างชำระ') || f.includes('รอชำระ')
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap ${
                                isOver
                                  ? 'text-rose-600 font-semibold'
                                  : isUnpaid
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-slate-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isOver
                                    ? 'bg-rose-500'
                                    : isUnpaid
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span>{f}</span>
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
