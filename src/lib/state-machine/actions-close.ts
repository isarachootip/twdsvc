import crypto from 'crypto'
import { JobStage, QuoteDecision } from '@prisma/client'
import { ActionDef } from './types'
import { ActionError } from './errors'
import { applyDecision, isApprove, totalBalance, payMethod, requirePosReceipt } from './helpers'

export const CLOSE_ACTIONS: Record<string, ActionDef> = {
  customer_approve: {
    roles: ['CUSTOMER', 'ADMIN'],
    from: [JobStage.WAITING_APPROVAL],
    event: 'CUSTOMER_APPROVED',
    to: () => JobStage.REPAIRING,
    effects: async c => applyDecision(c, true),
  },

  customer_reject: {
    roles: ['CUSTOMER', 'ADMIN'],
    from: [JobStage.WAITING_APPROVAL],
    event: 'CUSTOMER_REJECTED',
    to: () => JobStage.RETURN_PACKING,
    effects: async c => applyDecision(c, false),
  },

  cs_record_decision: {
    roles: ['CS', 'ADMIN'],
    from: [JobStage.WAITING_APPROVAL],
    event: c => (isApprove(c.input.decision) ? 'CUSTOMER_APPROVED' : 'CUSTOMER_REJECTED'),
    to: c => (isApprove(c.input.decision) ? JobStage.REPAIRING : JobStage.RETURN_PACKING),
    validate: c => {
      if (!c.input.decision) throw new ActionError('กรุณาเลือกผลการตัดสินใจของลูกค้า')
    },
    effects: async c => applyDecision(c, isApprove(c.input.decision)),
  },

  record_repair_payment: {
    roles: ['CS', 'CUSTOMER', 'ADMIN'],
    from: [
      JobStage.REPAIRING,
      JobStage.RETURN_PACKING,
      JobStage.INBOUND_TO_DC,
      JobStage.AT_DC_INBOUND,
      JobStage.INBOUND_TO_BRANCH,
      JobStage.GR_RETURN_RECEIVED,
      JobStage.READY_FOR_PICKUP,
    ],
    event: 'PAYMENT_RECEIVED',
    effects: async c => {
      const bal = totalBalance(c.job)
      if (bal <= 0) throw new ActionError('ไม่มียอดค้างชำระ')
      const amount = c.input.amount ? Math.round(Number(c.input.amount)) : bal
      if (amount <= 0 || amount > bal) throw new ActionError(`ยอดชำระต้องไม่เกินยอดค้าง ฿${bal.toLocaleString()}`)
      const method = payMethod(c.input.paymentMethod)
      requirePosReceipt(c.input)
      await c.tx.payment.updateMany({ where: { jobId: c.job.id, status: 'PENDING', chargeType: 'REPAIR' }, data: { status: 'VOIDED', voidedAt: c.now } })
      await c.tx.payment.create({
        data: {
          jobId: c.job.id,
          chargeType: 'REPAIR',
          amount,
          method,
          status: 'PAID',
          posReceiptNo: c.input.posReceiptNo || null,
          receivedAt: c.now,
          receivedBy: c.actor.userId,
        },
      })
      c.extra.paidAmount = amount
    },
  },

  cs_close: {
    roles: ['CS', 'S2', 'GR', 'ADMIN'],
    from: [JobStage.READY_FOR_PICKUP],
    event: 'JOB_CLOSED',
    to: c => (c.job.type === 'CUSTOMER' && c.job.decision === QuoteDecision.REJECTED ? JobStage.CLOSED_NOT_REPAIRED : JobStage.CLOSED_REPAIRED),
    validate: c => {
      if (c.job.type === 'STOCK' && c.actor.role === 'CS') throw new ActionError('งานสต็อกปิดโดย S2/GR')
      if (c.job.type === 'CUSTOMER' && ['S2', 'GR'].includes(c.actor.role)) throw new ActionError('งานลูกค้าปิดโดย CS')
      if (c.job.type === 'CUSTOMER' && c.job.decision !== QuoteDecision.REJECTED) {
        const bal = totalBalance(c.job)
        if (bal > 0) throw new ActionError(`ยังมียอดค้างชำระ ฿${bal.toLocaleString()}`)
      }
    },
    effects: async c => {
      await c.tx.job.update({ where: { id: c.job.id }, data: { closedAt: c.now } })
      if (c.job.type === 'CUSTOMER') {
        const token = crypto.randomBytes(24).toString('base64url')
        await c.tx.publicToken.create({ data: { jobId: c.job.id, type: 'CSAT', token, expiresAt: new Date(c.now.getTime() + 14 * 86400000) } })
        c.extra.csatUrl = `/s/${token}`
      }
      if (c.input.pickupOption) {
        c.extra.pickupOption = c.input.pickupOption
      }
    },
  },

  cancel: {
    roles: ['CS', 'ADMIN'],
    event: 'JOB_CANCELLED',
    to: () => JobStage.CANCELLED,
    validate: c => {
      const closed: JobStage[] = [JobStage.CLOSED_REPAIRED, JobStage.CLOSED_NOT_REPAIRED, JobStage.CANCELLED]
      if (closed.includes(c.job.stage)) {
        throw new ActionError('ไม่สามารถยกเลิกงานที่ปิดแล้ว')
      }
      const csAllowed: JobStage[] = [JobStage.CS_OPENED, JobStage.PENDING_VENDOR_ASSIGNMENT]
      if (c.actor.role !== 'ADMIN' && !csAllowed.includes(c.job.stage)) {
        throw new ActionError('CS ยกเลิกได้เฉพาะงานที่ยังไม่ส่งมอบ GR')
      }
      if (!(c.input.reason || c.input.note || '').trim()) throw new ActionError('กรุณาระบุเหตุผลการยกเลิก')
    },
    effects: async c => {
      await c.tx.shipment.updateMany({ where: { jobId: c.job.id, status: { in: ['PENDING_DISPATCH', 'DISPATCHED'] } }, data: { status: 'CANCELLED', cancelledAt: c.now } })
      await c.tx.payment.updateMany({ where: { jobId: c.job.id, status: 'PENDING' }, data: { status: 'VOIDED', voidedAt: c.now } })
      await c.tx.job.update({ where: { id: c.job.id }, data: { closedAt: c.now } })
    },
  },

  add_note: {
    roles: ['CS', 'GR', 'DC', 'VD', 'S2', 'ADMIN'],
    event: c => ((c.input.photos?.length ?? 0) > 0 ? 'PHOTO_ADDED' : 'NOTE_ADDED'),
  },
}
