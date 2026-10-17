import type { Stage } from './constants'

export type ManualRoleId = 'CS' | 'GR' | 'DC' | 'VD' | 'S2' | 'ADMIN'
export type ManualChannel = 'TPL' | 'DSD' | 'DC'
export type ManualPhase = 1 | 2 | 3

export interface SlaStepInfo {
  code: string
  name: string
  ownerDept: string
  hours: number
  pausable: boolean
}

export interface FeeConfigInfo {
  smallOpBaht: number
  largeOpBaht: number
  small3plBaht: number
  large3plBaht: number
}

export interface ManualRoleStep {
  title: string
  detail: string
  warning?: string
}

export interface ManualRoleGuide {
  id: ManualRoleId
  badge: string
  title: string
  subtitle: string
  description: string
  screens: string[]
  managedStages: Stage[]
  steps: ManualRoleStep[]
}

export interface ManualFlowStep {
  phase: ManualPhase
  stage: Stage | 'VD_PAYOUT'
  label: string
  enumCode: string
  ownerDept: string
  ownerLabel: string
  slaCode: string | null
  slaHours: number | null
  slaText: string
  pausable: boolean
  screen: string
  note: string
}

export interface ManualStageRow {
  phase: ManualPhase
  stage: Stage
  label: string
  ownerDept: string
  ownerLabel: string
  slaCode: string | null
  slaText: string
  screen: string
  nextAction: string
}

export interface ManualRuleItem {
  code: string
  title: string
  summary: string
  detail: string
}

export interface ManualFaqItem {
  id: string
  q: string
  a: string
  tags: string
}

export interface ManualCatalog {
  roles: ManualRoleGuide[]
  allStages: ManualStageRow[]
  rules: ManualRuleItem[]
  faqs: ManualFaqItem[]
  slaMap: Record<string, SlaStepInfo>
  fees: FeeConfigInfo
  cancelPolicy: 'BEFORE_GR' | 'BEFORE_CARRIER'
}

export const DEFAULT_SLA_STEP_MAP: Record<string, SlaStepInfo> = {
  CS_HANDOVER:         { code: 'CS_HANDOVER',         name: 'CS เปิดใบแจ้งซ่อม → ส่งมอบ GR',   ownerDept: 'CS',       hours: 24,  pausable: false },
  GR_PACK:             { code: 'GR_PACK',             name: 'GR Pack สินค้าลงกล่อง',              ownerDept: 'GR',       hours: 4,   pausable: false },
  CARRIER_PICKUP:      { code: 'CARRIER_PICKUP',      name: 'DC/VD/3PL เข้ารับสินค้าที่สาขา',   ownerDept: 'CARRIER',  hours: 24,  pausable: false },
  GR_HANDOFF:          { code: 'GR_HANDOFF',          name: 'GR ส่งมอบให้ DC/VD/3PL',            ownerDept: 'GR',       hours: 4,   pausable: false },
  DC_RECEIVE_LOCATION: { code: 'DC_RECEIVE_LOCATION', name: 'DC รับเข้า Location',                ownerDept: 'DC',       hours: 4,   pausable: false },
  VD_PICKUP_AT_DC:     { code: 'VD_PICKUP_AT_DC',     name: 'VD เข้ารับสินค้าที่ DC',             ownerDept: 'VD',       hours: 24,  pausable: false },
  VD_RECEIVE:          { code: 'VD_RECEIVE',          name: 'สินค้าถึงศูนย์ VD',                 ownerDept: 'CARRIER',  hours: 24,  pausable: false },
  VD_QUOTE:            { code: 'VD_QUOTE',            name: 'VD ประเมิน/เสนอราคา',                ownerDept: 'VD',       hours: 48,  pausable: false },
  CUSTOMER_APPROVAL:   { code: 'CUSTOMER_APPROVAL',   name: 'รอลูกค้าอนุมัติ',                   ownerDept: 'CUSTOMER', hours: 48,  pausable: false },
  VD_REPAIR:           { code: 'VD_REPAIR',           name: 'VD ระยะเวลาซ่อม',                   ownerDept: 'VD',       hours: 168, pausable: true },
  VD_RETURN_PACK:      { code: 'VD_RETURN_PACK',      name: 'VD Pack ส่งคืน',                     ownerDept: 'VD',       hours: 24,  pausable: false },
  DC_RETURN_RECEIVE:   { code: 'DC_RETURN_RECEIVE',   name: 'DC รับคืนจาก VD',                   ownerDept: 'DC',       hours: 24,  pausable: false },
  DC_DISPATCH_BRANCH:  { code: 'DC_DISPATCH_BRANCH',  name: 'DC ส่งคืนกลับสาขา',                 ownerDept: 'DC',       hours: 24,  pausable: false },
  GR_RETURN_RECEIVE:   { code: 'GR_RETURN_RECEIVE',   name: 'สินค้าคืนถึงสาขา (GR รับคืน)',    ownerDept: 'CARRIER',  hours: 24,  pausable: false },
  GR_DELIVER_CS:       { code: 'GR_DELIVER_CS',       name: 'GR ส่งมอบ CS',                       ownerDept: 'GR',       hours: 4,   pausable: false },
  CUSTOMER_PICKUP:     { code: 'CUSTOMER_PICKUP',     name: 'ลูกค้าเข้ารับสินค้า / ปิดงาน',    ownerDept: 'CS',       hours: 168, pausable: false },
}

