'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/client'
import { fmtDateTime } from '@/lib/constants'
import DateInput from '@/components/ui/DateInput'
import { useToast } from '@/components/ui/Toast'
import { LON_NOTIFICATION_TYPES, LON_TYPE_LABELS, type LonEndpointToggles, type LonStatus } from '@/lib/validations/lon.schema'
import type { LonMonitorLogItem, LonMonitorSummary, RemoteLonRecord } from '@/lib/services/lon-monitor.service'
import { LonMonitorKpiHeader, LON_MONITOR_STATUS_META } from './integrations/LonMonitorKpiHeader'
import { LonPayloadInspectModal, LonRemoteReportModal } from './integrations/LonRemoteReportModal'

interface MonitorApiResponse {
  summary: LonMonitorSummary; logs: LonMonitorLogItem[]; toggles: LonEndpointToggles
  remote?: { ok: boolean; total: number; data: RemoteLonRecord[]; error?: string } | null
}

export function ApiMonitorSection() {
  const { toast } = useToast()
  const [data, setData] = useState<MonitorApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(''), [statusFilter, setStatusFilter] = useState(''), [typeFilter, setTypeFilter] = useState('')
  const [fromDate, setFromDate] = useState(''), [toDate, setToDate] = useState('')
  const [inspectItem, setInspectItem] = useState<LonMonitorLogItem | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [remoteOpen, setRemoteOpen] = useState(false), [remoteLoading, setRemoteLoading] = useState(false)
  const [remoteData, setRemoteData] = useState<{ ok: boolean; total: number; data: RemoteLonRecord[]; error?: string }>({ ok: true, total: 0, data: [] })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (search.trim()) qs.set('search', search.trim())
      if (statusFilter) qs.set('status', statusFilter)
      if (typeFilter) qs.set('type', typeFilter)
      if (fromDate) qs.set('from', fromDate)
      if (toDate) qs.set('to', toDate)
      setData(await api<MonitorApiResponse>(`/api/admin/lon-monitor?${qs.toString()}`))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'โหลดรายงาน API Monitor ไม่สำเร็จ', 'error')
    } finally { setLoading(false) }
  }, [search, statusFilter, typeFilter, fromDate, toDate, toast])

  useEffect(() => { void load() }, [load])

  const handleRetry = async (item: LonMonitorLogItem) => {
    setRetryingId(item.id)
    try {
      const res = await api<{ result: { ok: boolean; status: LonStatus; error?: string } }>(`/api/jobs/${item.jobId}/lon`, { method: 'POST', body: { type: item.type } })
      if (res.result.status === 'FAILED') toast(res.result.error || 'ยิงซ้ำไปที่ LON ไม่สำเร็จ', 'error')
      else toast(`ยิง API ซ้ำสำหรับ ${item.jobNo} สำเร็จ (${LON_MONITOR_STATUS_META[res.result.status].label})`, 'success')
      setInspectItem(null)
      await load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ยิง API ซ้ำไม่สำเร็จ', 'error')
    } finally { setRetryingId(null) }
  }

  const handleOpenRemote = async () => {
    setRemoteOpen(true); setRemoteLoading(true)
    try {
      const qs = new URLSearchParams({ remote: '1' })
      if (search.trim()) qs.set('search', search.trim())
      if (fromDate) qs.set('from', fromDate)
      if (toDate) qs.set('to', toDate)
      const res = await api<MonitorApiResponse>(`/api/admin/lon-monitor?${qs.toString()}`)
      if (res.remote) setRemoteData(res.remote)
    } catch (e) {
      setRemoteData({ ok: false, total: 0, data: [], error: e instanceof Error ? e.message : 'ดึงข้อมูลจาก LON ไม่สำเร็จ' })
    } finally { setRemoteLoading(false) }
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <LonMonitorKpiHeader summary={data?.summary} toggles={data?.toggles} />

      <div className="pcard" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'end', marginBottom: 12 }}>
          <div className="field" style={{ flex: '1 1 220px' }}>
            <label>ค้นหา (เลขใบงาน / เบอร์โทร / ชื่อลูกค้า)</label>
            <input className="inp" placeholder="เช่น TW60020... หรือ 0636395619" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <label>สถานะการส่ง</label>
            <select className="sel" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="SENT">ส่งสำเร็จ (SENT)</option>
              <option value="SIMULATED">โหมดจำลอง (SIMULATED)</option>
              <option value="SKIPPED">ข้ามการส่ง (SKIPPED)</option>
              <option value="FAILED">ส่งไม่สำเร็จ (FAILED)</option>
            </select>
          </div>
          <div className="field" style={{ minWidth: 210 }}>
            <label>Endpoint</label>
            <select className="sel" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">ทุก Endpoint (1–6)</option>
              {LON_NOTIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>{LON_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>ตั้งแต่วันที่</label>
            <DateInput value={fromDate} onChange={setFromDate} ariaLabel="ตั้งแต่วันที่" />
          </div>
          <div className="field">
            <label>ถึงวันที่</label>
            <DateInput value={toDate} onChange={setToDate} ariaLabel="ถึงวันที่" />
          </div>
          <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
            {loading ? 'กำลังโหลด…' : 'รีเฟรช'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => void handleOpenRemote()}>
            เช็กข้อมูลฝั่งเซิร์ฟเวอร์ LON ↗
          </button>
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>วัน-เวลา</th>
                <th>เลขใบงาน / สาขา</th>
                <th>ลูกค้า / เบอร์โทรผู้รับ</th>
                <th>ประเภท / Endpoint</th>
                <th>ผลการส่ง API</th>
                <th>ผู้สั่งส่ง</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sub-mute" style={{ textAlign: 'center', padding: 24 }}>
                    {loading ? 'กำลังโหลดรายการ…' : 'ยังไม่มีประวัติการยิง API LON ตามเงื่อนไขที่เลือก'}
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => {
                  const st = LON_MONITOR_STATUS_META[log.status]
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDateTime(log.createdAt)}</td>
                      <td>
                        <Link href={`/jobs/${log.jobId}`} className="font-mono font-semibold" style={{ color: 'var(--blue)' }}>
                          {log.jobNo}
                        </Link>
                        <div className="sub-mute" style={{ fontSize: 11.5 }}>{log.branchName} · {log.productName}</div>
                      </td>
                      <td>
                        <div>{log.customerName ?? '-'}</div>
                        <div className="font-mono sub-mute" style={{ fontSize: 11.5 }}>{log.recipientPhone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 12.5 }}>{LON_TYPE_LABELS[log.type]}</div>
                        <div className="font-mono sub-mute" style={{ fontSize: 11 }}>POST {log.endpoint}</div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 font-medium ${st.textClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                          {st.label} {log.httpStatus ? `(HTTP ${log.httpStatus})` : ''}
                        </span>
                        {log.errorMessage && (
                          <div className="text-rose-600" style={{ fontSize: 11, marginTop: 2 }}>{log.errorMessage}</div>
                        )}
                      </td>
                      <td className="sub-mute" style={{ fontSize: 12 }}>{log.triggeredBy ?? 'AUTO'}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button type="button" className="btn" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setInspectItem(log)}>
                            ดู Payload / Response
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: 12, padding: '4px 8px' }}
                            disabled={retryingId === log.id}
                            onClick={() => void handleRetry(log)}
                          >
                            {retryingId === log.id ? 'กำลังส่ง…' : 'ยิงซ้ำ'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LonPayloadInspectModal item={inspectItem} onClose={() => setInspectItem(null)} onRetry={(it) => void handleRetry(it)} retrying={retryingId === inspectItem?.id} />
      <LonRemoteReportModal open={remoteOpen} onClose={() => setRemoteOpen(false)} loading={remoteLoading} error={remoteData.error} total={remoteData.total} records={remoteData.data} />
    </div>
  )
}
