'use client'

import Link from 'next/link'
import {
  LON_ENDPOINTS,
  LON_NOTIFICATION_TYPES,
  LON_TYPE_LABELS,
  type LonEndpointToggles,
  type LonStatus,
} from '@/lib/validations/lon.schema'
import type { LonMonitorSummary } from '@/lib/services/lon-monitor.service'

export const LON_MONITOR_STATUS_META: Record<LonStatus, { textClass: string; dotClass: string; label: string }> = {
  SENT: { textClass: 'text-emerald-700', dotClass: 'bg-emerald-600', label: 'ส่งสำเร็จ (SENT)' },
  SIMULATED: { textClass: 'text-sky-700', dotClass: 'bg-sky-600', label: 'จำลอง (SIMULATED)' },
  SKIPPED: { textClass: 'text-amber-700', dotClass: 'bg-amber-500', label: 'ข้ามการส่ง (SKIPPED)' },
  FAILED: { textClass: 'text-rose-600', dotClass: 'bg-rose-600', label: 'ส่งไม่สำเร็จ (FAILED)' },
}

export function LonMonitorKpiHeader({
  summary,
  toggles,
}: {
  summary?: LonMonitorSummary
  toggles?: LonEndpointToggles
}) {
  return (
    <>
      <div className="grid4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        <div className="pcard" style={{ marginBottom: 0 }}>
          <div className="sub-mute" style={{ fontSize: 12 }}>รายการยิง API ทั้งหมด</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{summary?.total ?? 0}</div>
        </div>
        <div className="pcard" style={{ marginBottom: 0 }}>
          <div className="sub-mute" style={{ fontSize: 12 }}>ส่งสำเร็จ (HTTP 200)</div>
          <div className="text-emerald-700" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{summary?.sent ?? 0}</div>
        </div>
        <div className="pcard" style={{ marginBottom: 0 }}>
          <div className="sub-mute" style={{ fontSize: 12 }}>โหมดจำลอง (Simulated)</div>
          <div className="text-sky-700" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{summary?.simulated ?? 0}</div>
        </div>
        <div className="pcard" style={{ marginBottom: 0 }}>
          <div className="sub-mute" style={{ fontSize: 12 }}>ข้ามการส่ง (Skipped)</div>
          <div className="text-amber-700" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{summary?.skipped ?? 0}</div>
        </div>
        <div className="pcard" style={{ marginBottom: 0 }}>
          <div className="sub-mute" style={{ fontSize: 12 }}>ส่งไม่สำเร็จ (Failed)</div>
          <div className="text-rose-600" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{summary?.failed ?? 0}</div>
        </div>
      </div>

      <div className="pcard" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0 }}>สถานะแยกตาม Endpoint (https://lon.thaiwatsadu.com/api-docs/)</h3>
          <Link href="/admin/integrations" className="link-btn" style={{ fontSize: 12.5 }}>
            ตั้งค่า URL / Token / เปิด-ปิดสวิตช์ Endpoint →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8, marginTop: 10 }}>
          {LON_NOTIFICATION_TYPES.map((t) => {
            const stat = summary?.byType[t] ?? { total: 0, sent: 0, failed: 0 }
            const enabled = toggles?.[t] ?? true
            return (
              <div key={t} style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>{LON_TYPE_LABELS[t]}</span>
                  <span className={enabled ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {enabled ? '• เปิดใช้งาน' : '• ปิดไว้'}
                  </span>
                </div>
                <div className="font-mono sub-mute" style={{ fontSize: 11, marginTop: 2 }}>POST {LON_ENDPOINTS[t]}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12 }}>
                  <span>รวม: <b>{stat.total}</b></span>
                  <span className="text-emerald-700">สำเร็จ: <b>{stat.sent}</b></span>
                  <span className="text-rose-600">ล้มเหลว: <b>{stat.failed}</b></span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
