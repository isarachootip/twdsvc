import { describe, it, expect, setTier } from '../framework/core'
import { createMockUser, createMockJob, simulateAction } from '../framework/helpers'
import { latestLocation } from '../../src/lib/job-view'

setTier('Tier 1')

describe('Unit: CS Goods Receipt & Location Tracking', () => {
  it('CS-REC-01: CS user can successfully execute cs_receive with location on READY_FOR_PICKUP job', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      branchId: 'site-bna',
    })

    const res = simulateAction(job, 'cs_receive', csUser, {
      location: 'CS-A01',
      photos: ['shelf_photo.jpg'],
    })

    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('READY_FOR_PICKUP')
  })

  it('CS-REC-02: cs_receive requires non-empty location', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      branchId: 'site-bna',
    })

    const resEmpty = simulateAction(job, 'cs_receive', csUser, { location: '' })
    expect(resEmpty.success).toBe(false)
    expect(resEmpty.error).toContain('Location required')

    const resSpaces = simulateAction(job, 'cs_receive', csUser, { location: '   ' })
    expect(resSpaces.success).toBe(false)
    expect(resSpaces.error).toContain('Location required')
  })

  it('CS-REC-03: Illegal role (e.g. VD) cannot execute cs_receive', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-01' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      vendorCenterId: 'vc-01',
    })

    const res = simulateAction(job, 'cs_receive', vdUser, { location: 'CS-A01' })
    expect(res.success).toBe(false)
    expect(res.error).toContain('Forbidden')
  })

  it('CS-REC-04: CS can execute update_location with valid location', () => {
    const csUser = createMockUser({ role: 'CS', siteId: 'site-bna' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      branchId: 'site-bna',
    })

    const res = simulateAction(job, 'update_location', csUser, { location: 'CS-CABINET-02' })
    expect(res.success).toBe(true)

    const resEmpty = simulateAction(job, 'update_location', csUser, { location: '' })
    expect(resEmpty.success).toBe(false)
    expect(resEmpty.error).toContain('Location required')
  })

  it('CS-REC-05: latestLocation correctly resolves location from CS_RECEIVED and LOCATION_UPDATED events', () => {
    const now = new Date()
    const t0 = new Date(now.getTime() - 3600000)
    const t1 = new Date(now.getTime() - 1800000)
    const t2 = new Date(now.getTime() - 600000)

    // Initially delivered to CS -> location is cleared
    const jobDelivered = {
      events: [
        { type: 'DELIVERED_TO_CS', payload: {}, createdAt: t0 },
        { type: 'GR_RETURN_RECEIVED', payload: { location: 'GR-BAY-1' }, createdAt: new Date(t0.getTime() - 1000) },
      ],
    }
    expect(latestLocation(jobDelivered)).toBe(null)

    // After CS receives and records location
    const jobReceived = {
      events: [
        { type: 'CS_RECEIVED', payload: { location: 'CS-SHELF-1' }, createdAt: t1 },
        { type: 'DELIVERED_TO_CS', payload: {}, createdAt: t0 },
      ],
    }
    expect(latestLocation(jobReceived)).toBe('CS-SHELF-1')

    // After updating location
    const jobUpdated = {
      events: [
        { type: 'LOCATION_UPDATED', payload: { location: 'CS-SHELF-2' }, createdAt: t2 },
        { type: 'CS_RECEIVED', payload: { location: 'CS-SHELF-1' }, createdAt: t1 },
        { type: 'DELIVERED_TO_CS', payload: {}, createdAt: t0 },
      ],
    }
    expect(latestLocation(jobUpdated)).toBe('CS-SHELF-2')
  })
})
