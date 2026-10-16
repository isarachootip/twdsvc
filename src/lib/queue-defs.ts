// นิยามคิวงานของแต่ละส่วนงาน (04 §4 "คิวที่เกิดจาก shipment") — แหล่งเดียวของ "คิว" ทั้งระบบ
import type { Prisma } from '@prisma/client'

export interface QueueTabDef {
  key: string
  aliasKey?: string
  where: Prisma.JobWhereInput
  sla?: string[] // SlaStep codes ที่ใช้แสดง "รอมาแล้ว" ของคิวนี้
  label: string
}

export const QUEUES: Record<string, { roles: string[]; tabs: QueueTabDef[] }> = {
  GR: {
    roles: ['GR', 'ADMIN'],
    tabs: [
      { key: 'receive', aliasKey: 'cs_opened', label: 'รับจาก CS', where: { stage: 'CS_OPENED' }, sla: ['CS_HANDOVER'] },
      { key: 'pack', aliasKey: 'gr_received', label: 'Pack สินค้า', where: { stage: 'GR_RECEIVED' }, sla: ['GR_PACK'] },
      { key: 'handoff', aliasKey: 'gr_packed', label: 'ส่งมอบขนส่ง', where: { stage: 'GR_PACKED' }, sla: ['GR_HANDOFF', 'CARRIER_PICKUP'] },
      { key: 'return', aliasKey: 'inbound', label: 'รับคืนจาก VD/DC/3PL', where: { stage: 'INBOUND_TO_BRANCH' }, sla: ['GR_RETURN_RECEIVE'] },
      { key: 'deliverCS', aliasKey: 'return_received', label: 'รอส่งมอบ CS', where: { stage: 'GR_RETURN_RECEIVED' }, sla: ['GR_DELIVER_CS'] },
    ],
  },
  DC: {
    roles: ['DC', 'ADMIN'],
    tabs: [
      { key: 'pickup', aliasKey: 'from_branch', label: 'เข้ารับจากสาขา', where: { stage: 'GR_PACKED', channel: 'DC' }, sla: ['CARRIER_PICKUP', 'GR_HANDOFF'] },
      { key: 'receiveDC', aliasKey: 'outbound_to_dc', label: 'รับเข้า Location', where: { stage: 'OUTBOUND_TO_DC' }, sla: ['DC_RECEIVE_LOCATION'] },
      { key: 'handoffVD', aliasKey: 'at_dc_outbound', label: 'ส่งมอบให้ VD', where: { stage: 'AT_DC_OUTBOUND' }, sla: ['VD_PICKUP_AT_DC'] },
      { key: 'returnFromVD', aliasKey: 'return_from_vd', label: 'รับคืนจาก VD', where: { stage: 'INBOUND_TO_DC' }, sla: ['DC_RETURN_RECEIVE'] },
      { key: 'dispatchBranch', aliasKey: 'at_dc_inbound', label: 'ส่งคืนกลับสาขา', where: { stage: 'AT_DC_INBOUND' }, sla: ['DC_DISPATCH_BRANCH'] },
    ],
  },
  VD: {
    roles: ['VD', 'ADMIN'],
    tabs: [
      {
        key: 'receive', aliasKey: 'incoming', label: 'งานรอรับ',
        where: { OR: [{ stage: 'GR_PACKED', channel: { in: ['DSD', 'TPL'] } }, { stage: { in: ['AT_DC_OUTBOUND', 'OUTBOUND_TO_VD'] } }] },
        sla: ['VD_RECEIVE', 'VD_PICKUP_AT_DC', 'CARRIER_PICKUP'],
      },
      { key: 'quote', aliasKey: 'inspecting', label: 'ประเมิน/เสนอราคา', where: { stage: 'VD_INSPECTING' }, sla: ['VD_QUOTE'] },
      { key: 'approval', aliasKey: 'waiting_approval', label: 'รอลูกค้าอนุมัติ', where: { stage: 'WAITING_APPROVAL' }, sla: ['CUSTOMER_APPROVAL'] },
      { key: 'repair', aliasKey: 'repairing', label: 'กำลังซ่อม', where: { stage: 'REPAIRING' }, sla: ['VD_REPAIR'] },
      { key: 'return', aliasKey: 'return_packing', label: 'Pack และส่งคืน', where: { stage: 'RETURN_PACKING' }, sla: ['VD_RETURN_PACK'] },
    ],
  },
  CS: {
    roles: ['CS', 'ADMIN'],
    tabs: [
      { key: 'receive', label: 'รอรับของเข้า CS', where: { stage: 'READY_FOR_PICKUP', type: 'CUSTOMER' }, sla: ['GR_DELIVER_CS', 'CUSTOMER_PICKUP'] },
      { key: 'pickup', label: 'พร้อมรับที่สาขา', where: { stage: 'READY_FOR_PICKUP', type: 'CUSTOMER' }, sla: ['CUSTOMER_PICKUP'] },
      { key: 'approval', label: 'รอลูกค้าอนุมัติ', where: { stage: 'WAITING_APPROVAL' }, sla: ['CUSTOMER_APPROVAL'] },
      { key: 'opened', label: 'เปิดวันนี้ / รอชำระ', where: { type: 'CUSTOMER', stage: { in: ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'] } }, sla: ['CS_HANDOVER'] },
    ],
  },
  ADMIN: {
    roles: ['ADMIN'],
    tabs: [
      { key: 'pendingVendor', label: 'รอกำหนดศูนย์ซ่อม', where: { stage: 'PENDING_VENDOR_ASSIGNMENT' }, sla: ['CS_HANDOVER'] },
    ],
  },
}
