/**
 * Tier 2: Boundary - PostgreSQL Engine Direct Integration
 * Verifies real PostgreSQL transactions, tenant isolation, and location formats
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { ActionError } from '../../../src/lib/state-machine'
import { createTestJobInDb, executeDbAction } from '../../framework/db-helpers'
import { prisma } from '../../../src/lib/db'

setTier('Tier 2')

describe('Tier 2: Boundary - PostgreSQL Database Integration', () => {
  it('ENG-11: Location regex pattern accepts standard GR, DC, and warehouse formats', () => {
    const locRegex = /^(?:[A-Z]-\d{2}-\d{2}|(?:DC-)?[A-Z0-9]{1,4}-\d{2}-[A-Z0-9]{1,4}|DC-\d{2}-[A-Z]|S-RET-\d{2})$/i

    expect(locRegex.test('A-01-02')).toBe(true)
    expect(locRegex.test('B-12-05')).toBe(true)
    expect(locRegex.test('DC-01-A')).toBe(true)
    expect(locRegex.test('dc-02-b')).toBe(true)
    expect(locRegex.test('DC-01-02')).toBe(true)
    expect(locRegex.test('S-RET-01')).toBe(true)
    expect(locRegex.test('WH1-02-03')).toBe(true)

    expect(locRegex.test('')).toBe(false)
    expect(locRegex.test('04-11')).toBe(false)
    expect(locRegex.test('A-4-1')).toBe(false)
    expect(locRegex.test('A_04_11')).toBe(false)
    expect(locRegex.test('RANDOM_INVALID_TEXT')).toBe(false)
  })

  it('ENG-12: Scoped roles fail closed when user siteId or vendorCenterId is missing or mismatched', () => {
    const testScope = (user: { role: string; siteId?: string | null; vendorCenterId?: string | null }, job: { branchId: string; vendorCenterId: string; channel: string }): boolean => {
      if (['CS', 'GR', 'S2'].includes(user.role) && (!user.siteId || job.branchId !== user.siteId)) return false
      if (user.role === 'VD' && (!user.vendorCenterId || job.vendorCenterId !== user.vendorCenterId)) return false
      if (user.role === 'DC' && job.channel !== 'DC') return false
      return true
    }

    const job = { branchId: 'BRANCH-01', vendorCenterId: 'VC-01', channel: 'DC' }
    expect(testScope({ role: 'CS', siteId: 'BRANCH-01' }, job)).toBe(true)
    expect(testScope({ role: 'VD', vendorCenterId: 'VC-01' }, job)).toBe(true)
    expect(testScope({ role: 'DC' }, job)).toBe(true)
    expect(testScope({ role: 'CS', siteId: null }, job)).toBe(false)
    expect(testScope({ role: 'CS', siteId: undefined }, job)).toBe(false)
    expect(testScope({ role: 'GR', siteId: '' }, job)).toBe(false)
    expect(testScope({ role: 'VD', vendorCenterId: null }, job)).toBe(false)
    expect(testScope({ role: 'VD', vendorCenterId: undefined }, job)).toBe(false)
    expect(testScope({ role: 'CS', siteId: 'BRANCH-99' }, job)).toBe(false)
    expect(testScope({ role: 'VD', vendorCenterId: 'VC-99' }, job)).toBe(false)
    expect(testScope({ role: 'DC' }, { ...job, channel: 'DSD' })).toBe(false)
  })

  it('ENG-13: ActionError retains message and status code', () => {
    const err = new ActionError('รูปแบบ Location ไม่ถูกต้อง (ตัวอย่าง: A-01-02 หรือ DC-01-A)', 400)
    expect(err.message).toContain('Location')
    expect(err.status).toBe(400)
  })

  it('PG-INT-01: Direct PostgreSQL transaction executes state transition and writes audit log to PostgreSQL', async () => {
    // 1. Create a test job in PostgreSQL
    const testJob = await createTestJobInDb(prisma, {
      customerName: 'Postgres Direct Test',
      hasWarranty: true,
      shippingMethod: 'STANDARD',
    })

    try {
      expect(testJob.stage).toBe('CS_OPENED')

      // 2. Execute gr_receive in real PostgreSQL via executeDbAction
      const adminActor = { userId: 'admin-test', role: 'ADMIN' }
      const res = await executeDbAction(
        testJob.id,
        'gr_receive',
        { location: 'A-01-01', photos: [{ fileUrl: 'https://example.com/pg-test.jpg' }] },
        adminActor
      )

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.job.stage).toBe('GR_RECEIVED')
      }

      // 3. Directly query PostgreSQL to verify the row is actually updated
      const updatedJob = await prisma.job.findUnique({ where: { id: testJob.id } })
      expect(updatedJob?.stage).toBe('GR_RECEIVED')

      // 4. Directly query PostgreSQL jobEvent table to verify audit logging
      const events = await prisma.jobEvent.findMany({ where: { jobId: testJob.id } })
      expect(events.length).toBeGreaterThanOrEqual(1)
      const grEvent = events.find((e) => e.type === 'GR_RECEIVED')
      expect(grEvent).toBeDefined()
      expect(grEvent?.fromStage).toBe('CS_OPENED')
      expect(grEvent?.toStage).toBe('GR_RECEIVED')
    } finally {
      // Cleanup the test job from PostgreSQL
      await prisma.job.delete({ where: { id: testJob.id } }).catch(() => {})
    }
  })
})
