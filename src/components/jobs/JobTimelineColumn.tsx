'use client'

import AttachmentGallery from '@/components/ui/AttachmentGallery'
import { OWNER_LABELS, fmtDateTime } from '@/lib/constants'
import type { TimelineStepItem } from '@/lib/job-timeline'

interface EnrichedJobEvent {
  id: string
  type: string
  label?: string
  actor?: string
  actorRole?: string | null
  location?: string | null
  note?: string | null
  createdAt: string | Date
  attachments?: Array<{
    id: string
    kind: string
    fileName: string
    fileUrl: string
  }>
}

// Green = done, Red = current (running / overdue), Amber = paused, Gray = pending
const DOT: Record<string, string> = {
  done: 'dot-green',
  done_late: 'dot-green',
  running: 'dot-red',
  overdue: 'dot-red',
  paused: 'dot-amber',
  pending: 'dot-gray',
}

export function JobTimelineColumn({
  timeline,
  events,
}: {
  timeline: TimelineStepItem[]
  events: EnrichedJobEvent[]
}) {
  return (
    <div>
      <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>
        อัปเดตสถานะแต่ละขั้นตอน ({timeline.length} ขั้นตอน)
      </h3>
      <div style={{ maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
        {timeline.map((s) => (
          <div className="step-item" key={s.code}>
            <div className={`step-dot ${DOT[s.status] ?? 'dot-gray'}`} />
            <div>
              <div
                className="step-title"
                style={{
                  color:
                    s.status === 'running' || s.status === 'overdue'
                      ? 'var(--red-dark)'
                      : s.status === 'pending'
                      ? 'var(--text-mute)'
                      : undefined,
                }}
              >
                {s.name}{' '}
                <span className="sub-mute">({OWNER_LABELS[s.owner] ?? s.owner})</span>
              </div>
              <div className="step-meta">
                {s.status === 'pending' && 'รอดำเนินการ'}
                {s.status === 'running' &&
                  `ขั้นตอนปัจจุบัน — ใช้เวลา ${s.hours} ชม.${s.slaHours > 0 ? ` จาก SLA ${s.slaHours} ชม.` : ''}`}
                {s.status === 'paused' &&
                  `หยุดนับเวลา (รออะไหล่) — ใช้ไป ${s.hours} ชม. จาก SLA ${s.slaHours} ชม.`}
                {s.status === 'overdue' && (
                  <span style={{ color: 'var(--red-dark)' }}>
                    เกิน SLA — ค้างมา {s.hours} ชม. (SLA {s.slaHours} ชม.)
                  </span>
                )}
                {(s.status === 'done' || s.status === 'done_late') && (
                  <>
                    เสร็จแล้ว {s.doneAt ? fmtDateTime(s.doneAt) : ''} (
                    {s.hours} ชม.
                    {s.slaHours > 0 ? ` / SLA ${s.slaHours} ชม.` : ''}
                    {s.status === 'done_late' ? (
                      <span style={{ color: 'var(--red-dark)' }}> — เกิน SLA</span>
                    ) : (
                      ''
                    )}
                    ){s.doneBy ? ` — ผู้ทำ: ${s.doneBy}` : ''}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, margin: '18px 0 8px' }}>
        บันทึกความคืบหน้า / ประวัติการดำเนินการ
      </h3>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {events.map((e) => (
          <div className="step-item" key={e.id}>
            <div className="step-dot dot-gray" />
            <div style={{ flex: 1 }}>
              <div className="step-title" style={{ fontSize: 13 }}>
                {e.label ?? e.type}
              </div>
              <div className="step-meta">
                {fmtDateTime(e.createdAt)} — {e.actor ?? e.actorRole ?? '-'}
                {e.location ? ` · Location ${e.location}` : ''}
              </div>
              {e.note && <div className="step-meta">{e.note}</div>}
              {e.attachments && e.attachments.length > 0 && (
                <AttachmentGallery attachments={e.attachments} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
