/**
 * Test Fixtures and Simulation Helpers for SVCM E2E Testing
 */

import { SPEC_ORACLE } from './oracle'
import crypto from 'crypto'

export interface MockUser {
  id: string
  username: string
  fullName: string
  role: 'ADMIN' | 'EXECUTIVE' | 'CS' | 'GR' | 'DC' | 'VD' | 'S2'
  siteId?: string
  vendorCenterId?: string
  active: boolean
}

export interface MockJob {
  id: string
  jobNo: string
  type: 'CUSTOMER' | 'STOCK'
  stage: (typeof SPEC_ORACLE.STAGES)[number]
  channel: 'DC' | 'DSD' | 'TPL'
  branchId: string
  vendorCenterId: string
  customerName: string
  customerPhone: string
  productName: string
  brandName: string
  sizeCategory: 'SMALL' | 'LARGE'
  hasWarranty: boolean
  shippingMethod: 'STANDARD' | 'EXPRESS'
  symptom?: string | null
  serialNo?: string | null
  version: number
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED'
  closedAt: Date | null
  charges: Array<{ type: string; amountSatang: number }>
  payments: Array<{ amountSatang: number; status: 'PENDING' | 'PAID' | 'VOIDED'; method: string }>
  quotes: Array<{
    version: number
    subtotalSatang: number
    vatSatang: number
    totalSatang: number
    status: 'SENT' | 'SUPERSEDED' | 'APPROVED' | 'REJECTED'
  }>
  slaClocks: Array<{
    stepCode: string
    status: 'RUNNING' | 'PAUSED' | 'STOPPED'
    startedAt: Date
    dueAt: Date
    pausedMinutes: number
    stoppedAt: Date | null
  }>
  events: Array<{ type: string; fromStage: string; toStage: string; timestamp: Date; actorRole: string }>
  tokens: Array<{ type: string; token: string; expiresAt: Date; usedAt: Date | null }>
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const role = overrides.role ?? 'CS'
  return {
    id: `usr-${crypto.randomBytes(4).toString('hex')}`,
    username: overrides.username ?? `user_${role.toLowerCase()}`,
    fullName: overrides.fullName ?? `Test User ${role}`,
    role,
    siteId: overrides.siteId ?? (['CS', 'GR', 'S2'].includes(role) ? 'site-branch-001' : undefined),
    vendorCenterId: overrides.vendorCenterId ?? (role === 'VD' ? 'vc-001' : undefined),
    active: overrides.active ?? true,
    ...overrides,
  }
}

let jobCounter = 1000
export function createMockJob(overrides: Partial<MockJob> = {}): MockJob {
  jobCounter++
  const size = overrides.sizeCategory ?? 'SMALL'
  const hasWarranty = overrides.hasWarranty ?? false
  const shippingMethod = overrides.shippingMethod ?? 'STANDARD'
  const type = overrides.type ?? 'CUSTOMER'

  const fees = SPEC_ORACLE.calcIntakeFees({
    jobType: type,
    hasWarranty,
    shippingMethod,
    size,
  })

  const charges: Array<{ type: string; amountSatang: number }> = []
  if (fees.operationFeeSatang > 0) {
    charges.push({ type: 'OPERATION_FEE', amountSatang: fees.operationFeeSatang })
  }
  if (fees.shippingFeeSatang > 0) {
    charges.push({ type: 'SHIPPING_FEE', amountSatang: fees.shippingFeeSatang })
  }

  const now = new Date()
  return {
    id: overrides.id ?? `job-${crypto.randomBytes(4).toString('hex')}`,
    jobNo: overrides.jobNo ?? `JB-2609-${jobCounter}`,
    type,
    stage: overrides.stage ?? 'CS_OPENED',
    channel: overrides.channel ?? 'DC',
    branchId: overrides.branchId ?? 'site-branch-001',
    vendorCenterId: overrides.vendorCenterId ?? 'vc-001',
    customerName: overrides.customerName ?? 'สมชาย ใจดี',
    customerPhone: overrides.customerPhone ?? '0812345678',
    productName: overrides.productName ?? 'สว่านโรตารี่ 26 มม.',
    brandName: overrides.brandName ?? 'BOSCH',
    sizeCategory: size,
    hasWarranty,
    shippingMethod,
    version: overrides.version ?? 1,
    decision: overrides.decision ?? 'PENDING',
    closedAt: overrides.closedAt ?? null,
    charges: overrides.charges ?? charges,
    payments: overrides.payments ?? [],
    quotes: overrides.quotes ?? [],
    slaClocks: overrides.slaClocks ?? [
      {
        stepCode: 'CS_HANDOVER',
        status: 'RUNNING',
        startedAt: now,
        dueAt: new Date(now.getTime() + 24 * 3600000),
        pausedMinutes: 0,
        stoppedAt: null,
      },
    ],
    events: overrides.events ?? [
      { type: 'JOB_OPENED', fromStage: '', toStage: 'CS_OPENED', timestamp: now, actorRole: 'CS' },
    ],
    tokens: overrides.tokens ?? [
      {
        type: 'TRACKING',
        token: crypto.randomBytes(16).toString('hex'),
        expiresAt: new Date(now.getTime() + 90 * 24 * 3600000),
        usedAt: null,
      },
    ],
    ...overrides,
  }
}

