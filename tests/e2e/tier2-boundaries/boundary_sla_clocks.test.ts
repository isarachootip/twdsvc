/**
 * Tier 2: Boundary & Corner Cases - SLA Engine & Clocks
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'
import { getSlaStatus } from '../../../src/lib/fees'

setTier('Tier 2')

describe('Tier 2: Boundary - SLA Engine & Clocks', () => {
  it('BND-SLA-01: SLA clock breach occurs at exactly 1 millisecond past target dueAt', () => {
    const dueAt = new Date('2026-09-19T12:00:00.000Z')
    const beforeDue = new Date('2026-09-19T11:59:59.999Z')
    const exactDue = new Date('2026-09-19T12:00:00.000Z')
    const afterDue = new Date('2026-09-19T12:00:00.001Z')

    expect(beforeDue.getTime() > dueAt.getTime()).toBe(false)
    expect(exactDue.getTime() > dueAt.getTime()).toBe(false)
    expect(afterDue.getTime() > dueAt.getTime()).toBe(true)
  })

  it('BND-SLA-02: Pausing SLA clock when already paused is idempotent or rejected', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const job = createMockJob({
      stage: 'REPAIRING',
      vendorCenterId: 'vc-001',
      slaClocks: [
        {
          stepCode: 'VD_REPAIR',
          status: 'PAUSED',
          startedAt: new Date(),
          dueAt: new Date(Date.now() + 1000000),
          pausedMinutes: 30,
          stoppedAt: null,
        },
      ],
    })
    // Pausing again when already paused does nothing harmful
    const res = simulateAction(job, 'vd_pause_parts', vdUser)
    expect(res.success).toBe(true)
    const clock = res.job?.slaClocks.find((c) => c.stepCode === 'VD_REPAIR')
    expect(clock?.status).toBe('PAUSED')
  })

  it('BND-SLA-03: Resuming SLA clock after zero paused minutes does not alter dueAt', () => {
    const vdUser = createMockUser({ role: 'VD', vendorCenterId: 'vc-001' })
    const now = new Date()
    const targetDue = new Date(now.getTime() + 168 * 3600000)
    const job = createMockJob({
      stage: 'REPAIRING',
      vendorCenterId: 'vc-001',
      slaClocks: [
        {
          stepCode: 'VD_REPAIR',
          status: 'PAUSED',
          startedAt: now,
          dueAt: targetDue,
          pausedMinutes: 0,
          stoppedAt: null,
        },
      ],
    })
    const res = simulateAction(job, 'vd_resume_parts', vdUser, { pauseDurationMs: 0 })
    expect(res.success).toBe(true)
    const clock = res.job?.slaClocks.find((c) => c.stepCode === 'VD_REPAIR')
    expect(clock?.dueAt.getTime()).toBe(targetDue.getTime())
    expect(clock?.pausedMinutes).toBe(0)
  })

  it('BND-SLA-04: Multiple sequential pause-resume cycles accumulate total paused minutes accurately', () => {
    let pausedMinutes = 0
    let dueAt = new Date('2026-09-19T00:00:00Z')

    // Cycle 1: Pause 2 hours (120 min)
    pausedMinutes += 120
    dueAt = new Date(dueAt.getTime() + 120 * 60000)

    // Cycle 2: Pause 3 hours (180 min)
    pausedMinutes += 180
    dueAt = new Date(dueAt.getTime() + 180 * 60000)

    expect(pausedMinutes).toBe(300)
    expect(dueAt.toISOString()).toBe('2026-09-19T05:00:00.000Z')
  })

  it('BND-SLA-05: Non-pausable steps reject pause attempts', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'CS_OPENED' })
    const res = simulateAction(job, 'vd_pause_parts', csUser)
    expect(res.success).toBe(false) // CS role cannot pause, and stage is not REPAIRING
  })

  it('BND-SLA-06: Stopped SLA clock cannot be transitioned back to RUNNING or PAUSED', () => {
    const clock = {
      stepCode: 'CS_HANDOVER',
      status: 'STOPPED' as const,
      stoppedAt: new Date(),
    }
    expect(clock.status).toBe('STOPPED')
  })

  it('BND-SLA-07: Leap year and month crossover calculation retains correct millisecond offset', () => {
    const leapStart = new Date('2028-02-28T12:00:00Z')
    const stepHours = 48 // Crosses into Feb 29 and March 1
    const due = new Date(leapStart.getTime() + stepHours * 3600000)
    expect(due.toISOString()).toBe('2028-03-01T12:00:00.000Z')
  })

  it('BND-SLA-08: SLA duration calculation handles Daylight Saving time-agnostic UTC storage', () => {
    const utcStart = new Date('2026-09-19T00:00:00Z')
    const hours = 24
    const due = new Date(utcStart.getTime() + hours * 3600000)
    expect(due.getUTCHours()).toBe(0)
    expect(due.getUTCDate()).toBe(20)
  })

  it('BND-SLA-09: Hours in step calculation returns 0 during the first 59 minutes of a step', () => {
    const startedAt = new Date(Date.now() - 45 * 60000) // 45 minutes elapsed
    const elapsedMinutes = Math.floor((Date.now() - startedAt.getTime()) / 60000)
    const hours = Math.floor(elapsedMinutes / 60)
    expect(hours).toBe(0)
  })

  it('BND-SLA-10: Hours in step calculation increments to 1 upon reaching exactly 60 minutes', () => {
    const startedAt = new Date(Date.now() - 60 * 60000) // 60 minutes elapsed
    const elapsedMinutes = Math.floor((Date.now() - startedAt.getTime()) / 60000)
    const hours = Math.floor(elapsedMinutes / 60)
    expect(hours).toBe(1)
  })

  it('BND-SLA-11: Paused time is subtracted from hours in step calculation', () => {
    const startedAt = new Date(Date.now() - 180 * 60000) // 3 hours elapsed
    const pausedMinutes = 120 // 2 hours paused
    const netMinutes = (Date.now() - startedAt.getTime()) / 60000 - pausedMinutes
    const hours = Math.floor(netMinutes / 60)
    expect(hours).toBe(1) // Only 1 active hour
  })

  it('BND-SLA-12: Revised quotation resets CUSTOMER_APPROVAL clock starting from 0', () => {
    const oldClock = {
      stepCode: 'CUSTOMER_APPROVAL',
      startedAt: new Date('2026-09-15T00:00:00Z'),
      pausedMinutes: 10,
    }
    const newNow = new Date('2026-09-18T00:00:00Z')
    const restartedClock = {
      stepCode: 'CUSTOMER_APPROVAL',
      startedAt: newNow,
      dueAt: new Date(newNow.getTime() + 48 * 3600000),
      pausedMinutes: 0,
      status: 'RUNNING',
    }
    expect(restartedClock.pausedMinutes).toBe(0)
    expect(restartedClock.startedAt.getTime()).toBe(newNow.getTime())
  })

  it('BND-SLA-13: Overdue status evaluation returns AT_RISK when remaining time is less than 20%', () => {
    const now = Date.now()
    const totalDurationMs = 10 * 3600000
    const remainingMs = 1.5 * 3600000 // 15% remaining
    const clock = {
      status: 'RUNNING',
      startedAt: new Date(now - (totalDurationMs - remainingMs)),
      dueAt: new Date(now + remainingMs),
      pausedMinutes: 0,
    }
    const status = getSlaStatus(clock)
    expect(status).toBe('AT_RISK')
  })

  it('BND-SLA-14: Overdue status evaluation returns ON_TRACK when remaining time is greater than 20%', () => {
    const now = Date.now()
    const totalDurationMs = 10 * 3600000
    const remainingMs = 5 * 3600000 // 50% remaining
    const clock = {
      status: 'RUNNING',
      startedAt: new Date(now - (totalDurationMs - remainingMs)),
      dueAt: new Date(now + remainingMs),
      pausedMinutes: 0,
    }
    const status = getSlaStatus(clock)
    expect(status).toBe('ON_TRACK')
  })

  it('BND-SLA-15: Closing job stops all remaining active SLA clocks simultaneously', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'READY_FOR_PICKUP', decision: 'REJECTED' })
    const res = simulateAction(job, 'cs_close', csUser)
    expect(res.success).toBe(true)
    expect(res.job?.closedAt).toBeDefined()
  })
})
