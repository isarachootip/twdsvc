'use client'

import { useState } from 'react'
import { api, exportXlsx } from '@/lib/client'
import { CHANNEL_LABELS, fmtDate } from '@/lib/constants'
import { useToast } from '@/components/ui/Toast'
import type { JobView } from '@/lib/job-view'

export function DashboardExportCard() {
  const [range, setRange] = useState({ from: '', to: '' })
  const { toast } = useToast()

  const doExport = async () => {
    try {
      const qs = new URLSearchParams({ limit: '1000' })
      if (range.from) qs.set('from', range.from)
      if (range.to) qs.set('to', range.to)
      const r = await api<{ jobs: JobView[] }>(`/api/jobs?${qs}`)
      await exportXlsx(
        [
          {
            name: 'งานซ่อม',
            rows: r.jobs.map(j => ({
              'เลขที่ใบแจ้งซ่อม': j.jobNo,
              'วันที่เปิด': fmtDate(j.openedAt),
              'สาขา': j.branch.name,
              'ลูกค้า': j.customerName ?? '',
              'สินค้า': j.productName,
              'ช่องทาง': j.channel ? CHANNEL_LABELS[j.channel] : '',
              'สถานะ': j.stageLabel,
              'ศูนย์ซ่อม': j.vendor ? `${j.vendor.code} ${j.vendor.name}` : '',
              'ยอดค้าง': j.money?.balance ?? '',
              'เกิน SLA': j.overdue ? 'ใช่' : 'ไม่',
            })),
          },
        ],
        `dashboard_export_${range.from || 'all'}_${range.to || 'all'}.xlsx`
      )
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ส่งออกไม่สำเร็จ', 'error')
    }
  }

  return (
    <div className="pcard">
      <h3>Export รายงาน</h3>
      <p className="hint">ส่งออกข้อมูลงานซ่อมเป็นไฟล์ Excel ตามช่วงวันที่ที่เลือก</p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>ตั้งแต่วันที่</label>
          <input
            className="inp"
            type="date"
            value={range.from}
            onChange={e => setRange({ ...range, from: e.target.value })}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>ถึงวันที่</label>
          <input
            className="inp"
            type="date"
            value={range.to}
            onChange={e => setRange({ ...range, to: e.target.value })}
          />
        </div>
        <button className="btn btn-primary" onClick={doExport}>
          Export เป็น Excel
        </button>
      </div>
    </div>
  )
}
