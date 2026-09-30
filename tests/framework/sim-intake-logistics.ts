import crypto from 'crypto'
import { SPEC_ORACLE } from './oracle'
import { MockJob, MockUser } from './types'

export function handleIntakeLogisticsAction(
  action: string,
  updatedJob: MockJob,
  actor: MockUser,
  payload: Record<string, any>,
  now: Date
): { handled: boolean; result?: { success: boolean; job?: MockJob; error?: string } } {
  switch (action) {
    case 'assign_vendor': {
      if (actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Only ADMIN can assign vendor' } }
      if (!payload.vendorCenterId) return { handled: true, result: { success: false, error: 'Missing vendorCenterId' } }
      updatedJob.vendorCenterId = payload.vendorCenterId
      updatedJob.channel = payload.channel ?? 'DC'
      if (updatedJob.stage === 'PENDING_VENDOR_ASSIGNMENT') {
        updatedJob.stage = 'CS_OPENED'
      }
      return { handled: true }
    }

    case 'record_intake_payment': {
      const balance = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
        updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
      if (balance <= 0) return { handled: true, result: { success: false, error: 'No outstanding intake balance' } }
      if (payload.amountSatang <= 0) return { handled: true, result: { success: false, error: 'Amount must be positive' } }
      updatedJob.payments.push({
        amountSatang: payload.amountSatang,
        status: 'PAID',
        method: payload.paymentMethod ?? 'POS_RECEIPT',
      })
      return { handled: true }
    }

    case 'gr_receive': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'CS_OPENED') return { handled: true, result: { success: false, error: `Cannot gr_receive from ${updatedJob.stage}` } }
      if (!payload.location || !SPEC_ORACLE.LOCATION_REGEX.GR.test(payload.location)) {
        return { handled: true, result: { success: false, error: 'Invalid or missing GR location (expected A-00-00)' } }
      }
      if (!payload.photos || payload.photos.length === 0) {
        return { handled: true, result: { success: false, error: 'Photo is required for GR receive' } }
      }
      const unpaid = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
        updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
      if (unpaid > 0) {
        return { handled: true, result: { success: false, error: `Intake payment pending: ฿${unpaid / 100}` } }
      }
      updatedJob.stage = 'GR_RECEIVED'
      return { handled: true }
    }

    case 'gr_pack': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'GR_RECEIVED') return { handled: true, result: { success: false, error: `Cannot gr_pack from ${updatedJob.stage}` } }
      if (!payload.location || !SPEC_ORACLE.LOCATION_REGEX.GR.test(payload.location)) {
        return { handled: true, result: { success: false, error: 'Invalid or missing new GR pack location' } }
      }
      if (!payload.photos || payload.photos.length === 0) {
        return { handled: true, result: { success: false, error: 'Photo is required for GR pack' } }
      }
      updatedJob.stage = 'GR_PACKED'
      return { handled: true }
    }

    case 'dispatch_pickup': {
      if (!['DC', 'VD', 'ADMIN'].includes(actor.role)) return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (!['GR_PACKED', 'AT_DC_OUTBOUND', 'AT_DC_INBOUND'].includes(updatedJob.stage)) {
        return { handled: true, result: { success: false, error: `Cannot dispatch from stage ${updatedJob.stage}` } }
      }
      if (payload.method === 'LINK') {
        updatedJob.tokens.push({
          type: 'DRIVER',
          token: crypto.randomBytes(16).toString('hex'),
          expiresAt: new Date(now.getTime() + 48 * 3600000),
          usedAt: null,
        })
      }
      return { handled: true }
    }

    case 'gr_handoff': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'GR_PACKED') return { handled: true, result: { success: false, error: `Cannot handoff from ${updatedJob.stage}` } }
      if (!payload.photos || payload.photos.length === 0) {
        return { handled: true, result: { success: false, error: 'Photo required for handoff' } }
      }
      updatedJob.stage = updatedJob.channel === 'DC' ? 'OUTBOUND_TO_DC' : 'OUTBOUND_TO_VD'
      return { handled: true }
    }

    case 'dc_receive_outbound': {
      if (actor.role !== 'DC' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'OUTBOUND_TO_DC') return { handled: true, result: { success: false, error: `Cannot dc_receive from ${updatedJob.stage}` } }
      if (!payload.location || !SPEC_ORACLE.LOCATION_REGEX.DC.test(payload.location)) {
        return { handled: true, result: { success: false, error: 'Invalid or missing DC location (expected DC-00-A)' } }
      }
      updatedJob.stage = 'AT_DC_OUTBOUND'
      return { handled: true }
    }

    case 'dc_handoff_vd': {
      if (actor.role !== 'DC' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'AT_DC_OUTBOUND') return { handled: true, result: { success: false, error: `Cannot dc_handoff from ${updatedJob.stage}` } }
      if (!payload.photos || payload.photos.length === 0) return { handled: true, result: { success: false, error: 'Photo required' } }
      updatedJob.stage = 'OUTBOUND_TO_VD'
      return { handled: true }
    }

    case 'vd_receive': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'OUTBOUND_TO_VD') return { handled: true, result: { success: false, error: `Cannot vd_receive from ${updatedJob.stage}` } }
      updatedJob.stage = 'VD_INSPECTING'
      return { handled: true }
    }

    default:
      return { handled: false }
  }
}
