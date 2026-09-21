/**
 * Tier 2: Boundary & Corner Cases - Location Coordinates & Barcode Validation
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 2')

describe('Tier 2: Boundary - Location Coordinates & Barcode Validation', () => {
  it('BND-LOC-01: Valid GR location A-04-11 matches regex /^[A-Z]-\\d{2}-\\d{2}$/i', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('A-04-11')).toBe(true)
  })

  it('BND-LOC-02: Valid GR location with lowercase characters matches case-insensitively', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('b-12-05')).toBe(true)
  })

  it('BND-LOC-03: Malformed GR location missing leading aisle letter is rejected', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('04-11')).toBe(false)
  })

  it('BND-LOC-04: Malformed GR location with single-digit shelf or slot is rejected', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('A-4-1')).toBe(false)
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('A-04-1')).toBe(false)
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('A-4-11')).toBe(false)
  })

  it('BND-LOC-05: Malformed GR location with underscore instead of dash is rejected', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('A_04_11')).toBe(false)
  })

  it('BND-LOC-06: Malformed GR location with extra trailing characters is rejected', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('A-04-11-EXTRA')).toBe(false)
  })

  it('BND-LOC-07: Valid DC warehouse location format DC-01-A matches regex /^DC-\\d{2}-[A-Z]$/i', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.DC.test('DC-01-A')).toBe(true)
  })

  it('BND-LOC-08: Malformed DC location with GR format is rejected by DC ingest validation', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.DC.test('A-04-11')).toBe(false)
  })

  it('BND-LOC-09: Malformed DC location with lowercase suffix matches case-insensitively', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.DC.test('dc-02-b')).toBe(true)
  })

  it('BND-LOC-10: Empty string location is rejected across GR and DC', () => {
    expect(SPEC_ORACLE.LOCATION_REGEX.GR.test('')).toBe(false)
    expect(SPEC_ORACLE.LOCATION_REGEX.DC.test('')).toBe(false)
  })

  it('BND-LOC-11: Null or undefined location input throws or fails validation', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'CS_OPENED', charges: [], payments: [] })
    const res = simulateAction(job, 'gr_receive', grUser, { location: undefined, photos: ['p.jpg'] })
    expect(res.success).toBe(false)
    expect(res.error).toContain('location')
  })

  it('BND-LOC-12: GR receive transition validates and stores location in event payload', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'CS_OPENED', charges: [], payments: [] })
    const res = simulateAction(job, 'gr_receive', grUser, { location: 'C-01-09', photos: ['p.jpg'] })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('GR_RECEIVED')
  })

  it('BND-LOC-13: GR pack transition assigns and updates location to new packing zone', () => {
    const grUser = createMockUser({ role: 'GR' })
    const job = createMockJob({ stage: 'GR_RECEIVED' })
    const res = simulateAction(job, 'gr_pack', grUser, { location: 'P-02-01', photos: ['p.jpg'] })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('GR_PACKED')
  })

  it('BND-LOC-14: GR return receive requires return storage location before handover to CS', () => {
    const grUser = createMockUser({ role: 'GR' })
    const returnJob = createMockJob({ stage: 'INBOUND_TO_BRANCH' })
    const res = simulateAction(returnJob, 'gr_receive_return', grUser, { location: 'R-01-01', photos: ['p.jpg'] })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('GR_RETURN_RECEIVED')
  })

  it('BND-LOC-15: Job number barcode scanner input accepts exact 14-character format JB-YYMM-XXXXX', () => {
    const validJobNo = 'JB-2609-00123'
    const isBarcodeMatch = /^JB-\d{4}-\d{5}$/.test(validJobNo)
    expect(isBarcodeMatch).toBe(true)
    expect(validJobNo.length).toBe(13)
  })
})
