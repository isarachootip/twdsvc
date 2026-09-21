/**
 * Tier 5: Adversarial Stress Test Suite — Challenger M6-1
 * Rigorous empirical verification of:
 * 1. 19-stage state machine integrity, illegal jumps, and bypassed actions
 * 2. Contract S7 optimistic concurrency & version checking
 * 3. Tenant scoping & IDOR guards (S1-S6)
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { STAGE_ORDER, CLOSED_STAGES } from '../../../src/lib/constants'
import { ActionError, isValidAction } from '../../../src/lib/state-machine'
import { jobScope } from '../../../src/lib/api'
import type { UserSession } from '../../../src/lib/auth'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 5')

describe('Tier 5: Challenger M6-1 - 19-Stage State Machine Integrity & Illegal Jumps', () => {
  it('ADV-SM-01: Verify all 19 stages are uniquely defined and recognized in STAGE_ORDER', () => {
    expect(STAGE_ORDER.length).toBe(19)
    const uniqueStages = new Set(STAGE_ORDER)
    expect(uniqueStages.size).toBe(19)
  })

  it('ADV-SM-02: Direct illegal jump from CS_OPENED to CLOSED_REPAIRED is rejected', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'CS_OPENED' })
    const res = simulateAction(job, 'cs_close', csUser)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot cs_close from CS_OPENED')
  })

  it('ADV-SM-03: Direct illegal jump from CS_OPENED to REPAIRING is rejected', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({ stage: 'CS_OPENED', vendorCenterId: 'vc-001' })
    const res = simulateAction(job, 'vd_start_repair', vdUser)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot vd_start_repair from CS_OPENED')
  })

  it('ADV-SM-04: Direct illegal jump from PENDING_VENDOR_ASSIGNMENT to GR_PACKED is rejected', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'PENDING_VENDOR_ASSIGNMENT' })
    const res = simulateAction(job, 'gr_pack', grUser, { location: 'A-01-01', photos: ['p.jpg'] })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot gr_pack from PENDING_VENDOR_ASSIGNMENT')
  })

  it('ADV-SM-05: Direct illegal jump from WAITING_APPROVAL to READY_FOR_PICKUP is rejected', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'WAITING_APPROVAL' })
    const res = simulateAction(job, 'gr_deliver_cs', grUser, { photos: ['p.jpg'] })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot gr_deliver_cs from WAITING_APPROVAL')
  })

  it('ADV-SM-06: Unrecognized action names are strictly invalid', () => {
    expect(isValidAction('hack_admin')).toBe(false)
    expect(isValidAction('sudo_close')).toBe(false)
    expect(isValidAction('')).toBe(false)
    expect(isValidAction('arbitrary_transition')).toBe(false)
  })

  it('ADV-SM-07: Valid action aliases are correctly recognized', () => {
    expect(isValidAction('cs_close')).toBe(true)
    expect(isValidAction('cs_close_job')).toBe(true)
    expect(isValidAction('cs_trade_in')).toBe(true)
    expect(isValidAction('cs_return_only')).toBe(true)
    expect(isValidAction('cs_receive_payment')).toBe(true)
  })

  it('ADV-SM-08: Terminal stage immutability — all 3 closed stages reject further transitions', () => {
    const csUser = createMockUser({ role: 'CS' })
    const adminUser = createMockUser({ role: 'ADMIN' })

    for (const closedStage of CLOSED_STAGES) {
      const job = createMockJob({ stage: closedStage })
      const resClose = simulateAction(job, 'cs_close', csUser)
      expect(resClose.success).toBe(false)

      const resCancel = simulateAction(job, 'cancel', adminUser, { reason: 'Test' })
      expect(resCancel.success).toBe(false)
    }
  })

  it('ADV-SM-09: ActionError propagates HTTP 409 for invalid stage transitions', () => {
    const err = new ActionError('งาน JB-01 ไม่อยู่ในขั้นตอนที่ทำรายการนี้ได้ (ปัจจุบัน: CS_OPENED)', 409)
    expect(err.status).toBe(409)
    expect(err.message).toContain('409')
  })

  it('ADV-SM-10: ActionError propagates HTTP 400 for bad request validation', () => {
    const err = new ActionError('รูปแบบ Location ไม่ถูกต้อง', 400)
    expect(err.status).toBe(400)
  })
})

describe('Tier 5: Challenger M6-1 - Contract S7 Optimistic Concurrency & Version Checks', () => {
  it('ADV-CON-01: Mismatched client version triggers optimistic lock rejection with 409', () => {
    const grUser = createMockUser({ role: 'GR' })
    const currentJob = createMockJob({ stage: 'CS_OPENED', version: 5 })

    // Stale attempt with version 4
    const staleRes = simulateAction(currentJob, 'gr_receive', grUser, {
      expectedVersion: 4,
      location: 'A-01-01',
      photos: ['p.jpg'],
    })
    expect(staleRes.success).toBe(false)
    expect(staleRes.error).toContain('409')
  })

  it('ADV-CON-02: Up-to-date client version succeeds and increments version atomically', () => {
    const grUser = createMockUser({ role: 'GR' })
    const currentJob = createMockJob({ stage: 'CS_OPENED', version: 5 })

    const validRes = simulateAction(currentJob, 'gr_receive', grUser, {
      expectedVersion: 5,
      location: 'A-01-01',
      photos: ['p.jpg'],
    })
    expect(validRes.success).toBe(true)
    expect(validRes.job?.version).toBe(6)
  })

  it('ADV-CON-03: Double quote decision attempt — second attempt is rejected', () => {
    const custUser = createMockUser({ role: 'CS' }) // Or customer token
    const job = createMockJob({
      stage: 'WAITING_APPROVAL',
      decision: 'PENDING',
      quotes: [{ version: 1, subtotalSatang: 50000, vatSatang: 3500, totalSatang: 53500, status: 'SENT' }],
    })

    const firstDecision = simulateAction(job, 'customer_approve', custUser)
    expect(firstDecision.success).toBe(true)
    expect(firstDecision.job?.stage).toBe('REPAIRING')

    // Second attempt on already transitioned job fails
    const secondDecision = simulateAction(firstDecision.job!, 'customer_approve', custUser)
    expect(secondDecision.success).toBe(false)
    expect(secondDecision.error).toContain('Cannot customer_approve from REPAIRING')
  })

  it('ADV-CON-04: Double full payment attempt — second payment is rejected as no outstanding balance', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      charges: [{ type: 'REPAIR', amountSatang: 50000 }],
      payments: [],
    })

    const pay1 = simulateAction(job, 'record_repair_payment', csUser, { amountSatang: 50000 })
    expect(pay1.success).toBe(true)

    // Attempting another payment when balance is 0 fails
    const pay2 = simulateAction(pay1.job!, 'record_repair_payment', csUser, { amountSatang: 50000 })
    expect(pay2.success).toBe(false)
    expect(pay2.error).toContain('No outstanding')
  })
})

describe('Tier 5: Challenger M6-1 - Tenant Scoping & Security IDOR Guards (S1-S6)', () => {
  it('ADV-SEC-01: jobScope restricts CS/GR/S2 users strictly to their assigned siteId', async () => {
    const csUser: UserSession = {
      id: 'u-cs-01',
      username: 'cs_bkk',
      fullName: 'CS Operator BKK',
      role: 'CS',
      siteId: 'SITE-BKK-01',
      vendorCenterId: null,
    }
    const scope = await jobScope(csUser)
    expect(scope).toEqual({ branchId: 'SITE-BKK-01' })
  })

  it('ADV-SEC-02: jobScope fails closed when CS/GR/S2 user has null or undefined siteId', async () => {
    const noSiteUser: UserSession = {
      id: 'u-cs-orphan',
      username: 'cs_orphan',
      fullName: 'CS Orphan',
      role: 'CS',
      siteId: null,
      vendorCenterId: null,
    }
    const scope = await jobScope(noSiteUser)
    expect(scope).toEqual({ branchId: '__none__' })
  })

  it('ADV-SEC-03: jobScope restricts VD users strictly to their assigned vendorCenterId', async () => {
    const vdUser: UserSession = {
      id: 'u-vd-01',
      username: 'vd_bosch',
      fullName: 'VD Bosch Tech',
      role: 'VD',
      siteId: null,
      vendorCenterId: 'VC-BOSCH-01',
    }
    const scope = await jobScope(vdUser)
    expect(scope).toEqual({ vendorCenterId: 'VC-BOSCH-01' })
  })

  it('ADV-SEC-04: jobScope fails closed when VD user has null or undefined vendorCenterId', async () => {
    const noVdUser: UserSession = {
      id: 'u-vd-orphan',
      username: 'vd_orphan',
      fullName: 'VD Orphan',
      role: 'VD',
      siteId: null,
      vendorCenterId: null,
    }
    const scope = await jobScope(noVdUser)
    expect(scope).toEqual({ vendorCenterId: '__none__' })
  })

  it('ADV-SEC-05: jobScope restricts DC users strictly to DC channel', async () => {
    const dcUser: UserSession = {
      id: 'u-dc-01',
      username: 'dc_central',
      fullName: 'DC Central Operator',
      role: 'DC',
      siteId: null,
      vendorCenterId: null,
    }
    const scope = await jobScope(dcUser)
    expect(scope).toEqual({ channel: 'DC' })
  })

  it('ADV-SEC-06: jobScope allows ADMIN and EXECUTIVE global visibility', async () => {
    const adminUser: UserSession = {
      id: 'u-admin',
      username: 'admin',
      fullName: 'System Administrator',
      role: 'ADMIN',
      siteId: null,
      vendorCenterId: null,
    }
    const execUser: UserSession = {
      id: 'u-exec',
      username: 'exec',
      fullName: 'Executive Viewer',
      role: 'EXECUTIVE',
      siteId: null,
      vendorCenterId: null,
    }
    expect(await jobScope(adminUser)).toEqual({})
    expect(await jobScope(execUser)).toEqual({})
  })

  it('ADV-SEC-07: Cross-branch mutation attempt by CS operator is blocked with 403', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'SITE-ALPHA' })
    const foreignJob = createMockJob({ branchId: 'SITE-BETA', stage: 'CS_OPENED' })

    const res = simulateAction(foreignJob, 'record_intake_payment', csUser, { amountSatang: 15000 })
    expect(res.success).toBe(false)
    expect(res.error).toContain('403')
  })

  it('ADV-SEC-08: Cross-vendorCenter mutation attempt by VD technician is blocked with 403', () => {
    const vdTechnician = createMockUser({ role: 'VD', vendorCenterId: 'VC-MAKITA' })
    const foreignJob = createMockJob({ stage: 'OUTBOUND_TO_VD', vendorCenterId: 'VC-DEWALT' })

    const res = simulateAction(foreignJob, 'vd_receive', vdTechnician)
    expect(res.success).toBe(false)
    expect(res.error).toContain('403')
  })
})