export const STAGE_META: Record<Stage, { phase: ManualPhase; slaCode: string | null; ownerDept: string; screen: string; nextAction: string }> = {
  PENDING_VENDOR_ASSIGNMENT: { phase: 1, slaCode: 'CS_HANDOVER', ownerDept: 'CS', screen: '/cs', nextAction: 'กำหนดศูนย์ซ่อม VD ปลายทาง และรับชำระค่าดำเนินการ (ถ้ามี)' },
  CS_OPENED:                 { phase: 1, slaCode: 'CS_HANDOVER', ownerDept: 'CS', screen: '/cs, /gr', nextAction: 'ชำระค่าดำเนินการให้ครบ (งานนอกประกัน) และนำสินค้าส่งมอบแผนก GR' },
  GR_RECEIVED:               { phase: 1, slaCode: 'GR_PACK', ownerDept: 'GR', screen: '/gr', nextAction: 'GR ตรวจรับสินค้า แพ็กใส่กล่องกันกระแทก และกดยืนยันแพ็กเสร็จ' },
  GR_PACKED:                 { phase: 1, slaCode: 'CARRIER_PICKUP', ownerDept: 'CARRIER', screen: '/gr', nextAction: 'เรียกขนส่ง (DC / DSD / 3PL) เข้ารับสินค้าและส่งมอบออกจากสาขา' },
  OUTBOUND_TO_DC:            { phase: 1, slaCode: 'DC_RECEIVE_LOCATION', ownerDept: 'DC', screen: '/dc', nextAction: 'คลัง DC ตรวจรับสินค้าจากรถสาขาและระบุพิกัดจัดเก็บ (Location)' },
  AT_DC_OUTBOUND:            { phase: 1, slaCode: 'VD_PICKUP_AT_DC', ownerDept: 'VD', screen: '/dc', nextAction: 'DC ส่งมอบสินค้าต่อให้รถศูนย์ซ่อม VD ที่มารับของที่คลังกลาง' },
  OUTBOUND_TO_VD:            { phase: 1, slaCode: 'VD_RECEIVE', ownerDept: 'CARRIER', screen: '/vd', nextAction: 'ศูนย์ซ่อม VD กดยืนยันรับสินค้าเข้าศูนย์เพื่อเริ่มตรวจเช็ค' },
  VD_INSPECTING:             { phase: 2, slaCode: 'VD_QUOTE', ownerDept: 'VD', screen: '/vd', nextAction: 'ช่างตรวจเช็คอาการเสีย ออกใบเสนอราคา (งานลูกค้า) หรือเริ่มซ่อมทันที (ในประกัน/สต็อก)' },
  WAITING_APPROVAL:          { phase: 2, slaCode: 'CUSTOMER_APPROVAL', ownerDept: 'CUSTOMER', screen: '/q/[token], /cs', nextAction: 'ลูกค้ากดอนุมัติ/ไม่อนุมัติผ่านลิงก์ /q/[token] หรือ CS บันทึกผลแทนลูกค้า' },
  REPAIRING:                 { phase: 2, slaCode: 'VD_REPAIR', ownerDept: 'VD', screen: '/vd', nextAction: 'ช่างดำเนินการซ่อม (หยุดเวลา SLA ชั่วคราวได้หากรออะไหล่) และกดซ่อมเสร็จ' },
  RETURN_PACKING:            { phase: 3, slaCode: 'VD_RETURN_PACK', ownerDept: 'VD', screen: '/vd', nextAction: 'VD แพ็กสินค้าเตรียมส่งคืนสาขา (หรือส่งคืนผ่านคลัง DC)' },
  INBOUND_TO_DC:             { phase: 3, slaCode: 'DC_RETURN_RECEIVE', ownerDept: 'DC', screen: '/dc', nextAction: 'คลัง DC กดรับสินค้าคืนจาก VD เข้าพิกัดพักสินค้าขากลับ' },
  AT_DC_INBOUND:             { phase: 3, slaCode: 'DC_DISPATCH_BRANCH', ownerDept: 'DC', screen: '/dc', nextAction: 'DC จัดส่งสินค้าขึ้นรถสายส่งคืนสาขาต้นทาง' },
  INBOUND_TO_BRANCH:         { phase: 3, slaCode: 'GR_RETURN_RECEIVE', ownerDept: 'CARRIER', screen: '/gr', nextAction: 'แผนก GR สาขาต้นทางตรวจรับสินค้าซ่อมเสร็จกลับเข้าคลังสาขา' },
  GR_RETURN_RECEIVED:        { phase: 3, slaCode: 'GR_DELIVER_CS', ownerDept: 'GR', screen: '/gr, /cs', nextAction: 'GR ส่งมอบสินค้าคืนให้เคาน์เตอร์ CS (หรือ S2 สำหรับงานสต็อก)' },
  READY_FOR_PICKUP:          { phase: 3, slaCode: 'CUSTOMER_PICKUP', ownerDept: 'CS', screen: '/cs, /s2', nextAction: 'CS แจ้งลูกค้ารับสินค้า ชำระยอดคงเหลือ ฿0 ลงลายเซ็น และปิดงาน (งานสต็อกปิดโดย S2/GR)' },
  CLOSED_REPAIRED:           { phase: 3, slaCode: null, ownerDept: 'CS', screen: '/jobs, /reports/vd-payment', nextAction: 'ปิดงานซ่อมสำเร็จ — นำไปคำนวณรอบทำจ่ายค่าซ่อมให้เวนเดอร์ (VD Payout)' },
  CLOSED_NOT_REPAIRED:       { phase: 3, slaCode: null, ownerDept: 'CS', screen: '/jobs', nextAction: 'ปิดงานแบบไม่ซ่อม (ส่งคืนสินค้าสภาพเดิมให้ลูกค้าเรียบร้อย)' },
  CANCELLED:                 { phase: 1, slaCode: null, ownerDept: 'CS', screen: '/jobs', nextAction: 'ใบงานถูกยกเลิกและคืนสถานะรายการชำระเงินที่ค้างอยู่' },
}
