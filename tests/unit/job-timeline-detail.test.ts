import { describe, it, expect, setTier } from '../framework/core'
import { buildJobStageTimeline, enrichJobEvents } from '../../src/lib/job-timeline'
import { STAGE_ORDER } from '../../src/lib/constants'

setTier('Tier 1')

describe('Unit: Staff Job Detail 19-Stage Timeline & Progress Log', () => {
  it('JTD-01: buildJobStageTimeline returns all 18 active workflow stages in order with done, current, and pending states', () => {
    const now = new Date('2026-10-23T10:00:00Z')
    const openedAt = new Date('2026-10-23T08:00:00Z')
    const grReceivedAt = new Date('2026-10-23T09:00:00Z')

    const timeline = buildJobStageTimeline({
      stage: 'GR_RECEIVED',
      channel: 'DC',
      openedAt,
      events: [
        {
          id: 'e1',
          type: 'JOB_OPENED',
          fromStage: null,
          toStage: 'CS_OPENED',
          actorUserId: 'u1',
          actorRole: 'CS',
          note: 'เปิดใบแจ้งซ่อม',
          payload: null,
          createdAt: openedAt,
        },
        {
          id: 'e2',
          type: 'GR_RECEIVED',
          fromStage: 'CS_OPENED',
          toStage: 'GR_RECEIVED',
          actorUserId: 'u2',
          actorRole: 'GR',
          note: 'GR รับสินค้า',
          payload: { location: 'A-01' },
          createdAt: grReceivedAt,
        },
      ],
      slaClocks: [
        {
          status: 'STOPPED',
          startedAt: openedAt,
          stoppedAt: grReceivedAt,
          pausedAt: null,
          pausedMinutes: 0,
          breached: false,
          slaStep: { code: 'CS_HANDOVER', name: 'CS เปิดใบแจ้งซ่อม → ส่งมอบ GR', ownerDept: 'CS', hours: 24 },
        },
        {
          status: 'RUNNING',
          startedAt: grReceivedAt,
          stoppedAt: null,
          pausedAt: null,
          pausedMinutes: 0,
          breached: false,
          slaStep: { code: 'GR_PACK', name: 'GR Pack สินค้าลงกล่อง', ownerDept: 'GR', hours: 4 },
        },
      ],
      actorNames: { u1: 'สมชาย (CS)', u2: 'สมหญิง (GR)' },
      now,
    })

    const expectedStages = STAGE_ORDER.filter((s) => s !== 'CANCELLED')
    expect(timeline.length).toBe(expectedStages.length)

    const csOpenedStep = timeline.find((t) => t.code === 'CS_OPENED')
    expect(csOpenedStep?.status).toBe('done')
    expect(csOpenedStep?.doneBy).toBe('สมหญิง (GR)')

    const grReceivedStep = timeline.find((t) => t.code === 'GR_RECEIVED')
    expect(grReceivedStep?.status).toBe('running')
    expect(grReceivedStep?.slaHours).toBe(4)

    const futureStep = timeline.find((t) => t.code === 'REPAIRING')
    expect(futureStep?.status).toBe('pending')
  })

  it('JTD-02: enrichJobEvents formats Thai event labels, actor names, and payload locations', () => {
    const createdAt = new Date('2026-10-23T09:00:00Z')
    const enriched = enrichJobEvents(
      [
        {
          id: 'e2',
          type: 'GR_RECEIVED',
          fromStage: 'CS_OPENED',
          toStage: 'GR_RECEIVED',
          actorUserId: 'u2',
          actorRole: 'GR',
          note: 'รับเข้าคลังสาขา',
          payload: { location: 'B-02' },
          createdAt,
          attachments: [],
        },
      ],
      { u2: 'สมหญิง (GR)' }
    )

    expect(enriched.length).toBe(1)
    expect(enriched[0].label).toContain('GR')
    expect(enriched[0].actor).toBe('สมหญิง (GR)')
    expect(enriched[0].location).toBe('B-02')
  })
})
