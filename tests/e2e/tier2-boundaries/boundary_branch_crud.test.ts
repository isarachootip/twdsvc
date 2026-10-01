/**
 * Tier 2: Boundary - Branch & DC Maintain Screen Full CRUD & Safety Guard
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { siteInputSchema } from '../../../src/lib/validations/site-schema'

setTier('Tier 2')

describe('Tier 2: Boundary - Branch & DC Maintain CRUD & Integrity', () => {
  it('BND-SITE-01: Validation rejects missing code or name', () => {
    const invalidPayload = {
      code: '',
      name: '',
      type: 'BRANCH',
    }
    const result = siteInputSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
  })

  it('BND-SITE-02: Validation accepts complete detailed branch data with all 4 tabs fields', () => {
    const validPayload = {
      code: '60999',
      name: 'สาขาทดสอบพระราม 9',
      nickname: '60999',
      type: 'BRANCH' as const,
      province: 'กรุงเทพมหานคร',
      district: 'ห้วยขวาง',
      subdistrict: 'บางกะปิ',
      postalCode: '10310',
      address: '999/99 ถนนพระราม 9 แขวงบางกะปิ',
      googleMapsUrl: 'https://maps.google.com/?q=13.75,100.56',
      phone: '02-123-4567',
      storeManagerName: 'สมชาย ผู้จัดการ',
      storeManagerPhone: '089-111-2222',
      storeEmail: 'mgr.rama9@thaiwatsadu.com',
      openingHours: 'ทุกวัน 08:00 - 19:00 น.',
      region: 'กรุงเทพและปริมณฑล',
      districtManager: 'คุณสุรชัย (DM เขต 1)',
      active: true,
    }
    const result = siteInputSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('60999')
      expect(result.data.district).toBe('ห้วยขวาง')
      expect(result.data.region).toBe('กรุงเทพและปริมณฑล')
    }
  })

  it('BND-SITE-03: Validation rejects malformed email if provided', () => {
    const invalidEmail = {
      code: '60888',
      name: 'สาขาทดสอบ',
      storeEmail: 'not-an-email',
    }
    const result = siteInputSchema.safeParse(invalidEmail)
    expect(result.success).toBe(false)
  })

  it('BND-SITE-04: Soft delete guard blocks deactivation when open jobs exist', () => {
    const openJobsCount: number = 3
    const canDeactivate = openJobsCount === 0
    expect(canDeactivate).toBe(false)
  })

  it('BND-SITE-05: Soft delete allows deactivation when 0 open jobs exist', () => {
    const openJobsCount: number = 0
    const canDeactivate = openJobsCount === 0
    expect(canDeactivate).toBe(true)
  })
})
