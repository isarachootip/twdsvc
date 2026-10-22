import { describe, it, expect, setTier } from '../framework/core'
import { searchThaiAddress } from '../../src/lib/services/thai-address-search'

setTier('Tier 1')

describe('Unit: Thai Address Autocomplete Search Engine', () => {
  it('ADDR-01: Searches by subdistrict name (บางนา)', () => {
    const results = searchThaiAddress('บางนา')
    expect(results.length > 0).toBe(true)
    const bangna = results.find(r => r.subdistrict.includes('บางนา'))
    expect(Boolean(bangna)).toBe(true)
  })

  it('ADDR-02: Searches by 5-digit postal code (10260)', () => {
    const results = searchThaiAddress('10260')
    expect(results.length > 0).toBe(true)
    expect(results[0].postalCode).toBe('10260')
  })

  it('ADDR-03: Searches by alias (กทม -> กรุงเทพมหานคร)', () => {
    const results = searchThaiAddress('กทม')
    expect(results.length > 0).toBe(true)
    const hasBkk = results.some(r => r.province === 'กรุงเทพมหานคร')
    expect(hasBkk).toBe(true)
  })

  it('ADDR-04: Returns empty array for query shorter than 2 characters', () => {
    const results = searchThaiAddress('ก')
    expect(results.length).toBe(0)
  })
})
