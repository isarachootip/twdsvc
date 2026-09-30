'use client'

import { useCallback, useEffect, useState } from 'react'
import JobDetailModal from '@/components/jobs/JobDetail'
import StageBadge from '@/components/ui/StageBadge'
import { SlaCell } from '@/components/ui/Queue'
import { api } from '@/lib/client'
import { fmtDate, fmtPhone } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'
import { Loading } from './admin-helpers'

export function PendingVendorSection() {
  const [jobs, setJobs] = useState<JobView[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(
    () =>
      api<{ tabs: Record<string, JobView[]> }>('/api/queues/ADMIN')
        .then(d => setJobs(d.tabs.pendingVendor ?? []))
        .catch(() => setJobs([])),
    []
  )

  useEffect(() => {
    load()
  }, [load])

  if (!jobs) return <Loading />

  return (
    <div className="pcard">
      <h3>งานรอกำหนดศูนย์ซ่อม</h3>
      <p className="hint">
        งานที่ระบบหาศูนย์ซ่อมที่รองรับแบรนด์/ขนาด/สาขาไม่ได้ — กำหนดศูนย์ซ่อมและช่องทางเพื่อให้งานเข้าคิว GR ต่อ
      </p>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead>
            <tr>
              <th>เลขที่ใบแจ้งซ่อม</th>
              <th>สาขา</th>
              <th>ลูกค้า</th>
              <th>สินค้า / แบรนด์</th>
              <th>วิธีจัดส่ง</th>
              <th>สถานะ</th>
              <th>รอมาแล้ว</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="empty">ไม่มีงานรอกำหนดศูนย์ซ่อม</td>
              </tr>
            )}
            {jobs.map(j => (
              <tr key={j.id}>
                <td>
                  <b>{j.jobNo}</b>
                  <div className="sub-mute">{fmtDate(j.openedAt)}</div>
                </td>
                <td>{j.branch.name}</td>
                <td>
                  {j.customerName}
                  <div className="sub-mute">{fmtPhone(j.customerPhone)}</div>
                </td>
                <td>
                  {j.productName}
                  <div className="sub-mute">{j.brandName}</div>
                </td>
                <td>{j.shippingMethod === 'EXPRESS' ? 'ส่งด่วน (3PL)' : 'มาตรฐาน'}</td>
                <td><StageBadge stage={j.stage} /></td>
                <td><SlaCell job={j} /></td>
                <td>
                  <button className="btn btn-primary" onClick={() => setOpenId(j.id)}>
                    กำหนดศูนย์ซ่อม
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <JobDetailModal
        jobId={openId}
        role="ADMIN"
        onClose={() => setOpenId(null)}
        onChanged={load}
      />
    </div>
  )
}
