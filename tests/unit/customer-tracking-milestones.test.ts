import fs from 'fs'
import path from 'path'
import { describe, it, expect, setTier } from '../framework/core'
import { CUSTOMER_MILESTONES, getCustomerMilestoneId } from '../../src/lib/tracking-milestones'

setTier('Tier 1')

describe('Unit: Customer Tracking 5-Milestone View (/t/[token])', () => {
  it('CTM-01: CUSTOMER_MILESTONES defines exactly 5 customer-facing steps', () => {
    expect(CUSTOMER_MILESTONES.length).toBe(5)
    expect(CUSTOMER_MILESTONES.map((m) => m.id)).toEqual([1, 2, 3, 4, 5])
    expect(CUSTOMER_MILESTONES[0].label).toBe('รับเรื่องแจ้งซ่อม (Intake)')
    expect(CUSTOMER_MILESTONES[4].label).toBe('พร้อมรับสินค้า (Ready for collection)')
  })

  it('CTM-02: getCustomerMilestoneId maps all 19 internal stages into 1..5 customer milestones', () => {
    expect(getCustomerMilestoneId('CS_OPENED')).toBe(1)
    expect(getCustomerMilestoneId('GR_RECEIVED')).toBe(1)
    expect(getCustomerMilestoneId('OUTBOUND_TO_DC')).toBe(2)
    expect(getCustomerMilestoneId('WAITING_APPROVAL')).toBe(3)
    expect(getCustomerMilestoneId('REPAIRING')).toBe(4)
    expect(getCustomerMilestoneId('READY_FOR_PICKUP')).toBe(5)
    expect(getCustomerMilestoneId('CLOSED_REPAIRED')).toBe(5)
    expect(getCustomerMilestoneId('CLOSED_NOT_REPAIRED')).toBe(5)
  })

  it('CTM-03: Public tracking UI excludes internal 19-stage toggle and event history log', () => {
    const pageSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/t/[token]/page.tsx'),
      'utf8'
    )
    const detailsSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/t/[token]/components/TrackingJobDetailsCard.tsx'),
      'utf8'
    )
    const combined = pageSrc + '\n' + detailsSrc

    expect(combined.includes('ดูขั้นตอนทั้งหมด')).toBe(false)
    expect(combined.includes('บันทึกความคืบหน้า')).toBe(false)
    expect(combined.includes('showAll19Stages')).toBe(false)
  })
})
