import { describe, it, expect, setTier } from '../framework/core'
import { parseFormattedAddress, splitCustomerFullName } from '../../src/lib/address-parser'
import { customerLookupQuerySchema } from '../../src/lib/validations/customer'
import { prisma } from '../../src/lib/db'
import { signAccessToken } from '../../src/lib/auth'
import { NextRequest } from 'next/server'
import { GET as lookupCustomerRoute } from '../../src/app/api/customers/lookup/route'

setTier('Tier 1')

describe('Unit: Customer Phone Lookup & Auto-fill Helpers', () => {
  it('CLA-01: parseFormattedAddress reverses formatAddress output into structured fields', () => {
    const raw = '123/45 หมู่ 6 ถ.บางนา-ตราด แขวง/ตำบล บางนาเหนือ เขต/อำเภอ บางนา กรุงเทพมหานคร 10260'
    const parsed = parseFormattedAddress(raw, '10260')
    expect(parsed.street).toBe('123/45 หมู่ 6 ถ.บางนา-ตราด')
    expect(parsed.subdistrict).toBe('บางนาเหนือ')
    expect(parsed.district).toBe('บางนา')
    expect(parsed.province).toBe('กรุงเทพมหานคร')
    expect(parsed.zip).toBe('10260')
  })

  it('CLA-02: parseFormattedAddress handles abbreviated Thai prefixes (ต./อ./จ.)', () => {
    const raw = '88/9 ซอยสุขุมวิท ต.สำโรงเหนือ อ.เมืองสมุทรปราการ จ.สมุทรปราการ 10270'
    const parsed = parseFormattedAddress(raw, null)
    expect(parsed.street).toBe('88/9 ซอยสุขุมวิท')
    expect(parsed.subdistrict).toBe('สำโรงเหนือ')
    expect(parsed.district).toBe('เมืองสมุทรปราการ')
    expect(parsed.province).toBe('สมุทรปราการ')
    expect(parsed.zip).toBe('10270')
  })

  it('CLA-03: parseFormattedAddress preserves plain street and explicit zip when unstructured', () => {
    const parsed = parseFormattedAddress('55/2 ถนนพระราม 4', '10110')
    expect(parsed.street).toBe('55/2 ถนนพระราม 4')
    expect(parsed.subdistrict).toBe('')
    expect(parsed.district).toBe('')
    expect(parsed.province).toBe('')
    expect(parsed.zip).toBe('10110')
  })

  it('CLA-04: parseFormattedAddress handles null/empty address safely', () => {
    const parsed = parseFormattedAddress(null, null)
    expect(parsed.street).toBe('')
    expect(parsed.subdistrict).toBe('')
    expect(parsed.district).toBe('')
    expect(parsed.province).toBe('')
    expect(parsed.zip).toBe('')
  })

  it('CLA-05: splitCustomerFullName splits first and last name cleanly', () => {
    expect(splitCustomerFullName('สมชาย ใจดี').firstName).toBe('สมชาย')
    expect(splitCustomerFullName('สมชาย ใจดี').lastName).toBe('ใจดี')

    const multi = splitCustomerFullName('  สมศรี   มีสุข เจริญพร ')
    expect(multi.firstName).toBe('สมศรี')
    expect(multi.lastName).toBe('มีสุข เจริญพร')

    const single = splitCustomerFullName('สมหมาย')
    expect(single.firstName).toBe('สมหมาย')
    expect(single.lastName).toBe('')
  })

  it('CLA-06: customerLookupQuerySchema validates and normalizes phone and q params', () => {
    const exact = customerLookupQuerySchema.parse({ phone: '081-234-5678' })
    expect(exact.phone).toBe('0812345678')

    const partial = customerLookupQuerySchema.parse({ q: '081-2', limit: '5' })
    expect(partial.q).toBe('0812')
    expect(partial.limit).toBe(5)
  })

  it('CLA-07: GET /api/customers/lookup supports both partial prefix (?q=...) and exact phone (?phone=...)', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { username: 'test_am' } })
    const token = await signAccessToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      siteId: user.siteId,
      vendorCenterId: user.vendorCenterId,
      mustChangePassword: false,
    })
    const headers = { authorization: `Bearer ${token}` }

    const sampleJob = await prisma.job.findFirst({
      where: { type: 'CUSTOMER', customerPhone: { not: null } },
      orderBy: { openedAt: 'desc' },
    })

    if (sampleJob?.customerPhone) {
      const prefix = sampleJob.customerPhone.replace(/\D/g, '').slice(0, 4)
      const qRes = await lookupCustomerRoute(
        new NextRequest(`http://localhost:3000/api/customers/lookup?q=${prefix}`, { headers })
      )
      expect(qRes.status).toBe(200)
      const qBody = await qRes.json()
      expect(Array.isArray(qBody.candidates)).toBe(true)
      expect(qBody.candidates.length > 0).toBe(true)

      const exactPhone = sampleJob.customerPhone.replace(/\D/g, '')
      const pRes = await lookupCustomerRoute(
        new NextRequest(`http://localhost:3000/api/customers/lookup?phone=${exactPhone}`, { headers })
      )
      expect(pRes.status).toBe(200)
      const pBody = await pRes.json()
      expect(pBody !== null).toBe(true)
      expect(pBody.customerPhone).toBe(exactPhone)
    }
  })
})