/**
 * State Transition Engine (Conforms strictly to 04_workflow_state_machine.md)
 */
export function simulateAction(
  job: MockJob,
  action: string,
  actor: MockUser,
  payload: Record<string, any> = {}
): { success: boolean; job?: MockJob; error?: string } {
  // Check active user
  if (!actor.active) {
    return { success: false, error: 'User is inactive' }
  }

  // Check RBAC
  const allowedRoles = SPEC_ORACLE.RBAC_MENU_MATRIX[actor.role]
  if (!allowedRoles) {
    return { success: false, error: 'Unknown role' }
  }

  // Multi-tenant data scope check (08_rbac.md §4)
  if (['CS', 'GR', 'S2'].includes(actor.role)) {
    if (actor.siteId && job.branchId !== actor.siteId) {
      return { success: false, error: '403: Cross-branch access forbidden' }
    }
  }
  if (actor.role === 'VD') {
    if (actor.vendorCenterId && job.vendorCenterId !== actor.vendorCenterId) {
      return { success: false, error: '403: Cross-vendorCenter access forbidden' }
    }
  }

  // Optimistic locking check (version)
  if (payload.expectedVersion !== undefined && payload.expectedVersion !== job.version) {
    return { success: false, error: '409: Optimistic locking conflict (stale version)' }
  }

  const updatedJob: MockJob = JSON.parse(JSON.stringify(job))
  const now = new Date()

  switch (action) {
    case 'assign_vendor': {
      if (actor.role !== 'ADMIN') return { success: false, error: '403: Only ADMIN can assign vendor' }
      if (!payload.vendorCenterId) return { success: false, error: 'Missing vendorCenterId' }
      updatedJob.vendorCenterId = payload.vendorCenterId
      updatedJob.channel = payload.channel ?? 'DC'
      if (updatedJob.stage === 'PENDING_VENDOR_ASSIGNMENT') {
        updatedJob.stage = 'CS_OPENED'
      }
      break
    }

    case 'record_intake_payment': {
      const balance = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
        updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
      if (balance <= 0) return { success: false, error: 'No outstanding intake balance' }
      if (payload.amountSatang <= 0) return { success: false, error: 'Amount must be positive' }
      updatedJob.payments.push({
        amountSatang: payload.amountSatang,
        status: 'PAID',
        method: payload.paymentMethod ?? 'POS_RECEIPT',
      })
      break
    }

    case 'gr_receive': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'CS_OPENED') return { success: false, error: `Cannot gr_receive from ${updatedJob.stage}` }
      // Require Location
      if (!payload.location || !SPEC_ORACLE.LOCATION_REGEX.GR.test(payload.location)) {
        return { success: false, error: 'Invalid or missing GR location (expected A-00-00)' }
      }
      // Require Photo
      if (!payload.photos || payload.photos.length === 0) {
        return { success: false, error: 'Photo is required for GR receive' }
      }
      // Intake balance must be zero
      const unpaid = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
        updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
      if (unpaid > 0) {
        return { success: false, error: `Intake payment pending: ฿${unpaid / 100}` }
      }

      updatedJob.stage = 'GR_RECEIVED'
      break
    }

    case 'gr_pack': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'GR_RECEIVED') return { success: false, error: `Cannot gr_pack from ${updatedJob.stage}` }
      if (!payload.location || !SPEC_ORACLE.LOCATION_REGEX.GR.test(payload.location)) {
        return { success: false, error: 'Invalid or missing new GR pack location' }
      }
      if (!payload.photos || payload.photos.length === 0) {
        return { success: false, error: 'Photo is required for GR pack' }
      }
      updatedJob.stage = 'GR_PACKED'
      break
    }

    case 'dispatch_pickup': {
      if (!['DC', 'VD', 'ADMIN'].includes(actor.role)) return { success: false, error: '403: Forbidden' }
      if (!['GR_PACKED', 'AT_DC_OUTBOUND', 'AT_DC_INBOUND'].includes(updatedJob.stage)) {
        return { success: false, error: `Cannot dispatch from stage ${updatedJob.stage}` }
      }
      // Issue driver link token if requested
      if (payload.method === 'LINK') {
        updatedJob.tokens.push({
          type: 'DRIVER',
          token: crypto.randomBytes(16).toString('hex'),
          expiresAt: new Date(now.getTime() + 48 * 3600000),
          usedAt: null,
        })
      }
      break
    }

    case 'gr_handoff': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'GR_PACKED') return { success: false, error: `Cannot handoff from ${updatedJob.stage}` }
      if (!payload.photos || payload.photos.length === 0) {
        return { success: false, error: 'Photo required for handoff' }
      }
      updatedJob.stage = updatedJob.channel === 'DC' ? 'OUTBOUND_TO_DC' : 'OUTBOUND_TO_VD'
      break
    }

    case 'dc_receive_outbound': {
      if (actor.role !== 'DC' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'OUTBOUND_TO_DC') return { success: false, error: `Cannot dc_receive from ${updatedJob.stage}` }
      if (!payload.location || !SPEC_ORACLE.LOCATION_REGEX.DC.test(payload.location)) {
        return { success: false, error: 'Invalid or missing DC location (expected DC-00-A)' }
      }
      updatedJob.stage = 'AT_DC_OUTBOUND'
      break
    }

    case 'dc_handoff_vd': {
      if (actor.role !== 'DC' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'AT_DC_OUTBOUND') return { success: false, error: `Cannot dc_handoff from ${updatedJob.stage}` }
      if (!payload.photos || payload.photos.length === 0) return { success: false, error: 'Photo required' }
      updatedJob.stage = 'OUTBOUND_TO_VD'
      break
    }

    case 'vd_receive': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'OUTBOUND_TO_VD') return { success: false, error: `Cannot vd_receive from ${updatedJob.stage}` }
      updatedJob.stage = 'VD_INSPECTING'
      break
    }

    case 'vd_submit_quote': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'VD_INSPECTING') return { success: false, error: `Cannot submit quote from ${updatedJob.stage}` }
      if (updatedJob.type === 'STOCK') return { success: false, error: 'Stock jobs do not use quotations' }
      if (!payload.lines || payload.lines.length === 0) return { success: false, error: 'Quote lines required' }

      const totals = SPEC_ORACLE.calcQuoteTotals(payload.lines)
      const isZero = totals.totalSatang === 0

      updatedJob.quotes.push({
        version: updatedJob.quotes.length + 1,
        subtotalSatang: totals.subtotalSatang,
        vatSatang: totals.vatSatang,
        totalSatang: totals.totalSatang,
        status: isZero ? 'APPROVED' : 'SENT',
      })

      if (isZero) {
        // Auto-approval edge case (05_business_rules.md §2.3)
        updatedJob.decision = 'AUTO_APPROVED'
        updatedJob.stage = 'REPAIRING'
      } else {
        // Issue public token for customer quote portal
        updatedJob.tokens.push({
          type: 'QUOTE',
          token: crypto.randomBytes(16).toString('hex'),
          expiresAt: new Date(now.getTime() + 7 * 24 * 3600000),
          usedAt: null,
        })
        updatedJob.stage = 'WAITING_APPROVAL'
      }
      break
    }

    case 'customer_approve':
    case 'customer_reject':
    case 'cs_record_decision': {
      if (action === 'customer_approve' && actor.role !== 'CS' && actor.role !== 'ADMIN') {
        // Customer or CS on behalf
      }
      if (updatedJob.stage !== 'WAITING_APPROVAL') return { success: false, error: 'Job not waiting approval' }
      const decision = String(payload.decision || (action === 'customer_reject' ? 'reject' : 'approve')).toLowerCase()
      const isApproved = decision === 'approve' || decision === 'approved'

      if (isApproved) {
        updatedJob.decision = 'APPROVED'
        updatedJob.stage = 'REPAIRING'
        // Add repair charge & operation fee credit (05_business_rules.md §1.3)
        const latestQuote = updatedJob.quotes[updatedJob.quotes.length - 1]
        if (latestQuote) {
          updatedJob.charges.push({ type: 'REPAIR', amountSatang: latestQuote.totalSatang })
          const opFeePaid = updatedJob.charges
            .filter((c) => c.type === 'OPERATION_FEE')
            .reduce((s, c) => s + c.amountSatang, 0)
          const credit = Math.min(opFeePaid, latestQuote.totalSatang)
          if (credit > 0) {
            updatedJob.charges.push({ type: 'OPERATION_FEE_CREDIT', amountSatang: -credit })
          }
        }
      } else {
        updatedJob.decision = 'REJECTED'
        updatedJob.stage = 'RETURN_PACKING'
      }
      break
    }

    case 'vd_start_repair': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'VD_INSPECTING') return { success: false, error: 'Cannot start repair' }
      if (updatedJob.type !== 'STOCK') return { success: false, error: 'Only stock jobs start repair directly' }
      updatedJob.stage = 'REPAIRING'
      break
    }

    case 'vd_pause_parts': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'REPAIRING') return { success: false, error: 'Must be in REPAIRING stage' }
      const clock = updatedJob.slaClocks.find((c) => c.stepCode === 'VD_REPAIR' && c.status === 'RUNNING')
      if (clock) {
        clock.status = 'PAUSED'
      }
      break
    }

    case 'vd_resume_parts': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'REPAIRING') return { success: false, error: 'Must be in REPAIRING stage' }
      const clock = updatedJob.slaClocks.find((c) => c.stepCode === 'VD_REPAIR' && c.status === 'PAUSED')
      if (clock) {
        const addedMs = (payload.pauseDurationMs ?? 3600000)
        clock.pausedMinutes += Math.floor(addedMs / 60000)
        const currentDue = clock.dueAt instanceof Date ? clock.dueAt.getTime() : new Date(clock.dueAt).getTime()
        clock.dueAt = new Date(currentDue + addedMs)
        clock.status = 'RUNNING'
      }
      break
    }

    case 'vd_finish_repair': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'REPAIRING') return { success: false, error: `Cannot finish repair from ${updatedJob.stage}` }
      updatedJob.stage = 'RETURN_PACKING'
      break
    }

    case 'vd_return_pack': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'RETURN_PACKING') return { success: false, error: `Cannot return pack from ${updatedJob.stage}` }
      if (updatedJob.channel !== 'TPL' && (!payload.photos || payload.photos.length === 0)) {
        return { success: false, error: 'Photo required for return pack' }
      }
      updatedJob.stage = updatedJob.channel === 'DC' ? 'INBOUND_TO_DC' : 'INBOUND_TO_BRANCH'
      break
    }

    case 'dc_receive_inbound': {
      if (actor.role !== 'DC' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'INBOUND_TO_DC') return { success: false, error: 'Cannot receive inbound' }
      if (!payload.photos || payload.photos.length === 0) return { success: false, error: 'Photo required' }
      updatedJob.stage = 'AT_DC_INBOUND'
      break
    }

    case 'dc_dispatch_confirm': {
      if (actor.role !== 'DC' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'AT_DC_INBOUND') return { success: false, error: 'Cannot dispatch confirm' }
      updatedJob.stage = 'INBOUND_TO_BRANCH'
      break
    }

    case 'gr_receive_return': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'INBOUND_TO_BRANCH') return { success: false, error: 'Cannot receive return' }
      const locValid = SPEC_ORACLE.LOCATION_REGEX.GR.test(payload.location || '') || /^[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-[A-Z0-9]{1,4}$/i.test(payload.location || '')
      if (!payload.location || !locValid) {
        return { success: false, error: 'Invalid location for return' }
      }
      if (!payload.photos || payload.photos.length === 0) return { success: false, error: 'Photo required' }
      updatedJob.stage = 'GR_RETURN_RECEIVED'
      break
    }

    case 'gr_deliver_cs': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { success: false, error: '403: Forbidden' }
      if (updatedJob.stage !== 'GR_RETURN_RECEIVED') return { success: false, error: 'Cannot deliver to CS' }
      if (!payload.photos || payload.photos.length === 0) return { success: false, error: 'Photo required' }
      updatedJob.stage = 'READY_FOR_PICKUP'

      // Generate payment link token if outstanding balance exists
      const balance = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
        updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
      if (balance > 0) {
        updatedJob.tokens.push({
          type: 'PAYMENT',
          token: crypto.randomBytes(16).toString('hex'),
          expiresAt: new Date(now.getTime() + 7 * 24 * 3600000),
          usedAt: null,
        })
      }
      break
    }

    case 'record_repair_payment': {
      const balance = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
        updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
      if (payload.amountSatang <= 0) return { success: false, error: 'Amount must be positive' }
      if (payload.amountSatang > balance) return { success: false, error: `Amount ฿${payload.amountSatang / 100} exceeds balance ฿${balance / 100}` }
      updatedJob.payments.push({
        amountSatang: payload.amountSatang,
        status: 'PAID',
        method: payload.paymentMethod ?? 'POS_RECEIPT',
      })
      break
    }

    case 'cs_close': {
      if (updatedJob.stage !== 'READY_FOR_PICKUP') return { success: false, error: 'Job must be in READY_FOR_PICKUP stage' }
      if (updatedJob.type === 'STOCK') {
        if (!['S2', 'GR', 'ADMIN'].includes(actor.role)) {
          return { success: false, error: 'Stock jobs must be closed by S2 or GR' }
        }
        updatedJob.stage = 'CLOSED_REPAIRED'
      } else {
        if (!['CS', 'ADMIN'].includes(actor.role)) {
          return { success: false, error: 'Customer jobs must be closed by CS' }
        }
        if (updatedJob.decision === 'APPROVED' || updatedJob.decision === 'AUTO_APPROVED') {
          const balance = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
            updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
          if (balance > 0) {
            return { success: false, error: `Cannot close: Outstanding balance ฿${balance / 100}` }
          }
          updatedJob.stage = 'CLOSED_REPAIRED'
        } else if (updatedJob.decision === 'REJECTED') {
          updatedJob.stage = 'CLOSED_NOT_REPAIRED'
        } else {
          updatedJob.stage = 'CLOSED_REPAIRED'
        }
      }
      updatedJob.closedAt = now
      // Issue CSAT survey token
      updatedJob.tokens.push({
        type: 'CSAT',
        token: crypto.randomBytes(16).toString('hex'),
        expiresAt: new Date(now.getTime() + 14 * 24 * 3600000),
        usedAt: null,
      })
      break
    }

    case 'cancel': {
      if (['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'].includes(updatedJob.stage)) {
        return { success: false, error: 'Cannot cancel closed or already cancelled job' }
      }
      if (actor.role === 'CS' && !['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'].includes(updatedJob.stage)) {
        return { success: false, error: 'CS can only cancel before GR intake' }
      }
      updatedJob.stage = 'CANCELLED'
      break
    }

    default:
      return { success: false, error: `Unknown action: ${action}` }
  }

  updatedJob.version++
  updatedJob.events.push({
    type: action.toUpperCase(),
    fromStage: job.stage,
    toStage: updatedJob.stage,
    timestamp: now,
    actorRole: actor.role,
  })

  return { success: true, job: updatedJob }
}
