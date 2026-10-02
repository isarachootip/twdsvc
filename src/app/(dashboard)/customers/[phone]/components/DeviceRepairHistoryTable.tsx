import Link from 'next/link'
import StageBadge from '@/components/ui/StageBadge'
import { fmtDate, fmtBaht } from '@/lib/constants'
import type { DeviceRepairRecord } from '@/lib/validations/customer'
import { ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react'

export default function DeviceRepairHistoryTable({ jobs }: { jobs: DeviceRepairRecord[] }) {
  if (jobs.length === 0) {
    return <div className="p-4 text-xs text-gray-400 text-center">ไม่พบประวัติการซ่อมสำหรับอุปกรณ์นี้</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-medium">
          <tr>
            <th className="py-2.5 px-3">เลขที่ใบแจ้งซ่อม</th>
            <th className="py-2.5 px-3">วันที่เปิดงาน</th>
            <th className="py-2.5 px-3">สาขา</th>
            <th className="py-2.5 px-3">อาการเสีย</th>
            <th className="py-2.5 px-3">การรับประกัน</th>
            <th className="py-2.5 px-3">สถานะ</th>
            <th className="py-2.5 px-3 text-right">ค่าบริการ</th>
            <th className="py-2.5 px-3 text-center">ดูงาน</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {jobs.map(job => (
            <tr key={job.jobId} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-2.5 px-3 font-mono font-medium text-gray-800">
                <Link
                  href={`/jobs/${job.jobId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  {job.jobNo}
                </Link>
              </td>
              <td className="py-2.5 px-3 text-gray-600">
                {fmtDate(job.openedAt)}
              </td>
              <td className="py-2.5 px-3 text-gray-600">
                {job.branchName}
              </td>
              <td className="py-2.5 px-3 text-gray-700 max-w-[200px] truncate" title={job.symptom ?? ''}>
                {job.symptom || '-'}
              </td>
              <td className="py-2.5 px-3">
                {job.hasWarranty ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <ShieldCheck size={12} />
                    ในประกัน
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    <ShieldAlert size={12} />
                    นอกประกัน
                  </span>
                )}
              </td>
              <td className="py-2.5 px-3">
                <StageBadge stage={job.stage as any} />
              </td>
              <td className="py-2.5 px-3 text-right font-medium text-gray-700">
                {job.totalCharges > 0 ? fmtBaht(job.totalCharges) : '-'}
              </td>
              <td className="py-2.5 px-3 text-center">
                <Link
                  href={`/jobs/${job.jobId}`}
                  className="p-1 inline-flex text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="ดูรายละเอียดใบแจ้งซ่อม"
                >
                  <ExternalLink size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
