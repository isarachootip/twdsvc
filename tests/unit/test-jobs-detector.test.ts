import { describe, it, expect, setTier } from '../framework/core'
import {
  detectTestJobReasons,
  buildMarkTestJobsPlan,
  buildRollbackTestJobsPlan,
  type TestJobCandidateInput,
} from '../../scripts/lib/test-jobs-detector'

setTier('Tier 1')

const baseJob = (overrides: Partial<TestJobCandidateInput> = {}): TestJobCandidateInput => ({
  id: 'job_1',
  jobNo: 'BNA-11102026-0001',
  customerName: 'สมชาย ใจดี',
  customerPhone: '0812345678',
  productName: 'แอร์ผนัง 12000 BTU',
  symptom: 'ไม่เย็น',
  createdBy: 'BNACS',
  stage: 'CS_OPENED',
  branchName: 'สาขาบางนา',
  openedAt: new Date('2026-10-11T03:00:00Z'),
  isTest: false,
  ...overrides,
})

describe('Phase 3.1 — Test Job Detector & Reversible Plan (test-jobs-detector)', () => {
  it('TJ-01: detects known test customer names ("test test", "tee tee", "ลูกค้าทดสอบ คู่มือ", "เสาวภา เเเเ")', () => {
    for (const name of ['test test', 'tee tee', 'ลูกค้าทดสอบ คู่มือ', 'เสาวภา เเเเ', 'นายทดสอบ ระบบ']) {
      const reasons = detectTestJobReasons(baseJob({ customerName: name }))
      expect(reasons.length).toBeGreaterThan(0)
    }
  })

  it('TJ-02: does not flag legitimate Thai or English customer names', () => {
    for (const name of ['สมชาย เข็มกลัด', 'เสาวภา วงศ์สวัสดิ์', 'John Smith', 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด']) {
      const reasons = detectTestJobReasons(baseJob({ customerName: name }))
      expect(reasons.length).toBe(0)
    }
  })

  it('TJ-03: detects jobs created by test_* role accounts or explicit jobNos list', () => {
    const byCreator = detectTestJobReasons(baseJob({ createdBy: 'test_cs' }))
    expect(byCreator.some(r => r.includes('test_cs'))).toBe(true)

    const byExplicit = detectTestJobReasons(baseJob({ jobNo: 'JB-2609-00001' }), ['JB-2609-00001'])
    expect(byExplicit.some(r => r.includes('JB-2609-00001'))).toBe(true)
  })

  it('TJ-04: buildMarkTestJobsPlan filters only unmatched/unmarked candidates and records snapshot', () => {
    const jobs: TestJobCandidateInput[] = [
      baseJob({ id: 'j_real', jobNo: 'BNA-11102026-0001', customerName: 'สมศรี มีสุข' }),
      baseJob({ id: 'j_test1', jobNo: 'BNA-11102026-0002', customerName: 'test test' }),
      baseJob({ id: 'j_test2', jobNo: 'BNA-11102026-0003', customerName: 'เสาวภา เเเเ', isTest: true }),
    ]
    const plan = buildMarkTestJobsPlan(jobs)
    expect(plan.candidates.length).toBe(2)
    expect(plan.toUpdateIds).toEqual(['j_test1'])
    expect(plan.snapshot.entries.length).toBe(2)
  })

  it('TJ-05: buildRollbackTestJobsPlan restores original isTest state from snapshot', () => {
    const snapshot = {
      createdAt: '2026-10-16T00:00:00.000Z',
      entries: [
        { id: 'j_test1', jobNo: 'BNA-11102026-0002', customerName: 'test test', isTestBefore: false },
        { id: 'j_test2', jobNo: 'BNA-11102026-0003', customerName: 'เสาวภา เเเเ', isTestBefore: true },
      ],
    }
    const rb = buildRollbackTestJobsPlan(snapshot)
    expect(rb.setFalseIds).toEqual(['j_test1'])
    expect(rb.setTrueIds).toEqual(['j_test2'])
  })
})
