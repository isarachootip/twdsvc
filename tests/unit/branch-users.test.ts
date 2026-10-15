import { describe, it, expect, setTier } from '../framework/core'
import {
  buildBranchUserAccounts,
  normalizeBranchShortCode,
  DEFAULT_BRANCH_USER_PASSWORD,
} from '../../src/lib/branch-users'

setTier('Tier 1')

describe('Unit: Branch CS & GR User Account Builder', () => {
  it('BU-01: normalizeBranchShortCode normalizes uppercase, mixed-case, and whitespace nicknames', () => {
    expect(normalizeBranchShortCode('BNA', '60920')).toBe('BNA')
    expect(normalizeBranchShortCode('Nan', '60984')).toBe('NAN')
    expect(normalizeBranchShortCode('Expo', '60001')).toBe('EXPO')
    expect(normalizeBranchShortCode('  rs4 ', '60023')).toBe('RS4')
    expect(normalizeBranchShortCode('', '60920')).toBe('60920')
  })

  it('BU-02: buildBranchUserAccounts creates BNACS and BNAGR for Bangna (BNA) with password 1234 default', () => {
    expect(DEFAULT_BRANCH_USER_PASSWORD).toBe('1234')

    const bnaAccounts = buildBranchUserAccounts({
      id: 'site-bna-01',
      code: '60920',
      nickname: 'BNA',
      name: 'สาขาบางนา',
    })

    expect(bnaAccounts.length).toBe(2)
    expect(bnaAccounts[0].username).toBe('BNACS')
    expect(bnaAccounts[0].role).toBe('CS')
    expect(bnaAccounts[0].siteId).toBe('site-bna-01')
    expect(bnaAccounts[0].fullName).toBe('CS สาขาบางนา')

    expect(bnaAccounts[1].username).toBe('BNAGR')
    expect(bnaAccounts[1].role).toBe('GR')
    expect(bnaAccounts[1].siteId).toBe('site-bna-01')
    expect(bnaAccounts[1].fullName).toBe('GR สาขาบางนา')
  })

  it('BU-03: buildBranchUserAccounts handles mixed-case branch nicknames (Nan -> NANCS, NANGR)', () => {
    const nanAccounts = buildBranchUserAccounts({
      id: 'site-nan-01',
      code: '60984',
      nickname: 'Nan',
      name: 'สาขาน่าน',
    })
    expect(nanAccounts[0].username).toBe('NANCS')
    expect(nanAccounts[1].username).toBe('NANGR')
  })
})
