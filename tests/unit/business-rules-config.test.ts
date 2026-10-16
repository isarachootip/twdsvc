import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import { executeAction } from '../../src/lib/state-machine/engine'
import { setSetting, SETTING_DEFAULTS } from '../../src/lib/settings'
import {
  getCsCancelAllowedStages,
  canActorCancelJob,
  applySlaTierMultiplier,
  parseSlaTierConfig,
} from '../../src/lib/business-rules'

setTier('Tier 1')

describe('Phase 3.4 — Admin-Configurable Business Rules (Cancel Policy, Fees, Service Tiers)', () => {
  it('BR-01: getCsCancelAllowedStages & canActorCancelJob enforce BEFORE_GR vs BEFORE_CARRIER policies', () => {
    expect(getCsCancelAllowedStages('BEFORE_GR')).toEqual(['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'])
    expect(getCsCancelAllowedStages('BEFORE_CARRIER')).toEqual([
      'CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT', 'GR_RECEIVED', 'GR_PACKED',
    ])

    expect(canActorCancelJob('CS', 'CS_OPENED', 'BEFORE_GR').allowed).toBe(true)
    expect(canActorCancelJob('CS', 'GR_RECEIVED', 'BEFORE_GR').allowed).toBe(false)
    expect(canActorCancelJob('CS', 'GR_RECEIVED', 'BEFORE_CARRIER').allowed).toBe(true)
    expect(canActorCancelJob('CS', 'GR_PACKED', 'BEFORE_CARRIER').allowed).toBe(true)
    expect(canActorCancelJob('CS', 'OUTBOUND_TO_DC', 'BEFORE_CARRIER').allowed).toBe(false)
    expect(canActorCancelJob('ADMIN', 'OUTBOUND_TO_DC', 'BEFORE_GR').allowed).toBe(true)
  })

  it('BR-02: state-machine cancel action respects CS_CANCEL_POLICY setting dynamically', async () => {
    const branch = await prisma.site.findFirstOrThrow({ where: { type: 'BRANCH', active: true } })
    const job = await prisma.job.create({
      data: {
        jobNo: `BR-CANCEL-${Date.now()}`,
        type: 'CUSTOMER',
        stage: 'GR_RECEIVED',
        branchId: branch.id,
        customerName: 'สมชาย ทดสอบยกเลิก',
        customerPhone: '0815556666',
        productName: 'พัดลม',
        brandName: 'Hatari',
        createdBy: 'BNACS',
      },
    })
    const csActor = { userId: 'u_cs', role: 'CS', siteId: branch.id, vendorCenterId: null }

    try {
      await setSetting('CS_CANCEL_POLICY', 'BEFORE_GR')
      const denied = await executeAction(job.id, 'cancel', { reason: 'ลูกค้าเปลี่ยนใจ' }, csActor)
      expect(denied.success).toBe(false)

      await setSetting('CS_CANCEL_POLICY', 'BEFORE_CARRIER')
      const allowed = await executeAction(job.id, 'cancel', { reason: 'ลูกค้าเปลี่ยนใจ' }, csActor)
      expect(allowed.success).toBe(true)
      if (allowed.success) expect(allowed.job.stage).toBe('CANCELLED')
    } finally {
      await setSetting('CS_CANCEL_POLICY', SETTING_DEFAULTS.CS_CANCEL_POLICY)
      await prisma.job.delete({ where: { id: job.id } })
    }
  })

  it('BR-03: SLA_TIER_MULTIPLIERS defaults to disabled (multiplier 1.0) and scales hours when enabled', () => {
    const defCfg = parseSlaTierConfig(SETTING_DEFAULTS.SLA_TIER_MULTIPLIERS)
    expect(defCfg.enabled).toBe(false)
    expect(applySlaTierMultiplier(24, 'EXPRESS', defCfg)).toBe(24)

    const activeCfg = parseSlaTierConfig(JSON.stringify({ enabled: true, NORMAL: 1.0, EXPRESS: 0.5, VIP: 0.3 }))
    expect(applySlaTierMultiplier(24, 'EXPRESS', activeCfg)).toBe(12)
    expect(applySlaTierMultiplier(24, 'VIP', activeCfg)).toBe(8)
  })
})
