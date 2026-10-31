import { describe, it, expect, setTier } from '../framework/core'
import {
  normalizeBranchQuery,
  filterBranchOptions,
  formatBranchLabel,
  type SearchableBranchOption,
} from '../../src/lib/branch-search'

setTier('Tier 1')

const SAMPLE_BRANCHES: SearchableBranchOption[] = [
  {
    id: 'b-pkt-fest',
    code: '60016',
    stCode: 'ST016',
    nickname: 'PKF',
    name: 'สาขาภูเก็ต เฟสติวัล',
    nameEn: 'Phuket Festival',
    province: 'ภูเก็ต',
    postalCode: '83000',
  },
  {
    id: 'b-srisaman',
    code: '60020',
    stCode: 'ST020',
    nickname: 'SSM',
    name: 'สาขาศรีสมาน',
    nameEn: 'Srisaman',
    province: 'นนทบุรี',
    postalCode: '11120',
  },
  {
    id: 'b-cm-sansai',
    code: '60027',
    stCode: 'ST027',
    nickname: 'CMS',
    name: 'สาขาเชียงใหม่ สันทราย',
    nameEn: 'Chiang Mai Sansai',
    province: 'เชียงใหม่',
    postalCode: '50210',
  },
  {
    id: 'b-bangbuathong',
    code: '60918',
    stCode: 'ST918',
    nickname: 'BBT',
    name: 'สาขาบางบัวทอง',
    nameEn: 'Bang Bua Thong',
    province: 'นนทบุรี',
    postalCode: '11110',
  },
  {
    id: 'b-bangna',
    code: '60920',
    stCode: 'ST920',
    nickname: 'BNA',
    name: 'สาขาบางนา',
    nameEn: 'Bangna',
    province: 'สมุทรปราการ',
    postalCode: '10540',
  },
  {
    id: 'b-tubang',
    code: '60999',
    stCode: 'ST999',
    nickname: 'KTB',
    name: 'สาขาคลองตาบาง',
    nameEn: 'Khlong Ta Bang',
    province: 'เพชรบุรี',
    postalCode: '76000',
  },
]

describe('Branch Key Search Domain Logic', () => {
  it('BS-01: returns all branches in original order when query is empty or whitespace', () => {
    expect(normalizeBranchQuery('   ')).toEqual([])
    const res = filterBranchOptions(SAMPLE_BRANCHES, '   ')
    expect(res.map(b => b.id)).toEqual(SAMPLE_BRANCHES.map(b => b.id))
  })

  it('BS-02: matches by 5-digit branch code (exact and partial)', () => {
    const exact = filterBranchOptions(SAMPLE_BRANCHES, '60920')
    expect(exact.length).toBe(1)
    expect(exact[0].id).toBe('b-bangna')

    const prefix = filterBranchOptions(SAMPLE_BRANCHES, '6091')
    expect(prefix.map(b => b.id)).toEqual(['b-bangbuathong'])
  })

  it('BS-03: matches case-insensitively by nickname, stCode, and English name', () => {
    expect(filterBranchOptions(SAMPLE_BRANCHES, 'bna').map(b => b.id)).toEqual(['b-bangna'])
    expect(filterBranchOptions(SAMPLE_BRANCHES, 'st027').map(b => b.id)).toEqual(['b-cm-sansai'])
    expect(filterBranchOptions(SAMPLE_BRANCHES, 'phuket').map(b => b.id)).toEqual(['b-pkt-fest'])
  })

  it('BS-04: matches Thai branch name and ranks core-name prefix above mid-word substring', () => {
    const res = filterBranchOptions(SAMPLE_BRANCHES, 'บาง')
    expect(res.map(b => b.id)).toEqual(['b-bangbuathong', 'b-bangna', 'b-tubang'])
  })

  it('BS-05: supports multi-token queries across name, code, and province (including parentheses)', () => {
    const multi1 = filterBranchOptions(SAMPLE_BRANCHES, 'เชียงใหม่ สันทราย')
    expect(multi1.map(b => b.id)).toEqual(['b-cm-sansai'])

    const multi2 = filterBranchOptions(SAMPLE_BRANCHES, 'สาขาบางนา (60920)')
    expect(multi2.map(b => b.id)).toEqual(['b-bangna'])

    const byProvince = filterBranchOptions(SAMPLE_BRANCHES, 'นนทบุรี')
    expect(byProvince.map(b => b.id)).toEqual(['b-srisaman', 'b-bangbuathong'])
  })

  it('BS-06: tolerates "สาขา" prefix even when option name omits it', () => {
    const dcList: SearchableBranchOption[] = [{ id: 'dc-1', code: 'DC01', name: 'คลังบางนา' }]
    expect(filterBranchOptions(dcList, 'สาขาบางนา').map(b => b.id)).toEqual(['dc-1'])
  })

  it('BS-07: formatBranchLabel appends code once without duplicating existing parentheses', () => {
    expect(formatBranchLabel({ id: '1', name: 'สาขาบางนา', code: '60920' })).toBe('สาขาบางนา (60920)')
    expect(formatBranchLabel({ id: '1', name: 'สาขาบางนา (60920)', code: '60920' })).toBe('สาขาบางนา (60920)')
    expect(formatBranchLabel({ id: '1', name: 'สาขาบางนา' })).toBe('สาขาบางนา')
  })
})
