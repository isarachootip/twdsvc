import { STAGE_ORDER, STAGE_LABELS, OWNER_LABELS, type Stage } from './constants'
import {
  DEFAULT_SLA_STEP_MAP, STAGE_META,
  type SlaStepInfo, type FeeConfigInfo, type ManualCatalog, type ManualChannel,
  type ManualPhase, type ManualFlowStep, type ManualStageRow, type ManualRuleItem,
  type ManualRoleGuide, type ManualFaqItem,
} from './manual-data'
import { ROLE_GUIDES, MANUAL_FAQS } from './manual-roles-faqs'

export { DEFAULT_SLA_STEP_MAP } from './manual-data'
export type {
  ManualRoleId, ManualChannel, ManualPhase, ManualCatalog,
  ManualFlowStep, ManualStageRow, ManualRuleItem, ManualFaqItem, ManualRoleGuide,
} from './manual-data'

export interface FilteredManualContent {
  roles: ManualRoleGuide[]
  allStages: ManualStageRow[]
  rules: ManualRuleItem[]
  faqs: ManualFaqItem[]
}

/** Pure client-safe owner resolution (matches sla-engine.ts resolveOwner §4.2) */
function resolveSlaOwner(ownerDept: string, stepCode: string, channel: string | null): string {
  if (ownerDept !== 'CARRIER') return ownerDept
  if (stepCode === 'VD_RECEIVE' && channel === 'DC') return 'VD'
  if (channel === 'DC') return 'DC'
  if (channel === 'DSD') return 'VD'
  if (channel === 'TPL') return 'TPL'
  return 'CARRIER'
}

export function formatSlaHours(hours: number | null | undefined): string {
  if (!hours || hours <= 0) return '-'
  if (hours >= 48 && hours % 24 === 0) return `${hours} ชม. (${hours / 24} วัน)`
  return `${hours} ชม.`
}

export function filterManualContent(catalog: ManualCatalog, query: string): FilteredManualContent {
  const q = (query ?? '').trim().toLowerCase()
  if (!q) {
    return {
      roles: catalog.roles,
      allStages: catalog.allStages,
      rules: catalog.rules,
      faqs: catalog.faqs,
    }
  }

  return {
    roles: catalog.roles.filter(r => {
      const hay = [
        r.id, r.title, r.subtitle, r.description,
        ...r.screens, ...r.managedStages,
        ...r.steps.map(s => `${s.title} ${s.detail} ${s.warning ?? ''}`),
      ].join(' ').toLowerCase()
      return hay.includes(q)
    }),
    allStages: catalog.allStages.filter(row => {
      const hay = `${row.stage} ${row.label} ${row.ownerDept} ${row.ownerLabel} ${row.slaCode ?? ''} ${row.slaText} ${row.screen} ${row.nextAction}`.toLowerCase()
      return hay.includes(q)
    }),
    rules: catalog.rules.filter(rule => {
      const hay = `${rule.code} ${rule.title} ${rule.summary} ${rule.detail}`.toLowerCase()
      return hay.includes(q)
    }),
    faqs: catalog.faqs.filter(faq => {
      const hay = `${faq.q} ${faq.a} ${faq.tags}`.toLowerCase()
      return hay.includes(q)
    }),
  }
}

