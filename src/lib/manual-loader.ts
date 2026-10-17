import { prisma } from './db'
import { normalizeCsCancelPolicy } from './business-rules'
import {
  DEFAULT_SLA_STEP_MAP,
  type SlaStepInfo,
  type FeeConfigInfo,
  type ManualCatalog,
  type ManualRoleGuide,
  type ManualStageRow,
  type ManualRuleItem,
  type ManualFaqItem,
} from './manual-data'
import { buildManualCatalog } from './manual-catalog'

export interface FilteredManualContent {
  roles: ManualRoleGuide[]
  allStages: ManualStageRow[]
  rules: ManualRuleItem[]
  faqs: ManualFaqItem[]
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
        r.id,
        r.title,
        r.subtitle,
        r.description,
        ...r.screens,
        ...r.managedStages,
        ...r.steps.map(s => `${s.title} ${s.detail} ${s.warning ?? ''}`),
      ]
        .join(' ')
        .toLowerCase()
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

export async function loadManualCatalog(): Promise<ManualCatalog> {
  try {
    const [slaRows, feeRows, cancelRow] = await Promise.all([
      prisma.slaStep.findMany({ where: { active: true }, orderBy: { seq: 'asc' } }),
      prisma.feeRate.findMany({ include: { sizeCategory: true } }),
      prisma.systemSetting.findUnique({ where: { key: 'CS_CANCEL_POLICY' } }),
    ])

    const slaMap: Record<string, SlaStepInfo> = { ...DEFAULT_SLA_STEP_MAP }
    for (const r of slaRows) {
      slaMap[r.code] = {
        code: r.code,
        name: r.name,
        ownerDept: r.ownerDept,
        hours: r.hours,
        pausable: r.pausable,
      }
    }

    const smallFee = feeRows.find(f => f.sizeCategory.code === 'SMALL')
    const largeFee = feeRows.find(f => f.sizeCategory.code === 'LARGE')
    const fees: FeeConfigInfo = {
      smallOpBaht: smallFee ? Math.round(smallFee.operationFee / 100) : 150,
      largeOpBaht: largeFee ? Math.round(largeFee.operationFee / 100) : 300,
      small3plBaht: smallFee ? Math.round(smallFee.shippingFee3pl / 100) : 80,
      large3plBaht: largeFee ? Math.round(largeFee.shippingFee3pl / 100) : 250,
    }

    return buildManualCatalog(slaMap, fees, normalizeCsCancelPolicy(cancelRow?.value))
  } catch {
    return buildManualCatalog()
  }
}
