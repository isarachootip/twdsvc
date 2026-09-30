import crypto from 'crypto'
import { SPEC_ORACLE } from './oracle'
import { MockJob, MockUser } from './types'

export function handleVendorSimAction(
  action: string,
  updatedJob: MockJob,
  actor: MockUser,
  payload: Record<string, any>,
  now: Date
): { handled: boolean; result?: { success: boolean; job?: MockJob; error?: string } } {
  switch (action) {
    case 'vd_submit_quote': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'VD_INSPECTING') return { handled: true, result: { success: false, error: `Cannot submit quote from ${updatedJob.stage}` } }
      if (updatedJob.type === 'STOCK') return { handled: true, result: { success: false, error: 'Stock jobs do not use quotations' } }
      if (!payload.lines || payload.lines.length === 0) return { handled: true, result: { success: false, error: 'Quote lines required' } }

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
        updatedJob.decision = 'AUTO_APPROVED'
        updatedJob.stage = 'REPAIRING'
      } else {
        updatedJob.tokens.push({
          type: 'QUOTE',
          token: crypto.randomBytes(16).toString('hex'),
          expiresAt: new Date(now.getTime() + 7 * 24 * 3600000),
          usedAt: null,
        })
        updatedJob.stage = 'WAITING_APPROVAL'
      }
      return { handled: true }
    }

    case 'customer_approve':
    case 'customer_reject':
    case 'cs_record_decision': {
      if (updatedJob.stage !== 'WAITING_APPROVAL') {
        return { handled: true, result: { success: false, error: `Job not waiting approval: Cannot ${action} from ${updatedJob.stage}` } }
      }
      const decision = String(payload.decision || (action === 'customer_reject' ? 'reject' : 'approve')).toLowerCase()
      const isApproved = decision === 'approve' || decision === 'approved'

      if (isApproved) {
        updatedJob.decision = 'APPROVED'
        updatedJob.stage = 'REPAIRING'
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
      return { handled: true }
    }

    case 'vd_start_repair': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'VD_INSPECTING') return { handled: true, result: { success: false, error: `Cannot vd_start_repair from ${updatedJob.stage}` } }
      if (updatedJob.type !== 'STOCK') return { handled: true, result: { success: false, error: 'Only stock jobs start repair directly' } }
      updatedJob.stage = 'REPAIRING'
      return { handled: true }
    }

    case 'vd_pause_parts': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'REPAIRING') return { handled: true, result: { success: false, error: 'Must be in REPAIRING stage' } }
      const clock = updatedJob.slaClocks.find((c) => c.stepCode === 'VD_REPAIR' && c.status === 'RUNNING')
      if (clock) clock.status = 'PAUSED'
      return { handled: true }
    }

    case 'vd_resume_parts': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'REPAIRING') return { handled: true, result: { success: false, error: 'Must be in REPAIRING stage' } }
      const clock = updatedJob.slaClocks.find((c) => c.stepCode === 'VD_REPAIR' && c.status === 'PAUSED')
      if (clock) {
        const addedMs = (payload.pauseDurationMs ?? 3600000)
        clock.pausedMinutes += Math.floor(addedMs / 60000)
        const currentDue = clock.dueAt instanceof Date ? clock.dueAt.getTime() : new Date(clock.dueAt).getTime()
        clock.dueAt = new Date(currentDue + addedMs)
        clock.status = 'RUNNING'
      }
      return { handled: true }
    }

    case 'vd_finish_repair': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'REPAIRING') return { handled: true, result: { success: false, error: `Cannot finish repair from ${updatedJob.stage}` } }
      updatedJob.stage = 'RETURN_PACKING'
      return { handled: true }
    }

    case 'vd_return_pack': {
      if (actor.role !== 'VD' && actor.role !== 'ADMIN') return { handled: true, result: { success: false, error: '403: Forbidden' } }
      if (updatedJob.stage !== 'RETURN_PACKING') return { handled: true, result: { success: false, error: `Cannot return pack from ${updatedJob.stage}` } }
      if (updatedJob.channel !== 'TPL' && (!payload.photos || payload.photos.length === 0)) {
        return { handled: true, result: { success: false, error: 'Photo required for return pack' } }
      }
      updatedJob.stage = updatedJob.channel === 'DC' ? 'INBOUND_TO_DC' : 'INBOUND_TO_BRANCH'
      return { handled: true }
    }

    default:
      return { handled: false }
  }
}
