import { describe, it, expect, setTier } from '../framework/core'
import { generateJobNo } from '../../src/lib/number-generator'
import { prisma } from '../../src/lib/db'

setTier('Tier 1')

describe('Unit: Number Generator (job_no format and daily reset)', () => {
  it('JOBNO-01: generates job_no with [BRANCH]-[DDMMYYYY]-[RRRR] format', async () => {
    // Setup a mock site if not existing
    const site = await prisma.site.upsert({
      where: { code: 'TEST_BNA_01' },
      update: { nickname: 'BNA' },
      create: {
        code: 'TEST_BNA_01',
        name: 'สาขาบางนา ทดสอบ',
        nickname: 'BNA',
        type: 'BRANCH',
        province: 'สมุทรปราการ',
      },
    })

    const testDate = new Date('2026-10-06T10:00:00+07:00')
    const jobNo = await generateJobNo(site.id, testDate)

    expect(jobNo).toMatch(/^BNA-06102026-\d{4}$/)
  })

  it('JOBNO-02: increments sequence for the same branch and date', async () => {
    const site = await prisma.site.upsert({
      where: { code: 'TEST_BNA_SEQ' },
      update: { nickname: 'BNQ' },
      create: {
        code: 'TEST_BNA_SEQ',
        name: 'สาขาบางนา Sequence',
        nickname: 'BNQ',
        type: 'BRANCH',
        province: 'สมุทรปราการ',
      },
    })

    const testDate = new Date('2026-10-06T12:00:00+07:00')
    const jobNo1 = await generateJobNo(site.id, testDate)
    const jobNo2 = await generateJobNo(site.id, testDate)

    const seq1 = parseInt(jobNo1.split('-')[2], 10)
    const seq2 = parseInt(jobNo2.split('-')[2], 10)

    expect(seq2).toBe(seq1 + 1)
  })

  it('JOBNO-03: isolates sequence between different branches on the same day', async () => {
    const siteA = await prisma.site.upsert({
      where: { code: 'TEST_BRANCH_A' },
      update: { nickname: 'ISOA' },
      create: {
        code: 'TEST_BRANCH_A',
        name: 'สาขาไอโซ A',
        nickname: 'ISOA',
        type: 'BRANCH',
        province: 'กรุงเทพมหานคร',
      },
    })

    const siteB = await prisma.site.upsert({
      where: { code: 'TEST_BRANCH_B' },
      update: { nickname: 'ISOB' },
      create: {
        code: 'TEST_BRANCH_B',
        name: 'สาขาไอโซ B',
        nickname: 'ISOB',
        type: 'BRANCH',
        province: 'นนทบุรี',
      },
    })

    // Ensure fresh start for idempotency
    await prisma.runningNumber.deleteMany({
      where: { prefix: { in: ['JOB-ISOA-20112026', 'JOB-ISOB-20112026'] } },
    })

    const testDate = new Date('2026-11-20T09:00:00+07:00')
    const jobNoA = await generateJobNo(siteA.id, testDate)
    const jobNoB = await generateJobNo(siteB.id, testDate)

    expect(jobNoA).toBe('ISOA-20112026-0001')
    expect(jobNoB).toBe('ISOB-20112026-0001')
  })

  it('JOBNO-04: resets sequence back to 0001 when date rolls over', async () => {
    const site = await prisma.site.upsert({
      where: { code: 'TEST_RESET_BRANCH' },
      update: { nickname: 'RST' },
      create: {
        code: 'TEST_RESET_BRANCH',
        name: 'สาขารีเซ็ต',
        nickname: 'RST',
        type: 'BRANCH',
        province: 'กรุงเทพมหานคร',
      },
    })

    // Ensure fresh start for idempotency
    await prisma.runningNumber.deleteMany({
      where: { prefix: { in: ['JOB-RST-01122026', 'JOB-RST-02122026'] } },
    })

    const day1 = new Date('2026-12-01T15:00:00+07:00')
    const day2 = new Date('2026-12-02T08:00:00+07:00')

    const jobNoDay1 = await generateJobNo(site.id, day1)
    const jobNoDay2 = await generateJobNo(site.id, day2)

    expect(jobNoDay1).toBe('RST-01122026-0001')
    expect(jobNoDay2).toBe('RST-02122026-0001')
  })

  it('JOBNO-05: falls back gracefully to HQ when branchId is null or missing', async () => {
    const testDate = new Date('2026-10-06T10:00:00+07:00')
    const jobNo = await generateJobNo(null, testDate)

    expect(jobNo).toMatch(/^HQ-06102026-\d{4}$/)
  })
})
