import fs from 'fs'
import path from 'path'
import { describe, it, expect, setTier } from '../framework/core'
import { CUSTOMER_MILESTONES, getCustomerMilestoneId } from '../../src/lib/tracking-milestones'

setTier('Tier 1')

describe('Unit: Customer Tracking 6-Milestone View (/t/[token] — LON Slide 8)', () => {
  it('CTM-01: CUSTOMER_MILESTONES defines the 6 LON customer-facing steps from Slide 8', () => {
    expect(CUSTOMER_MILESTONES.length).toBe(6)
    expect(CUSTOMER_MILESTONES.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6])
    expect(CUSTOMER_MILESTONES[0].label).toBe('1. เปิดงานแจ้งซ่อม')
    expect(CUSTOMER_MILESTONES[1].label).toBe('2. ส่งศูนย์ซ่อม')
    expect(CUSTOMER_MILESTONES[2].label).toBe('3. เสนอราคา')
    expect(CUSTOMER_MILESTONES[3].label).toBe('4. สินค้าซ่อมเสร็จ')
    expect(CUSTOMER_MILESTONES[4].label).toBe('5. สินค้าพร้อมรับ')
    expect(CUSTOMER_MILESTONES[5].label).toBe('6. ส่งมอบสำเร็จ')
  })

  it('CTM-02: getCustomerMilestoneId maps all internal stages into 1..6 customer milestones', () => {
    expect(getCustomerMilestoneId('CS_OPENED')).toBe(1)
    expect(getCustomerMilestoneId('GR_RECEIVED')).toBe(1)
    expect(getCustomerMilestoneId('OUTBOUND_TO_DC')).toBe(2)
    expect(getCustomerMilestoneId('WAITING_APPROVAL')).toBe(3)
    expect(getCustomerMilestoneId('REPAIRING')).toBe(4)
    expect(getCustomerMilestoneId('RETURN_PACKING')).toBe(4)
    expect(getCustomerMilestoneId('READY_FOR_PICKUP')).toBe(5)
    expect(getCustomerMilestoneId('CLOSED_REPAIRED')).toBe(6)
    expect(getCustomerMilestoneId('CLOSED_NOT_REPAIRED')).toBe(6)
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
    expect(combined.includes('1308')).toBe(true)
    expect(combined.includes('SKU')).toBe(true)
  })
})
