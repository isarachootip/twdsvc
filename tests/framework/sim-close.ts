import crypto from 'crypto'
import { SPEC_ORACLE } from './oracle'
import { MockJob, MockUser } from './types'

export function handleCloseSimAction(
  action: string,
  updatedJob: MockJob,
  actor: MockUser,
  payload: Record<string, any>,
  now: Date
): { handled: boolean; result?: { success: boolean; job?: MockJob; error?: string } } {
  switch (action) {
    case 'dc_receive_inbound': {
      if (actor.role !== 'DC' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'INBOUND_TO_DC') return { handled: true, result: { success: false, error: 'Cannot receive inbound' } }
      if (!payload.photos || payload.photos.length === 0) return { handled: true, result: { success: false, error: 'Photo required' } }
      updatedJob.stage = 'AT_DC_INBOUND'
      return { handled: true }
    }

    case 'dc_dispatch_confirm': {
      if (actor.role !== 'DC' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'AT_DC_INBOUND') return { handled: true, result: { success: false, error: 'Cannot dispatch confirm' } }
      updatedJob.stage = 'INBOUND_TO_BRANCH'
      return { handled: true }
    }

    case 'gr_receive_return': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'INBOUND_TO_BRANCH') return { handled: true, result: { success: false, error: 'Cannot receive return' } }
      const locValid = SPEC_ORACLE.LOCATION_REGEX.GR.test(payload.location || '') || /^[A-Z0-9]{1,4}-[A-Z0-9]{1,4}-[A-Z0-9]{1,4}$/i.test(payload.location || '')
      if (!payload.location || !locValid) {
        return { handled: true, result: { success: false, error: 'Invalid location for return' } }
      }
      if (!payload.photos || payload.photos.length === 0) return { handled: true, result: { success: false, error: 'Photo required' } }
      updatedJob.stage = 'GR_RETURN_RECEIVED'
      return { handled: true }
    }

    case 'gr_deliver_cs': {
      if (actor.role !== 'GR' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'GR_RETURN_RECEIVED') return { handled: true, result: { success: false, error: `Cannot gr_deliver_cs from ${updatedJob.stage}` } }
      if (!payload.photos || payload.photos.length === 0) return { handled: true, result: { success: false, error: 'Photo required' } }
      updatedJob.stage = 'READY_FOR_PICKUP'

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
      return { handled: true }
    }

    case 'record_repair_payment': {
      const balance = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
        updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
      if (balance <= 0) return { handled: true, result: { success: false, error: 'No outstanding balance' } }
      if (payload.amountSatang <= 0) return { handled: true, result: { success: false, error: 'Amount must be positive' } }
      if (payload.amountSatang > balance) return { handled: true, result: { success: false, error: `Amount ฿${payload.amountSatang / 100} exceeds balance ฿${balance / 100}` } }
      updatedJob.payments.push({
        amountSatang: payload.amountSatang,
        status: 'PAID',
        method: payload.paymentMethod ?? 'POS_RECEIPT',
      })
      return { handled: true }
    }

    case 'cs_close': {
      if (updatedJob.stage !== 'READY_FOR_PICKUP') {
        return { handled: true, result: { success: false, error: `Job must be in READY_FOR_PICKUP stage: Cannot cs_close from ${updatedJob.stage}` } }
      }
      if (updatedJob.type === 'STOCK') {
        if (!['S2', 'GR', 'ADMIN'].includes(actor.role)) {
          return { handled: true, result: { success: false, error: 'Stock jobs must be closed by S2 or GR' } }
        }
        updatedJob.stage = 'CLOSED_REPAIRED'
      } else {
        if (!['CS', 'ADMIN'].includes(actor.role)) {
          return { handled: true, result: { success: false, error: 'Customer jobs must be closed by CS' } }
        }
        if (updatedJob.decision === 'APPROVED' || updatedJob.decision === 'AUTO_APPROVED') {
          const balance = updatedJob.charges.reduce((s, c) => s + c.amountSatang, 0) -
            updatedJob.payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amountSatang, 0)
          if (balance > 0) {
            return { handled: true, result: { success: false, error: `Cannot close: Outstanding balance ฿${balance / 100}` } }
          }
          updatedJob.stage = 'CLOSED_REPAIRED'
        } else if (updatedJob.decision === 'REJECTED') {
          updatedJob.stage = 'CLOSED_NOT_REPAIRED'
        } else {
          updatedJob.stage = 'CLOSED_REPAIRED'
        }
      }
      updatedJob.closedAt = now
      updatedJob.tokens.push({
        type: 'CSAT',
        token: crypto.randomBytes(16).toString('hex'),
        expiresAt: new Date(now.getTime() + 14 * 24 * 3600000),
        usedAt: null,
      })
      return { handled: true }
    }

    case 'cancel': {
      if (['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'].includes(updatedJob.stage)) {
        return { handled: true, result: { success: false, error: 'Cannot cancel closed or already cancelled job' } }
      }
      if (actor.role === 'CS' && !['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'].includes(updatedJob.stage)) {
        return { handled: true, result: { success: false, error: 'CS can only cancel before GR intake' } }
      }
      updatedJob.stage = 'CANCELLED'
      return { handled: true }
    }

    default:
      return { handled: false }
  }
}
