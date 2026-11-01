import type { JobStage, JobType, QuoteDecision } from '@prisma/client'
import { normalizeThaiMobilePhone, type LonType } from '@/lib/validations/lon.schema'

export interface LonTriggerDecision {
  type: LonType
  statusLabel: string
}

interface EligibilityContext {
  type: JobType
  isTest: boolean
  customerPhone: string | null | undefined
}

function isEligibleCustomerJob(ctx: EligibilityContext): boolean {
  if (ctx.type !== 'CUSTOMER' || ctx.isTest) return false
  return normalizeThaiMobilePhone(ctx.customerPhone) !== null
}

/** 1. Trigger when CS opens a customer repair job (POST /api/jobs). */
export function resolveLonIntakeTrigger(ctx: EligibilityContext): LonTriggerDecision | null {
  if (!isEligibleCustomerJob(ctx)) return null
  return {
    type: 'SEND_TO_REPAIR',
    statusLabel: 'รับเรื่องส่งซ่อมสินค้า',
  }
}

/** 2. Trigger when Store Manager signs a customer quote (POST /api/jobs/[id]/quote/manager-sign). */
export function resolveLonManagerSignTrigger(
  ctx: EligibilityContext & { quoteTotal: number }
): LonTriggerDecision | null {
  if (!isEligibleCustomerJob(ctx)) return null
  if (ctx.quoteTotal > 0) {
    return {
      type: 'SEND_PRICE',
      statusLabel: 'แจ้งค่าบริการซ่อมสินค้า',
    }
  }
  return {
    type: 'STATUS_REPAIR',
    statusLabel: 'กำลังซ่อม',
  }
}

/** 3–6. Trigger when a job transitions between stages in executeAction (engine.ts). */
export function resolveLonStageTransitionTrigger(
  ctx: EligibilityContext & {
    prevStage: JobStage
    nextStage: JobStage
    decision: QuoteDecision
  }
): LonTriggerDecision | null {
  if (!isEligibleCustomerJob(ctx)) return null
  if (ctx.prevStage === ctx.nextStage) return null

  switch (ctx.nextStage) {
    case 'REPAIRING':
      return {
        type: 'STATUS_REPAIR',
        statusLabel: 'กำลังซ่อม',
      }

    case 'RETURN_PACKING':
      if (ctx.decision === 'REJECTED') return null
      return {
        type: 'STATUS_REPAIR',
        statusLabel: 'ซ่อมเสร็จเรียบร้อยแล้ว',
      }

    case 'READY_FOR_PICKUP':
      if (ctx.decision === 'REJECTED') {
        return {
          type: 'REJECT_REPAIR',
          statusLabel: 'พร้อมรับสินค้าคืน (ปฏิเสธการซ่อม)',
        }
      }
      return {
        type: 'RECEIVE_JOB',
        statusLabel: 'พร้อมรับสินค้าคืน',
      }

    case 'CLOSED_REPAIRED':
      return {
        type: 'SATISFACTION',
        statusLabel: 'ส่งมอบสำเร็จ',
      }

    default:
      return null
  }
}
