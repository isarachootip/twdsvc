import { STAGE_LABELS, STAGE_ORDER, type Stage } from './constants'
import { clockHours } from './job-view'
import { resolveOwner } from './sla-engine'

export interface TimelineStepItem {
  code: string
  name: string
  owner: string
  slaHours: number
  status: 'done' | 'done_late' | 'running' | 'paused' | 'overdue' | 'pending'
  hours: number
  doneAt: Date | string | null
  doneBy: string | null
}

interface RawEventInput {
  id: string
  type: string
  fromStage: string | null
  toStage: string | null
  actorUserId: string | null
  actorRole: string | null
  note: string | null
  payload: unknown
  createdAt: Date
  attachments?: ReadonlyArray<{
    id: string
    kind: string
    fileName: string
    fileUrl: string
  }>
}

interface RawSlaClockInput {
  status: string
  startedAt: Date
  stoppedAt: Date | null
  pausedAt: Date | null
  pausedMinutes: number
  breached: boolean
  slaStep: {
    code: string
    name: string
    ownerDept: string
    hours: number
  }
}

const STAGE_DEFAULT_SLA_CODE: Record<Stage, { code: string; owner: string; hours: number }> = {
  PENDING_VENDOR_ASSIGNMENT: { code: 'ASSIGN_VD', owner: 'ADMIN', hours: 24 },
  CS_OPENED: { code: 'CS_HANDOVER', owner: 'CS', hours: 24 },
  GR_RECEIVED: { code: 'GR_PACK', owner: 'GR', hours: 4 },
  GR_PACKED: { code: 'CARRIER_PICKUP', owner: 'CARRIER', hours: 24 },
  OUTBOUND_TO_DC: { code: 'DC_RECEIVE_LOCATION', owner: 'DC', hours: 4 },
  AT_DC_OUTBOUND: { code: 'VD_PICKUP_AT_DC', owner: 'VD', hours: 24 },
  OUTBOUND_TO_VD: { code: 'VD_RECEIVE', owner: 'CARRIER', hours: 24 },
  VD_INSPECTING: { code: 'VD_QUOTE', owner: 'VD', hours: 48 },
  WAITING_APPROVAL: { code: 'CUSTOMER_APPROVAL', owner: 'CUSTOMER', hours: 48 },
  REPAIRING: { code: 'VD_REPAIR', owner: 'VD', hours: 168 },
  RETURN_PACKING: { code: 'VD_RETURN_PACK', owner: 'VD', hours: 24 },
  INBOUND_TO_DC: { code: 'DC_RETURN_RECEIVE', owner: 'DC', hours: 24 },
  AT_DC_INBOUND: { code: 'DC_DISPATCH_BRANCH', owner: 'DC', hours: 24 },
  INBOUND_TO_BRANCH: { code: 'GR_RETURN_RECEIVE', owner: 'CARRIER', hours: 24 },
  GR_RETURN_RECEIVED: { code: 'GR_DELIVER_CS', owner: 'GR', hours: 4 },
  READY_FOR_PICKUP: { code: 'CUSTOMER_PICKUP', owner: 'CS', hours: 168 },
  CLOSED_REPAIRED: { code: 'CLOSED_REPAIRED', owner: 'CS', hours: 0 },
  CLOSED_NOT_REPAIRED: { code: 'CLOSED_NOT_REPAIRED', owner: 'CS', hours: 0 },
  CANCELLED: { code: 'CANCELLED', owner: 'CS', hours: 0 },
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  JOB_OPENED: 'เปิดใบแจ้งซ่อม',
  INTAKE_SIGNED: 'ลูกค้าลงนามรับทราบเงื่อนไขการส่งซ่อม',
  VENDOR_ASSIGNED: 'กำหนดศูนย์ซ่อม (VD)',
  GR_RECEIVED: 'GR รับมอบสินค้าจาก CS',
  GR_PACKED: 'GR แพ็คสินค้าลงกล่อง',
  SHIPMENT_DISPATCHED: 'เรียกรถขนส่งเข้ารับสินค้า',
  OUTBOUND_HANDED_OFF: 'ส่งมอบสินค้าให้ขนส่งขาไป',
  DC_RECEIVED_OUTBOUND: 'DC รับเข้าคลังขาไป (Location)',
  DC_HANDED_OFF_VD: 'DC ส่งมอบสินค้าให้ศูนย์ซ่อม VD',
  VD_RECEIVED: 'ศูนย์ซ่อม VD รับสินค้าเข้าตรวจสอบ',
  QUOTE_SENT: 'VD ส่งใบเสนอราคา',
  QUOTE_REVISED: 'VD แก้ไขใบเสนอราคา',
  QUOTE_MANAGER_SIGNED: 'ผู้จัดการสาขาลงนามอนุมัติใบเสนอราคา',
  CUSTOMER_APPROVED: 'อนุมัติใบเสนอราคาซ่อม',
  CUSTOMER_REJECTED: 'ปฏิเสธใบเสนอราคา (คืนสินค้าไม่ซ่อม)',
  REPAIR_STARTED: 'เริ่มดำเนินการซ่อม',
  REPAIR_PAUSED: 'หยุดนับเวลาซ่อมชั่วคราว (รออะไหล่)',
  REPAIR_RESUMED: 'กลับมาดำเนินการซ่อมต่อ',
  REPAIR_FINISHED: 'ซ่อมเสร็จสิ้น รอแพ็คส่งคืน',
  RETURN_PACKED: 'VD แพ็คสินค้าส่งคืนสาขา',
  DC_RECEIVED_INBOUND: 'DC รับสินค้าคืนจาก VD',
  DC_DISPATCHED_TO_BRANCH: 'DC จัดส่งสินค้าคืนสาขา',
  GR_RETURN_RECEIVED: 'GR รับสินค้าคืนถึงสาขา',
  DELIVERED_TO_CS: 'GR ส่งมอบสินค้าคืนให้ CS',
  PICKUP_SIGNED: 'ลูกค้าลงนามตรวจรับสินค้าคืน',
  PAYMENT_RECORDED: 'บันทึกการชำระเงิน',
  JOB_CLOSED: 'ส่งมอบสินค้าคืนลูกค้า / ปิดงาน',
  JOB_CANCELLED: 'ยกเลิกใบแจ้งซ่อม',
}