function buildSystemRules(fees: FeeConfigInfo, cancelPolicy: 'BEFORE_GR' | 'BEFORE_CARRIER'): ManualRuleItem[] {
  const cancelDesc = cancelPolicy === 'BEFORE_CARRIER'
    ? 'CS ยกเลิกใบงานได้ก่อนส่งมอบให้ขนส่ง (PENDING_VENDOR_ASSIGNMENT, CS_OPENED, GR_RECEIVED, GR_PACKED)'
    : 'CS ยกเลิกใบงานได้เฉพาะก่อนส่งมอบให้แผนก GR (PENDING_VENDOR_ASSIGNMENT และ CS_OPENED)'

  return [
    { code: 'RULE-01', title: 'ต้องชำระค่าดำเนินการก่อนส่งมอบ GR', summary: 'ใบงานนอกประกันต้องรับชำระค่าดำเนินการก่อนเข้าคิว GR', detail: 'ระบบบล็อกไม่ให้แผนก GR กดรับสินค้าจาก CS จนกว่าใบงานนอกประกันจะบันทึกการรับชำระเงินและเลขใบเสร็จ POS เรียบร้อย' },
    { code: 'RULE-02', title: 'อัตราค่าดำเนินการนอกประกัน & ค่าขนส่งด่วน 3PL Express', summary: `ค่าดำเนินการ: สินค้าขนาดเล็ก ฿${fees.smallOpBaht} / ขนาดใหญ่ ฿${fees.largeOpBaht} · 3PL Express: +฿${fees.small3plBaht} / +฿${fees.large3plBaht}`, detail: 'งานนอกประกันเรียกเก็บค่าดำเนินการตามขนาดสินค้า (หักลดเป็นเครดิตค่าซ่อมเมื่ออนุมัติซ่อม หากไม่อนุมัติซ่อมไม่คืนเงิน) ผู้ดูแลระบบปรับอัตราได้ที่ /admin/fees' },
    { code: 'RULE-03', title: 'กฎการยกเลิกใบงาน (Cancellation Policy)', summary: cancelDesc, detail: 'การยกเลิกใบงานทุกครั้งต้องระบุเหตุผล ระบบจะยกเลิกรายการขนส่งและคืนสถานะรายการรอชำระอัตโนมัติ (Admin ปรับนโยบายได้ที่ /admin/general)' },
    { code: 'RULE-04', title: 'การเปลี่ยนและถอยสถานะตามลำดับขั้นตอน', summary: 'ห้ามข้ามขั้นตอนและทุกการเปลี่ยนสถานะจะบันทึกประวัติพร้อมเวลา (Audit Trail)', detail: 'ระบบ State Machine ตรวจสอบสิทธิ์ตามบทบาทและสถานะปัจจุบันทุกครั้ง หากต้องการพักเวลา SLA รออะไหล่ต้องกด Pause พร้อมระบุเหตุผล' },
    { code: 'RULE-05', title: 'ลูกค้าเห็นเฉพาะราคาขายสุทธิในใบเสนอราคาออนไลน์', summary: 'พอร์ทัลลูกค้า /q/[token] แสดงเฉพาะราคาขายและเครดิตค่าเปิดเครื่อง', detail: 'ช่าง VD บันทึกรายการอะไหล่และค่าแรงในระบบ แต่หน้าใบเสนอราคาของลูกค้าจะแสดงเฉพาะราคาขายสุทธิและยอดหักค่าเปิดเครื่อง ไม่เปิดเผยต้นทุนหรือ GP ภายใน' },
    { code: 'RULE-06', title: 'การปิดงานส่งมอบต้องมียอดค้างชำระ ฿0 และมีลายเซ็นดิจิทัล', summary: 'งานลูกค้าต้องชำระยอดคงเหลือครบ ฿0 และลงนามรับสินค้าก่อนปิดงาน', detail: 'ระบบตรวจสอบยอดคงเหลือ (หักเครดิตค่าเปิดเครื่องแล้ว) ต้องเท่ากับ ฿0 และต้องมีลายเซ็นรับสินค้าใน Digital Signature Canvas (ยกเว้นงานสต็อก S2 ที่ไม่มีการเงิน)' },
  ]
}

export function buildManualCatalog(
  slaMap: Record<string, SlaStepInfo> = DEFAULT_SLA_STEP_MAP,
  fees: FeeConfigInfo = { smallOpBaht: 150, largeOpBaht: 300, small3plBaht: 80, large3plBaht: 250 },
  cancelPolicy: 'BEFORE_GR' | 'BEFORE_CARRIER' = 'BEFORE_GR'
): ManualCatalog {
  const allStages: ManualStageRow[] = STAGE_ORDER.map(stage => {
    const meta = STAGE_META[stage]
    const sla = meta.slaCode ? slaMap[meta.slaCode] : undefined
    const ownerDept = sla?.ownerDept ?? meta.ownerDept
    return {
      phase: meta.phase,
      stage,
      label: STAGE_LABELS[stage],
      ownerDept,
      ownerLabel: OWNER_LABELS[ownerDept] ?? ownerDept,
      slaCode: meta.slaCode,
      slaText: formatSlaHours(sla?.hours ?? null),
      screen: meta.screen,
      nextAction: meta.nextAction,
    }
  })

  return {
    roles: ROLE_GUIDES,
    allStages,
    rules: buildSystemRules(fees, cancelPolicy),
    faqs: MANUAL_FAQS,
    slaMap,
    fees,
    cancelPolicy,
  }
}

