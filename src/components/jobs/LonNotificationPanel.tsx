'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { fmtDateTime } from '@/lib/constants'
import { useToast } from '@/components/ui/Toast'
import {
  LON_NOTIFICATION_TYPES,
  LON_TYPE_LABELS,
  type LonEndpointToggles,
  type LonStatus,
  type LonType,
} from '@/lib/validations/lon.schema'

interface LonLogEntry {
  id: string
  type: LonType
  endpoint: string
  recipientPhone: string
  status: LonStatus
  httpStatus: number | null
  requestPayload: Record<string, unknown>
  responseBody: string | null
  errorMessage: string | null
  triggeredBy: string | null
  createdAt: string
}

const CAN_RESEND_ROLES = new Set(['CS', 'GR', 'S2', 'ADMIN'])

const STATUS_STYLE: Record<LonStatus, { textClass: string; dotClass: string; label: string }> = {
  SENT: { textClass: 'text-emerald-700', dotClass: 'bg-emerald-600', label: 'ส่งสำเร็จ' },
  SIMULATED: { textClass: 'text-sky-700', dotClass: 'bg-sky-600', label: 'จำลอง (Simulated)' },
  SKIPPED: { textClass: 'text-amber-700', dotClass: 'bg-amber-500', label: 'ข้ามการส่ง (ปิด Toggle)' },
  FAILED: { textClass: 'text-rose-600', dotClass: 'bg-rose-600', label: 'ส่งไม่สำเร็จ' },
}

function defaultTypeForStage(stage: string, decision?: string): LonType {
  if (stage === 'WAITING_APPROVAL') return 'SEND_PRICE'
  if (stage === 'REPAIRING' || stage === 'RETURN_PACKING') return 'STATUS_REPAIR'
  if (stage === 'READY_FOR_PICKUP') return decision === 'REJECTED' ? 'REJECT_REPAIR' : 'RECEIVE_JOB'
  if (stage === 'CLOSED_REPAIRED') return 'SATISFACTION'
  return 'SEND_TO_REPAIR'
}

export function LonNotificationPanel({
  jobId,
  stage,
  decision,
  role,
}: {
  jobId: string
  stage: string
  decision?: string
  role: string
}) {
  const [logs, setLogs] = useState<LonLogEntry[]>([])
  const [toggles, setToggles] = useState<LonEndpointToggles | null>(null)
  const [selectedType, setSelectedType] = useState<LonType>(() => defaultTypeForStage(stage, decision))
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const canView = role !== 'VD'
  const canResend = CAN_RESEND_ROLES.has(role)

  const load = useCallback(() => {
    if (!canView) return
    api<{ logs: LonLogEntry[]; toggles: LonEndpointToggles }>(`/api/jobs/${jobId}/lon`)
      .then((res) => {
        setLogs(res.logs)
        setToggles(res.toggles)
      })
      .catch(() => {})
  }, [jobId, canView])

  useEffect(() => {
    setSelectedType(defaultTypeForStage(stage, decision))
  }, [stage, decision])

  useEffect(() => {
    load()
  }, [load])

  if (!canView) return null

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await api<{
        result: { ok: boolean; status: LonStatus; error?: string }
        logs: LonLogEntry[]
      }>(`/api/jobs/${jobId}/lon`, {
        method: 'POST',
        body: { type: selectedType },
      })
      setLogs(res.logs)
      if (res.result.status === 'FAILED') {
        toast(res.result.error || 'ยิง LON ไม่สำเร็จ', 'error')
      } else {
        toast(`ดำเนินการส่ง LON แล้ว (${STATUS_STYLE[res.result.status].label})`, 'success')
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ส่งแจ้งเตือน LON ไม่สำเร็จ', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="note" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <b>การแจ้งเตือนลูกค้า LON (LINE Official)</b>
        <span className="sub-mute" style={{ fontSize: 11.5 }}>{logs.length} รายการ</span>
      </div>

      {canResend && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <select
            className="sel"
            style={{ flex: 1, minWidth: 180, fontSize: 12 }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as LonType)}
          >
            {LON_NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {LON_TYPE_LABELS[t]}{toggles && !toggles[t] ? ' (ปิด Toggle)' : ''}
              </option>
            ))}
          </select>
          <button type="button" className="btn" style={{ fontSize: 12 }} disabled={sending} onClick={handleSend}>
            {sending ? 'กำลังส่ง…' : 'ส่งแจ้งเตือน LON'}
          </button>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="sub-mute" style={{ marginTop: 6, fontSize: 12 }}>
          ยังไม่มีประวัติการส่งแจ้งเตือน LON สำหรับงานนี้
        </div>
      ) : (
        <div style={{ marginTop: 8, maxHeight: 190, overflowY: 'auto', display: 'grid', gap: 6 }}>
          {logs.map((log) => {
            const st = STATUS_STYLE[log.status]
            const open = expandedId === log.id
            return (
              <div key={log.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500 }}>{LON_TYPE_LABELS[log.type]}</span>
                  <span className={`inline-flex items-center gap-1.5 font-medium ${st.textClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dotClass}`} />
                    {st.label}
                  </span>
                </div>
                <div className="sub-mute" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 11 }}>
                  <span>{fmtDateTime(log.createdAt)} · {log.recipientPhone} · โดย {log.triggeredBy ?? 'AUTO'}</span>
                  <button type="button" className="link-btn" onClick={() => setExpandedId(open ? null : log.id)}>
                    {open ? 'ซ่อน Payload' : 'ดู Payload'}
                  </button>
                </div>
                {log.errorMessage && <div className="text-amber-700" style={{ fontSize: 11, marginTop: 2 }}>{log.errorMessage}</div>}
                {open && (
                  <pre className="font-mono" style={{ marginTop: 4, padding: 8, background: 'var(--surface)', borderRadius: 6, fontSize: 10.5, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    {`POST ${log.endpoint}\n${JSON.stringify(log.requestPayload, null, 2)}`}
                  </pre>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