export function buildJobStageTimeline(params: {
  stage: Stage
  channel: string | null
  openedAt: Date
  events: ReadonlyArray<RawEventInput>
  slaClocks: ReadonlyArray<RawSlaClockInput>
  actorNames: Record<string, string>
  now?: Date
}): TimelineStepItem[] {
  const { stage, channel, events, slaClocks, actorNames, now = new Date() } = params
  const currentIdx = STAGE_ORDER.indexOf(stage)
  const stagesToRender = STAGE_ORDER.filter((st) => st !== 'CANCELLED' || stage === 'CANCELLED')

  return stagesToRender.map((st, idx) => {
    const def = STAGE_DEFAULT_SLA_CODE[st]
    const clock = slaClocks.find((c) => c.slaStep.code === def.code)
    const owner = resolveOwner(clock?.slaStep.ownerDept ?? def.owner, def.code, channel)
    const slaHours = clock?.slaStep.hours ?? def.hours

    // Find event that transitioned OUT of this stage (or into the next stage)
    const exitEvent = [...events].reverse().find((e) => e.fromStage === st)
    const enterEvent = [...events].reverse().find((e) => e.toStage === st)
    const relevantEvent = exitEvent ?? enterEvent
    const doneBy = relevantEvent?.actorUserId
      ? (actorNames[relevantEvent.actorUserId] ?? relevantEvent.actorRole ?? null)
      : (relevantEvent?.actorRole ?? null)

    const isTerminalCurrent =
      idx === currentIdx && ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'].includes(st)

    if (idx < currentIdx || isTerminalCurrent) {
      const hrs = clock ? Math.floor(clockHours(clock, now)) : 0
      const doneAt = clock?.stoppedAt ?? exitEvent?.createdAt ?? enterEvent?.createdAt ?? null
      return {
        code: st,
        name: `${idx + 1}. ${STAGE_LABELS[st]}`,
        owner,
        slaHours,
        status: clock?.breached ? 'done_late' : 'done',
        hours: hrs,
        doneAt,
        doneBy,
      }
    }

    if (idx === currentIdx) {
      const hrs = clock ? Math.floor(clockHours(clock, now)) : 0
      let status: TimelineStepItem['status'] = 'running'
      if (clock?.status === 'PAUSED') status = 'paused'
      else if (clock?.breached) status = 'overdue'
      return {
        code: st,
        name: `${idx + 1}. ${STAGE_LABELS[st]}`,
        owner,
        slaHours,
        status,
        hours: hrs,
        doneAt: null,
        doneBy,
      }
    }

    return {
      code: st,
      name: `${idx + 1}. ${STAGE_LABELS[st]}`,
      owner,
      slaHours,
      status: 'pending',
      hours: 0,
      doneAt: null,
      doneBy: null,
    }
  })
}

export function enrichJobEvents(
  events: ReadonlyArray<RawEventInput>,
  actorNames: Record<string, string>
) {
  return events.map((e) => {
    const payloadObj =
      e.payload && typeof e.payload === 'object' ? (e.payload as Record<string, unknown>) : null
    const location =
      payloadObj && typeof payloadObj.location === 'string' && payloadObj.location
        ? payloadObj.location
        : null
    const stageTransition =
      e.toStage && STAGE_LABELS[e.toStage as Stage]
        ? ` → ${STAGE_LABELS[e.toStage as Stage]}`
        : ''
    const baseLabel = EVENT_TYPE_LABELS[e.type] ?? e.type
    const actor = e.actorUserId
      ? (actorNames[e.actorUserId] ?? e.actorRole ?? '-')
      : (e.actorRole ?? 'ระบบ / ลูกค้า')

    return {
      id: e.id,
      type: e.type,
      label: `${baseLabel}${stageTransition}`,
      actor,
      actorRole: e.actorRole,
      location,
      note: e.note,
      createdAt: e.createdAt,
      attachments: e.attachments ?? [],
    }
  })
}
