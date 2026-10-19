import fs from 'fs'
import path from 'path'
import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import { maskPhoneMiddle } from '../../src/lib/phone-utils'
import { maskPhone } from '../../src/lib/job-view'
import {
  isSlaClockBelowTwentyPercent,
  buildSlaWarningLineMessage,
  checkAndNotifySlaWarnings,
} from '../../src/lib/services/sla-warning-notify.service'

setTier('Tier 1')

const ROOT = path.resolve(__dirname, '..', '..')

describe('Phase 5 — UX, Accessibility, Phone Masking & LINE SLA < 20% Notification', () => {
  it('P5-01: maskPhoneMiddle formats customer phones as 063-xxx-5619 and JobsTable uses maskPhoneMiddle', () => {
    expect(maskPhoneMiddle('0631235619')).toBe('063-xxx-5619')
    expect(maskPhoneMiddle('063-123-5619')).toBe('063-xxx-5619')
    expect(maskPhoneMiddle('0812345678')).toBe('081-xxx-5678')
    expect(maskPhoneMiddle(null)).toBe('-')

    // Non-privileged roles in job-view also receive 063-xxx-5619 format
    expect(maskPhone('0631235619', 'GR')).toBe('063-xxx-5619')
    expect(maskPhone('0631235619', 'CS')).toBe('0631235619')

    const jobsTableSrc = fs.readFileSync(
      path.join(ROOT, 'src', 'app', '(dashboard)', 'jobs', 'components', 'JobsTable.tsx'),
      'utf-8'
    )
    expect(jobsTableSrc.includes('maskPhoneMiddle(')).toBe(true)
  })

  it('P5-02: Sidebar links have aria-label and Queue components support loading skeleton instead of 0', () => {
    const sidebarSrc = fs.readFileSync(
      path.join(ROOT, 'src', 'components', 'layout', 'Sidebar.tsx'),
      'utf-8'
    )
    expect(sidebarSrc.includes('aria-label={item.label}')).toBe(true)
    expect(sidebarSrc.includes('aria-label="เชื่อมต่อบัญชี LINE"')).toBe(true)
    expect(sidebarSrc.includes('aria-label="ออกจากระบบ"')).toBe(true)

    const queueSrc = fs.readFileSync(
      path.join(ROOT, 'src', 'components', 'ui', 'Queue.tsx'),
      'utf-8'
    )
    expect(queueSrc.includes('loading?: boolean')).toBe(true)
    expect(queueSrc.includes('animate-pulse')).toBe(true)
  })

  it('P5-03: isSlaClockBelowTwentyPercent detects clocks with < 20% SLA remaining', () => {
    const start = new Date('2026-10-17T00:00:00Z')
    const due = new Date('2026-10-17T10:00:00Z') // 10 hours total (600 mins)

    // At 50% elapsed (5h remaining) -> not at risk
    const half = isSlaClockBelowTwentyPercent(
      { startedAt: start, dueAt: due, status: 'RUNNING', breached: false },
      new Date('2026-10-17T05:00:00Z')
    )
    expect(half.atRisk).toBe(false)

    // At 85% elapsed (1.5h = 15% remaining) -> at risk!
    const eightyFive = isSlaClockBelowTwentyPercent(
      { startedAt: start, dueAt: due, status: 'RUNNING', breached: false },
      new Date('2026-10-17T08:30:00Z')
    )
    expect(eightyFive.atRisk).toBe(true)
    expect(eightyFive.remainingMinutes).toBe(90)

    // Paused or already overdue -> not in pre-breach <20% warning window
    const paused = isSlaClockBelowTwentyPercent(
      { startedAt: start, dueAt: due, status: 'PAUSED', breached: false },
      new Date('2026-10-17T08:30:00Z')
    )
    expect(paused.atRisk).toBe(false)

    const msg = buildSlaWarningLineMessage({
      jobNo: 'BNA-17102026-0001',
      productName: 'สว่านไร้สาย',
      stageLabel: 'GR กำลัง Pack',
      stepName: 'GR Pack สินค้าลงกล่อง',
      ownerDept: 'GR',
      remainingMinutes: 35,
      baseUrl: 'https://vhomesvc.online',
    })
    expect(msg.includes('BNA-17102026-0001')).toBe(true)
    expect(msg.includes('35 นาที')).toBe(true)
  })

  it('P5-04: checkAndNotifySlaWarnings notifies linked owner once per clock, including isTest=true jobs', async () => {
    const branch = await prisma.site.findFirstOrThrow({ where: { type: 'BRANCH', active: true } })
    const slaStep = await prisma.slaStep.findFirstOrThrow({ where: { code: 'GR_PACK' } })
    const now = new Date()
    const startedAt = new Date(now.getTime() - 210 * 60 * 1000) // 3.5h ago
    const dueAt = new Date(now.getTime() + 30 * 60 * 1000) // 0.5h left out of 4h (12.5% < 20%)

    const lineUser = await prisma.user.create({
      data: {
        username: `gr_line_${Date.now()}`,
        password: 'hash',
        fullName: 'GR ผูก LINE',
        role: 'GR',
        siteId: branch.id,
        lineUserId: 'U_TEST_LINE_GR_001',
        active: true,
      },
    })

    const realJob = await prisma.job.create({
      data: {
        jobNo: `P5-SLA-${Date.now()}-1`,
        type: 'CUSTOMER',
        stage: 'GR_RECEIVED',
        branchId: branch.id,
        customerName: 'ลูกค้าจริง แจ้งเตือน',
        customerPhone: '0631235619',
        productName: 'ปั๊มน้ำอัตโนมัติ',
        brandName: 'Mitsubishi',
        createdBy: 'BNACS',
        isTest: false,
      },
    })

    const testJob = await prisma.job.create({
      data: {
        jobNo: `P5-SLA-${Date.now()}-2`,
        type: 'CUSTOMER',
        stage: 'GR_RECEIVED',
        branchId: branch.id,
        customerName: 'test test',
        customerPhone: '0631235619',
        productName: 'ปั๊มน้ำทดสอบ',
        brandName: 'Mitsubishi',
        createdBy: 'BNACS',
        isTest: true,
      },
    })

    await prisma.slaClock.createMany({
      data: [
        { jobId: realJob.id, slaStepId: slaStep.id, status: 'RUNNING', startedAt, dueAt, breached: false },
        { jobId: testJob.id, slaStepId: slaStep.id, status: 'RUNNING', startedAt, dueAt, breached: false },
      ],
    })

    const sentLog: Array<{ to: string; text: string }> = []
    const mockPush = async (toUserId: string, messages: Array<{ type: string; text?: string }>) => {
      sentLog.push({ to: toUserId, text: String(messages[0]?.text ?? '') })
      return { success: true, mode: 'simulated' as const }
    }

    try {
      const firstRun = await checkAndNotifySlaWarnings(now, mockPush)
      expect(firstRun.notifiedClocks).toBeGreaterThanOrEqual(1)
      expect(sentLog.some(s => s.to === 'U_TEST_LINE_GR_001' && s.text.includes(realJob.jobNo))).toBe(true)
      expect(sentLog.some(s => s.text.includes(testJob.jobNo))).toBe(true)

      const countAfterFirst = sentLog.filter(s => s.text.includes(realJob.jobNo)).length
      expect(countAfterFirst).toBe(1)

      // Second run must be idempotent (no duplicate LINE push for the same clock)
      await checkAndNotifySlaWarnings(now, mockPush)
      const countAfterSecond = sentLog.filter(s => s.text.includes(realJob.jobNo)).length
      expect(countAfterSecond).toBe(1)
    } finally {
      await prisma.job.deleteMany({ where: { id: { in: [realJob.id, testJob.id] } } })
      await prisma.user.delete({ where: { id: lineUser.id } })
    }
  })

  it('P5-05: LINE account page supports QR code (@LINE_OA_ID), auto-polling, test push, and proper .btn classes', () => {
    const cardSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'account', 'LineLinkCard.tsx'), 'utf-8')
    const qrSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'account', 'LineOaQrBox.tsx'), 'utf-8')
    const codeSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'account', 'LineCodeBox.tsx'), 'utf-8')
    const linkedSrc = fs.readFileSync(path.join(ROOT, 'src', 'components', 'account', 'LineLinkedStatus.tsx'), 'utf-8')
    const fieldsSrc = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'config', 'integration-fields.ts'), 'utf-8')

    expect(fieldsSrc.includes('LINE_OA_ID')).toBe(true)
    expect(cardSrc.includes('btn btn-primary')).toBe(true)
    expect(cardSrc.includes('setInterval')).toBe(true)
    expect(qrSrc.includes('QRCode.toDataURL')).toBe(true)
    expect(codeSrc.includes('navigator.clipboard.writeText')).toBe(true)
    expect(linkedSrc.includes('/api/auth/line-link/test')).toBe(true)
  })
})

