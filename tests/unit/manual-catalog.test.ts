import { describe, it, expect, setTier } from '../framework/core'
import { STAGE_ORDER, STAGE_LABELS } from '../../src/lib/constants'
import {
  buildManualCatalog,
  getFlowStepsForChannel,
  filterManualContent,
  DEFAULT_SLA_STEP_MAP,
} from '../../src/lib/manual-catalog'
import { loadManualCatalog } from '../../src/lib/manual-loader'

setTier('Tier 1')

describe('Phase 4 — Manual Page Single Source of Truth, 3-Phase Flow & Search', () => {
  it('MAN-01: all 19 JobStage values in STAGE_ORDER appear in catalog.allStages with exact STAGE_LABELS', () => {
    const catalog = buildManualCatalog(DEFAULT_SLA_STEP_MAP, {
      smallOpBaht: 150,
      largeOpBaht: 300,
      small3plBaht: 80,
      large3plBaht: 250,
    }, 'BEFORE_GR')

    expect(catalog.allStages.length).toBe(STAGE_ORDER.length)
    for (const stage of STAGE_ORDER) {
      const row = catalog.allStages.find(r => r.stage === stage)
      expect(Boolean(row)).toBe(true)
      expect(row?.label).toBe(STAGE_LABELS[stage])
    }
  })

  it('MAN-02: dynamic SLA hours from SlaStep propagate to flow steps and allStages table without hardcoding', () => {
    const customSla = {
      ...DEFAULT_SLA_STEP_MAP,
      GR_PACK: { code: 'GR_PACK', name: 'GR Pack สินค้าลงกล่อง', ownerDept: 'GR', hours: 9, pausable: false },
      VD_QUOTE: { code: 'VD_QUOTE', name: 'VD ประเมิน/เสนอราคา', ownerDept: 'VD', hours: 36, pausable: false },
    }
    const catalog = buildManualCatalog(customSla, {
      smallOpBaht: 150,
      largeOpBaht: 300,
      small3plBaht: 80,
      large3plBaht: 250,
    }, 'BEFORE_GR')

    const grRow = catalog.allStages.find(r => r.stage === 'GR_RECEIVED')
    expect(grRow?.slaText).toBe('9 ชม.')

    const dcFlow = getFlowStepsForChannel(catalog, 'DC', 'ALL')
    const quoteStep = dcFlow.find(s => s.stage === 'VD_INSPECTING')
    expect(quoteStep?.slaText).toBe('36 ชม.')
  })

  it('MAN-03: S2 role guide accurately describes Branch Stock Repair (/s2) with no customer/financial steps', () => {
    const catalog = buildManualCatalog(DEFAULT_SLA_STEP_MAP, {
      smallOpBaht: 150,
      largeOpBaht: 300,
      small3plBaht: 80,
      large3plBaht: 250,
    }, 'BEFORE_GR')

    const s2Guide = catalog.roles.find(r => r.id === 'S2')
    expect(Boolean(s2Guide)).toBe(true)
    expect(s2Guide?.title.includes('เปิดใบแจ้งซ่อมสต็อกสาขา')).toBe(true)
    expect(s2Guide?.description.includes('ไม่มีข้อมูลลูกค้า')).toBe(true)
    expect(s2Guide?.description.includes('ฝ่ายประสานงานและเร่งรัดงาน')).toBe(false)
    expect(s2Guide?.screens).toContain('/s2')
    expect((s2Guide?.steps.length ?? 0) >= 3).toBe(true)
  })

  it('MAN-04: 3-phase flow filters accurately by channel (TPL, DSD, DC) and phase (1, 2, 3)', () => {
    const catalog = buildManualCatalog(DEFAULT_SLA_STEP_MAP, {
      smallOpBaht: 150,
      largeOpBaht: 300,
      small3plBaht: 80,
      large3plBaht: 250,
    }, 'BEFORE_GR')

    const dcPhase1 = getFlowStepsForChannel(catalog, 'DC', 1)
    expect(dcPhase1.some(s => s.stage === 'OUTBOUND_TO_DC')).toBe(true)
    expect(dcPhase1.some(s => s.stage === 'AT_DC_OUTBOUND')).toBe(true)

    const tplPhase1 = getFlowStepsForChannel(catalog, 'TPL', 1)
    expect(tplPhase1.some(s => s.stage === 'OUTBOUND_TO_VD')).toBe(true)
    expect(tplPhase1.some(s => s.stage === 'AT_DC_OUTBOUND')).toBe(false)

    const dsdPhase1 = getFlowStepsForChannel(catalog, 'DSD', 1)
    expect(dsdPhase1.some(s => s.ownerLabel === 'VD')).toBe(true)

    const phase2 = getFlowStepsForChannel(catalog, 'DC', 2)
    expect(phase2.map(s => s.stage)).toEqual(['VD_INSPECTING', 'WAITING_APPROVAL', 'REPAIRING'])

    const dcPhase3 = getFlowStepsForChannel(catalog, 'DC', 3)
    expect(dcPhase3.some(s => s.stage === 'INBOUND_TO_DC')).toBe(true)
    expect(dcPhase3.some(s => s.stage === 'VD_PAYOUT')).toBe(true)
  })

  it('MAN-05: filterManualContent searches across status names, enum codes, rules, FAQs, and role steps', () => {
    const catalog = buildManualCatalog(DEFAULT_SLA_STEP_MAP, {
      smallOpBaht: 150,
      largeOpBaht: 300,
      small3plBaht: 80,
      large3plBaht: 250,
    }, 'BEFORE_GR')

    const byEnum = filterManualContent(catalog, 'GR_RETURN_RECEIVED')
    expect(byEnum.allStages.length).toBe(1)
    expect(byEnum.allStages[0].stage).toBe('GR_RETURN_RECEIVED')

    const byFaq = filterManualContent(catalog, 'SMS')
    expect(byFaq.faqs.length > 0).toBe(true)

    const byRule = filterManualContent(catalog, '150')
    expect(byRule.rules.length > 0).toBe(true)
  })

  it('MAN-06: loadManualCatalog reads live SlaStep, FeeRate, and CS_CANCEL_POLICY from database', async () => {
    const catalog = await loadManualCatalog()
    expect(catalog.roles.length).toBe(6)
    expect(catalog.allStages.length).toBe(19)
    expect(catalog.rules.length).toBe(6)
    expect(catalog.faqs.length >= 4).toBe(true)
  })
})
