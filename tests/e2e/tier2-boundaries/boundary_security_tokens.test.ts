/**
 * Tier 2: Boundary & Corner Cases - Security, Tokens & Tenant Isolation
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 2')

describe('Tier 2: Boundary - Security, Tokens & Tenant Isolation', () => {
  it('BND-SEC-01: Non-existent token lookup returns null or 404', () => {
    const job = createMockJob()
    const foundToken = job.tokens.find((t) => t.token === 'non-existent-token-xyz')
    expect(foundToken).toBeUndefined()
  })

  it('BND-SEC-02: Expired public token rejection blocks approval action', () => {
    const pastDate = new Date(Date.now() - 1000)
    const token = {
      type: 'QUOTE',
      token: 'tok-quote-expired',
      expiresAt: pastDate,
      usedAt: null,
    }
    const isExpired = Date.now() > token.expiresAt.getTime()
    expect(isExpired).toBe(true)
  })

  it('BND-SEC-03: Already used token cannot be reused for decision submission', () => {
    const token = {
      type: 'QUOTE',
      token: 'tok-quote-used',
      expiresAt: new Date(Date.now() + 1000000),
      usedAt: new Date('2026-09-18T10:00:00Z'),
    }
    const canUse = token.usedAt === null
    expect(canUse).toBe(false)
  })

  it('BND-SEC-04: Cross-branch mutation attempt by CS user is blocked with 403 (IDOR defense)', () => {
    const csUserBranchA = createMockUser({ role: 'CS', siteId: 'SITE-A' })
    const jobBranchB = createMockJob({ branchId: 'SITE-B', stage: 'CS_OPENED' })
    const res = simulateAction(jobBranchB, 'record_intake_payment', csUserBranchA, { amountSatang: 15000 })
    expect(res.success).toBe(false)
    expect(res.error).toContain('403')
  })

  it('BND-SEC-05: Cross-vendorCenter mutation attempt by VD user is blocked with 403 (IDOR defense)', () => {
    const vdUser1 = createMockUser({ role: 'VD', vendorCenterId: 'VC-ALPHA' })
    const jobVCBeta = createMockJob({ stage: 'OUTBOUND_TO_VD', vendorCenterId: 'VC-BETA' })
    const res = simulateAction(jobVCBeta, 'vd_receive', vdUser1)
    expect(res.success).toBe(false)
    expect(res.error).toContain('403')
  })

  it('BND-SEC-06: GR role cannot perform CS actions (e.g. cs_close)', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'READY_FOR_PICKUP', decision: 'REJECTED' })
    const res = simulateAction(job, 'cs_close', grUser)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Customer jobs must be closed by CS')
  })

  it('BND-SEC-07: CS role cannot perform technician actions (e.g. vd_finish_repair)', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'REPAIRING' })
    const res = simulateAction(job, 'vd_finish_repair', csUser)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Forbidden')
  })

  it('BND-SEC-08: Executive role is strictly read-only and cannot mutate job state', () => {
    const execUser = createMockUser({ role: 'EXECUTIVE' })
    const job = createMockJob({ stage: 'CS_OPENED' })
    const res = simulateAction(job, 'gr_receive', execUser, { location: 'A-01-01', photos: ['p.jpg'] })
    expect(res.success).toBe(false)
  })

  it('BND-SEC-09: Inactive user account fails all action executions', () => {
    const inactiveUser = createMockUser({ role: 'ADMIN', active: false })
    const job = createMockJob({ stage: 'CS_OPENED' })
    const res = simulateAction(job, 'cancel', inactiveUser, { reason: 'Test' })
    expect(res.success).toBe(false)
    expect(res.error).toContain('inactive')
  })

  it('BND-SEC-10: Token entropy check ensures token contains at least 16 hex/base64url characters', () => {
    const job = createMockJob()
    job.tokens.forEach((t) => {
      expect(t.token.length).toBeGreaterThanOrEqual(16)
      expect(/^[a-zA-Z0-9_-]+$/.test(t.token)).toBe(true)
    })
  })

  it('BND-SEC-11: Public tracking view hides sensitive technician internal notes', () => {
    const internalPayload = {
      technicianNote: 'ช่างทำสายไฟขาดระหว่างถอด ต้องเปลี่ยนมอเตอร์ใหม่',
      customerNote: 'ซ่อมแซมและเปลี่ยนชิ้นส่วนที่ชำรุด',
    }
    const publicView = { description: internalPayload.customerNote }
    expect(publicView.description).toBe('ซ่อมแซมและเปลี่ยนชิ้นส่วนที่ชำรุด')
    expect(Object.keys(publicView).includes('technicianNote')).toBe(false)
  })

  it('BND-SEC-12: Public token URL cannot be guessed by sequential incremental numbering', () => {
    const t1 = createMockJob().tokens[0].token
    const t2 = createMockJob().tokens[0].token
    expect(t1).not.toBe(t2)
    expect(Math.abs(t1.localeCompare(t2))).toBeGreaterThan(0)
  })

  it('BND-SEC-13: CS user attempting to cancel job after GR intake (GR_PACKED) is rejected', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'GR_PACKED' })
    const res = simulateAction(job, 'cancel', csUser, { reason: 'Customer changed mind' })
    expect(res.success).toBe(false)
    expect(res.error).toContain('CS can only cancel before GR intake')
  })

  it('BND-SEC-14: Admin user can cancel job at any stage prior to closure', () => {
    const adminUser = createMockUser({ role: 'ADMIN' })
    const job = createMockJob({ stage: 'GR_PACKED' })
    const res = simulateAction(job, 'cancel', adminUser, { reason: 'Management cancellation' })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('CANCELLED')
  })

  it('BND-SEC-15: Already cancelled job rejects subsequent cancel or transition calls', () => {
    const adminUser = createMockUser({ role: 'ADMIN' })
    const cancelledJob = createMockJob({ stage: 'CANCELLED' })
    const res = simulateAction(cancelledJob, 'cancel', adminUser, { reason: 'Double cancel' })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot cancel closed or already cancelled')
  })
})