function makeStep(
  catalog: ManualCatalog,
  stage: Stage,
  channel: ManualChannel,
  customNote?: string,
  customLabel?: string,
  customEnum?: string
): ManualFlowStep {
  const meta = STAGE_META[stage]
  const sla = meta.slaCode ? catalog.slaMap[meta.slaCode] : undefined
  const rawOwner = sla?.ownerDept ?? meta.ownerDept
  const resolvedOwner = meta.slaCode ? resolveSlaOwner(rawOwner, meta.slaCode, channel) : rawOwner
  return {
    phase: meta.phase,
    stage,
    label: customLabel ?? STAGE_LABELS[stage],
    enumCode: customEnum ?? stage,
    ownerDept: resolvedOwner,
    ownerLabel: OWNER_LABELS[resolvedOwner] ?? resolvedOwner,
    slaCode: meta.slaCode,
    slaHours: sla?.hours ?? null,
    slaText: formatSlaHours(sla?.hours ?? null),
    pausable: Boolean(sla?.pausable),
    screen: meta.screen,
    note: customNote ?? meta.nextAction,
  }
}

export function getFlowStepsForChannel(
  catalog: ManualCatalog,
  channel: ManualChannel,
  phaseFilter: ManualPhase | 'ALL' = 'ALL'
): ManualFlowStep[] {
  const steps: ManualFlowStep[] = [
    makeStep(catalog, 'CS_OPENED', channel),
    makeStep(catalog, 'GR_RECEIVED', channel),
    makeStep(catalog, 'GR_PACKED', channel),
  ]

  if (channel === 'DC') {
    steps.push(
      makeStep(catalog, 'OUTBOUND_TO_DC', channel),
      makeStep(catalog, 'AT_DC_OUTBOUND', channel),
      makeStep(catalog, 'OUTBOUND_TO_VD', channel, 'ศูนย์ซ่อม VD รับสินค้าจากคลัง DC เข้าศูนย์ซ่อม')
    )
  } else if (channel === 'TPL') {
    steps.push(makeStep(catalog, 'OUTBOUND_TO_VD', channel, 'ขนส่งเอกชน (3PL) จัดส่งสินค้าตรงถึงศูนย์ซ่อม VD'))
  } else {
    steps.push(makeStep(catalog, 'OUTBOUND_TO_VD', channel, 'รถของศูนย์ซ่อม VD เข้ารับสินค้าที่สาขาโดยตรง (DSD)'))
  }

  steps.push(
    makeStep(catalog, 'VD_INSPECTING', channel),
    makeStep(catalog, 'WAITING_APPROVAL', channel),
    makeStep(catalog, 'REPAIRING', channel, 'ดำเนินการซ่อม (หากลูกค้าไม่อนุมัติซ่อม จะข้ามไป RETURN_PACKING ทันที)'),
    makeStep(catalog, 'RETURN_PACKING', channel)
  )

  if (channel === 'DC') {
    steps.push(makeStep(catalog, 'INBOUND_TO_DC', channel), makeStep(catalog, 'AT_DC_INBOUND', channel))
  }

  steps.push(
    makeStep(catalog, 'INBOUND_TO_BRANCH', channel),
    makeStep(catalog, 'GR_RETURN_RECEIVED', channel),
    makeStep(catalog, 'READY_FOR_PICKUP', channel),
    makeStep(
      catalog,
      'CLOSED_REPAIRED',
      channel,
      'ปิดใบงานเมื่อส่งมอบคืนลูกค้า (หรือคืนสต็อก S2)',
      `${STAGE_LABELS.CLOSED_REPAIRED} / ${STAGE_LABELS.CLOSED_NOT_REPAIRED}`,
      'CLOSED_REPAIRED / CLOSED_NOT_REPAIRED'
    ),
    {
      phase: 3,
      stage: 'VD_PAYOUT',
      label: 'ทำจ่ายค่าซ่อมเวนเดอร์ (VD Payout)',
      enumCode: 'VD_PAYOUT',
      ownerDept: 'ADMIN',
      ownerLabel: 'Admin / บัญชี',
      slaCode: null,
      slaHours: null,
      slaText: 'ตามรอบทำจ่าย',
      pausable: false,
      screen: '/reports/vd-payment',
      note: 'รวบรวมใบงานที่ปิดงานซ่อมสำเร็จเพื่อออกใบสรุปยอดจ่ายเงินให้เวนเดอร์',
    }
  )

  return phaseFilter === 'ALL' ? steps : steps.filter(s => s.phase === phaseFilter)
}
