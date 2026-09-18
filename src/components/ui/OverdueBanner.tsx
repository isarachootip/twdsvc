'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'

interface OverdueJob {
  id: string
  jobNo: string
  customerName?: string
  productName: string
  stage: string
  hoursInStep: number
  slaHours: number
  tab: string
  tabLabel: string
}

interface OverdueBannerProps {
  overdueJobs: OverdueJob[]
  onJumpToTab?: (tab: string, jobId: string) => void
}

export default function OverdueBanner({ overdueJobs, onJumpToTab }: OverdueBannerProps) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || overdueJobs.length === 0) return null

  return (
    <>
      {/* Banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ background: 'var(--red-tint)', border: '1px solid var(--red)' }}
        onClick={() => setOpen(true)}
      >
        <AlertTriangle size={18} style={{ color: 'var(--red)' }} className="shrink-0" />
        <span className="text-sm font-semibold flex-1" style={{ color: 'var(--red-dark)' }}>
          มี {overdueJobs.length} งานเกิน SLA — คลิกเพื่อดูรายการ
        </span>
        <button
          onClick={e => { e.stopPropagation(); setDismissed(true) }}
          className="p-1 rounded hover:bg-red-100"
        >
          <X size={16} style={{ color: 'var(--red)' }} />
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--red)' }}>
                <AlertTriangle size={18} className="inline mr-2" />
                งานที่เกิน SLA ({overdueJobs.length} รายการ)
              </h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X size={20} style={{ color: 'var(--text-2)' }} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                    <th className="px-4 py-3 font-medium">เลขงาน</th>
                    <th className="px-4 py-3 font-medium">สินค้า</th>
                    <th className="px-4 py-3 font-medium">ขั้นตอนที่ค้าง</th>
                    <th className="px-4 py-3 font-medium">เกิน</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {overdueJobs.map((job) => (
                    <tr key={job.id} className="border-b hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-4 py-3 font-mono text-overdue font-semibold">{job.jobNo}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{job.productName}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-2)' }}>{job.tabLabel}</td>
                      <td className="px-4 py-3 text-overdue font-semibold">
                        {job.hoursInStep - job.slaHours} ชม.
                      </td>
                      <td className="px-4 py-3">
                        {onJumpToTab && (
                          <button
                            onClick={() => { onJumpToTab(job.tab, job.id); setOpen(false) }}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                            style={{ background: 'var(--red-tint)', color: 'var(--red)' }}
                          >
                            ไปที่แท็บ {job.tabLabel}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
