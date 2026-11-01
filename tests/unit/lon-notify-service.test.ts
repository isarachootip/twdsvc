import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import {
  dispatchLonNotification,
  getLonEndpointToggles,
  listJobLonLogs,
} from '../../src/lib/services/lon-notify.service'

setTier('Tier 1')

describe('Unit: LON Notification Service & Persistence', () => {
  it('LNS-01: Default endpoint toggles disable SEND_PRICE and enable the 5 active Swagger endpoints', async () => {
    await prisma.systemSetting.deleteMany({ where: { key: 'LON_ENDPOINT_TOGGLES' } })
    const toggles = await getLonEndpointToggles()
    expect(toggles.SEND_TO_REPAIR).toBe(true)
    expect(toggles.SEND_PRICE).toBe(false)
    expect(toggles.STATUS_REPAIR).toBe(true)
    expect(toggles.REJECT_REPAIR).toBe(true)
    expect(toggles.RECEIVE_JOB).toBe(true)
    expect(toggles.SATISFACTION).toBe(true)
  })

  it('LNS-02: dispatchLonNotification persists SIMULATED and SKIPPED logs in LonNotificationLog', async () => {
    const branch = await prisma.site.findFirst({ where: { type: 'BRANCH' } })
    if (!branch) throw new Error('Expected at least one branch site in test DB')

    const job = await prisma.job.create({
      data: {
        jobNo: `TWLON${Date.now().toString().slice(-8)}`,
        type: 'CUSTOMER',
        stage: 'CS_OPENED',
        branchId: branch.id,
        customerName: 'คุณทดสอบ ระบบแจ้งเตือน',
        customerPhone: '081-999-7777',
        sku: '60000205',
        productName: 'เครื่องฉีดน้ำแรงดันสูง',
        brandName: 'KARCHER',
        serialNo: 'SN-LON-01',
        symptom: 'แรงดันตก',
        createdBy: 'unit-test',
        isTest: true,
      },
    })

    try {
      // 1. Enabled toggle without live LON credentials -> SIMULATED
      const simRes = await dispatchLonNotification({
        jobId: job.id,
        type: 'SEND_TO_REPAIR',
        triggeredBy: 'AUTO',
      })
      expect(simRes.status).toBe('SIMULATED')
      expect(simRes.endpoint).toBe('/repair/send_to_repair_jobs')

      // 2. Disabled toggle (SEND_PRICE default false) -> SKIPPED
      const skipRes = await dispatchLonNotification({
        jobId: job.id,
        type: 'SEND_PRICE',
        triggeredBy: 'AUTO',
      })
      expect(skipRes.status).toBe('SKIPPED')
      expect(skipRes.endpoint).toBe('/repair/send_price_jobs')

      // 3. Verify persisted audit logs
      const logs = await listJobLonLogs(job.id)
      expect(logs.length).toBe(2)
      expect(logs.some((l) => l.type === 'SEND_TO_REPAIR' && l.status === 'SIMULATED')).toBe(true)
      expect(logs.some((l) => l.type === 'SEND_PRICE' && l.status === 'SKIPPED')).toBe(true)
    } finally {
      await prisma.job.delete({ where: { id: job.id } })
    }
  })
})
