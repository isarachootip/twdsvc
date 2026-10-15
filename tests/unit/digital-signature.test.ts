import { describe, it, expect, setTier } from '../framework/core'
import { createMockUser, createMockJob, simulateAction } from '../framework/helpers'
import { latestSignature } from '../../src/lib/job-view'

setTier('Tier 1')

describe('Unit: Dual-Channel Digital Signature (Intake & Pickup)', () => {
  const dummySig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  it('DS-01: CS or Customer can successfully sign intake with valid signatureUrl', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'CS_OPENED',
      branchId: 'site-bna',
    })

    const res = simulateAction(job, 'cs_sign_intake', csUser, {
      signatureUrl: dummySig,
    })

    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('CS_OPENED')

    const customerUser = createMockUser({ role: 'CUSTOMER' })
    const resCust = simulateAction(job, 'cs_sign_intake', customerUser, {
      signatureUrl: dummySig,
    })
    expect(resCust.success).toBe(true)
  })

  it('DS-02: cs_sign_intake requires non-empty signatureUrl', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'CS_OPENED',
      branchId: 'site-bna',
    })

    const resEmpty = simulateAction(job, 'cs_sign_intake', csUser, { signatureUrl: '' })
    expect(resEmpty.success).toBe(false)
    expect(resEmpty.error).toContain('Signature required')
  })

  it('DS-03: cs_sign_intake rejects cancelled job', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'CANCELLED',
      branchId: 'site-bna',
    })

    const res = simulateAction(job, 'cs_sign_intake', csUser, { signatureUrl: dummySig })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot sign cancelled job')
  })

  it('DS-04: Unauthorized roles (e.g. VD) cannot execute cs_sign_intake', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-01' })
    const job = createMockJob({
      stage: 'CS_OPENED',
    })

    const res = simulateAction(job, 'cs_sign_intake', vdUser, { signatureUrl: dummySig })
    expect(res.success).toBe(false)
    expect(res.error?.toLowerCase()).toContain('forbidden')
  })

  it('DS-05: CS or Customer can sign pickup on READY_FOR_PICKUP stage', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      branchId: 'site-bna',
    })

    const res = simulateAction(job, 'cs_sign_pickup', csUser, {
      signatureUrl: dummySig,
    })

    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('READY_FOR_PICKUP')

    const customerUser = createMockUser({ role: 'CUSTOMER' })
    const resCust = simulateAction(job, 'cs_sign_pickup', customerUser, {
      signatureUrl: dummySig,
    })
    expect(resCust.success).toBe(true)
  })

  it('DS-06: cs_sign_pickup rejects when job is not ready for pickup', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'REPAIRING',
      branchId: 'site-bna',
    })

    const res = simulateAction(job, 'cs_sign_pickup', csUser, { signatureUrl: dummySig })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Cannot cs_sign_pickup from REPAIRING')
  })

  it('DS-07: cs_sign_pickup requires non-empty signatureUrl', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      branchId: 'site-bna',
    })

    const res = simulateAction(job, 'cs_sign_pickup', csUser, { signatureUrl: '' })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Signature required')
  })

  it('DS-08: latestSignature extracts signatureUrl from job events', () => {
    const mockEventsJob = {
      events: [
        { type: 'INTAKE_SIGNED', createdAt: new Date(), payload: { signatureUrl: 'data:image/png;intake_sig' } },
        { type: 'PICKUP_SIGNED', createdAt: new Date(), payload: { signatureUrl: 'data:image/png;pickup_sig' } },
      ],
    }

    const intakeSig = latestSignature(mockEventsJob, ['INTAKE_SIGNED', 'JOB_OPENED'])
    expect(intakeSig).toBe('data:image/png;intake_sig')

    const pickupSig = latestSignature(mockEventsJob, ['PICKUP_SIGNED', 'JOB_CLOSED'])
    expect(pickupSig).toBe('data:image/png;pickup_sig')
  })

  it('DS-09: latestSignature returns null when event or signatureUrl is missing', () => {
    const mockEmptyEventsJob = {
      events: [
        { type: 'LOCATION_UPDATED', createdAt: new Date(), payload: { location: 'CS-01' } },
        { type: 'INTAKE_SIGNED', createdAt: new Date(), payload: {} },
      ],
    }

    const sig = latestSignature(mockEmptyEventsJob, ['PICKUP_SIGNED'])
    expect(sig).toBe(null)

    const intakeSig = latestSignature(mockEmptyEventsJob, ['INTAKE_SIGNED'])
    expect(intakeSig).toBe(null)
  })
})
