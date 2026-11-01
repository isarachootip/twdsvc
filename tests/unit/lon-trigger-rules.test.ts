import { describe, it, expect, setTier } from '../framework/core'
import {
  resolveLonIntakeTrigger,
  resolveLonManagerSignTrigger,
  resolveLonStageTransitionTrigger,
} from '../../src/lib/services/lon-trigger-rules'

setTier('Tier 1')

describe('Unit: LON Trigger Rules (Lifecycle Mapping)', () => {
  it('LTR-01: CS intake (JOB_OPENED) triggers SEND_TO_REPAIR for active CUSTOMER job with valid mobile', () => {
    const res = resolveLonIntakeTrigger({
      type: 'CUSTOMER',
      isTest: false,
      customerPhone: '081-234-5678',
    })
    expect(res).toEqual({
      type: 'SEND_TO_REPAIR',
      statusLabel: 'รับเรื่องส่งซ่อมสินค้า',
    })
  })

  it('LTR-02: Skips STOCK jobs, test jobs (isTest), or invalid phone numbers', () => {
    expect(
      resolveLonIntakeTrigger({ type: 'STOCK', isTest: false, customerPhone: '0812345678' })
    ).toBeNull()
    expect(
      resolveLonIntakeTrigger({ type: 'CUSTOMER', isTest: true, customerPhone: '0812345678' })
    ).toBeNull()
    expect(
      resolveLonIntakeTrigger({ type: 'CUSTOMER', isTest: false, customerPhone: '02-123-4567' })
    ).toBeNull()
    expect(
      resolveLonStageTransitionTrigger({
        type: 'STOCK',
        isTest: false,
        customerPhone: '0812345678',
        prevStage: 'VD_INSPECTING',
        nextStage: 'REPAIRING',
        decision: 'APPROVED',
      })
    ).toBeNull()
  })

  it('LTR-03: Store Manager quote signature triggers SEND_PRICE when total > 0, or STATUS_REPAIR when total === 0', () => {
    const paidQuote = resolveLonManagerSignTrigger({
      type: 'CUSTOMER',
      isTest: false,
      customerPhone: '0891112222',
      quoteTotal: 1650,
    })
    expect(paidQuote).toEqual({
      type: 'SEND_PRICE',
      statusLabel: 'แจ้งค่าบริการซ่อมสินค้า',
    })

    const freeQuote = resolveLonManagerSignTrigger({
      type: 'CUSTOMER',
      isTest: false,
      customerPhone: '0891112222',
      quoteTotal: 0,
    })
    expect(freeQuote).toEqual({
      type: 'STATUS_REPAIR',
      statusLabel: 'กำลังซ่อม',
    })
  })

  it('LTR-04: Repair transitions trigger STATUS_REPAIR only on REPAIRING and non-rejected RETURN_PACKING', () => {
    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0869998888',
        prevStage: 'WAITING_APPROVAL',
        nextStage: 'REPAIRING',
        decision: 'APPROVED',
      })
    ).toEqual({ type: 'STATUS_REPAIR', statusLabel: 'กำลังซ่อม' })

    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0869998888',
        prevStage: 'REPAIRING',
        nextStage: 'RETURN_PACKING',
        decision: 'APPROVED',
      })
    ).toEqual({ type: 'STATUS_REPAIR', statusLabel: 'ซ่อมเสร็จเรียบร้อยแล้ว' })

    // Rejected job entering RETURN_PACKING does not fire repair-completed status
    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0869998888',
        prevStage: 'WAITING_APPROVAL',
        nextStage: 'RETURN_PACKING',
        decision: 'REJECTED',
      })
    ).toBeNull()

    // Same stage or intermediate logistics stages do not spam LON
    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0869998888',
        prevStage: 'REPAIRING',
        nextStage: 'REPAIRING',
        decision: 'APPROVED',
      })
    ).toBeNull()
    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0869998888',
        prevStage: 'GR_PACKED',
        nextStage: 'OUTBOUND_TO_DC',
        decision: 'PENDING',
      })
    ).toBeNull()
  })

  it('LTR-05: READY_FOR_PICKUP routes REJECTED jobs to REJECT_REPAIR and repaired jobs to RECEIVE_JOB', () => {
    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0812223333',
        prevStage: 'GR_RETURN_RECEIVED',
        nextStage: 'READY_FOR_PICKUP',
        decision: 'REJECTED',
      })
    ).toEqual({ type: 'REJECT_REPAIR', statusLabel: 'พร้อมรับสินค้าคืน (ปฏิเสธการซ่อม)' })

    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0812223333',
        prevStage: 'GR_RETURN_RECEIVED',
        nextStage: 'READY_FOR_PICKUP',
        decision: 'APPROVED',
      })
    ).toEqual({ type: 'RECEIVE_JOB', statusLabel: 'พร้อมรับสินค้าคืน' })
  })

  it('LTR-06: CLOSED_REPAIRED triggers SATISFACTION while CLOSED_NOT_REPAIRED does not', () => {
    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0812223333',
        prevStage: 'READY_FOR_PICKUP',
        nextStage: 'CLOSED_REPAIRED',
        decision: 'APPROVED',
      })
    ).toEqual({ type: 'SATISFACTION', statusLabel: 'ส่งมอบสำเร็จ' })

    expect(
      resolveLonStageTransitionTrigger({
        type: 'CUSTOMER',
        isTest: false,
        customerPhone: '0812223333',
        prevStage: 'READY_FOR_PICKUP',
        nextStage: 'CLOSED_NOT_REPAIRED',
        decision: 'REJECTED',
      })
    ).toBeNull()
  })
})
