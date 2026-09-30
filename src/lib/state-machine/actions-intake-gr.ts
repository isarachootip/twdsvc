import { JobStage, Channel } from '@prisma/client'
import { ActionDef } from './types'
import { ActionError } from './errors'
import { intakeBalance, payMethod, requirePosReceipt, createOutboundShipment, lastShipment, OUT_LEGS } from './helpers'

export const INTAKE_GR_ACTIONS: Record<string, ActionDef> = {
  record_intake_payment: {
    roles: ['CS', 'CUSTOMER', 'ADMIN'],
    from: [JobStage.CS_OPENED, JobStage.PENDING_VENDOR_ASSIGNMENT, JobStage.GR_RECEIVED],
    event: 'PAYMENT_RECEIVED',
    effects: async c => {
      const bal = intakeBalance(c.job)
      if (bal <= 0) throw new ActionError('ไม่มียอดค่าดำเนินการค้างชำระ')
      const method = payMethod(c.input.paymentMethod)
      requirePosReceipt(c.input)
      await c.tx.payment.updateMany({ where: { jobId: c.job.id, status: 'PENDING', chargeType: { in: ['OPERATION_FEE', 'SHIPPING_FEE'] } }, data: { status: 'VOIDED', voidedAt: c.now } })
      for (const t of ['OPERATION_FEE', 'SHIPPING_FEE'] as const) {
        const charged = c.job.charges.filter(x => x.type === t).reduce((s, x) => s + x.amount, 0)
        const paid = c.job.payments.filter(p => p.status === 'PAID' && p.chargeType === t).reduce((s, p) => s + p.amount, 0)
        if (charged - paid > 0) {
          await c.tx.payment.create({ data: { jobId: c.job.id, chargeType: t, amount: charged - paid, method, status: 'PAID', posReceiptNo: c.input.posReceiptNo || null, receivedAt: c.now, receivedBy: c.actor.userId } })
        }
      }
      c.extra.paidAmount = bal
    },
  },

  assign_vendor: {
    roles: ['ADMIN'],
    from: [JobStage.PENDING_VENDOR_ASSIGNMENT, JobStage.CS_OPENED, JobStage.GR_RECEIVED],
    event: 'VENDOR_ASSIGNED',
    to: c => (c.job.stage === JobStage.PENDING_VENDOR_ASSIGNMENT ? JobStage.CS_OPENED : c.job.stage),
    effects: async c => {
      if (!c.input.vendorCenterId) throw new ActionError('ต้องระบุศูนย์ซ่อม')
      const center = await c.tx.vendorCenter.findUnique({ where: { id: c.input.vendorCenterId } })
      if (!center) throw new ActionError('ไม่พบศูนย์ซ่อม')
      let channel = (c.input.channel ?? (center.deliveryMethod === 'DSD' ? 'DSD' : 'DC')) as Channel
      if (c.job.shippingMethod === 'EXPRESS') channel = Channel.TPL
      if (channel === Channel.DC && center.deliveryMethod === 'DSD') throw new ActionError('ศูนย์นี้รับเฉพาะ DSD')
      if (channel === Channel.DSD && center.deliveryMethod === 'DC') throw new ActionError('ศูนย์นี้รับเฉพาะ DC')
      await c.tx.job.update({ where: { id: c.job.id }, data: { vendorCenterId: center.id, channel } })
      c.job.vendorCenterId = center.id
      c.job.channel = channel
    },
  },

  gr_receive: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.CS_OPENED],
    event: 'GR_RECEIVED',
    to: () => JobStage.GR_RECEIVED,
    photo: true,
    location: true,
    validate: c => {
      if (c.job.type === 'CUSTOMER' && intakeBalance(c.job) > 0) throw new ActionError('รอชำระค่าดำเนินการก่อนรับสินค้า')
      if (!c.job.vendorCenterId) throw new ActionError('งานนี้ยังไม่ได้กำหนดศูนย์ซ่อม (รอ Admin กำหนด)')
    },
  },

  gr_pack: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.GR_RECEIVED],
    event: 'GR_PACKED',
    to: () => JobStage.GR_PACKED,
    photo: true,
    location: true,
    effects: async c => {
      await createOutboundShipment(c)
      c.extra.printLabel = true
    },
  },

  gr_handoff: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.GR_PACKED],
    event: 'OUTBOUND_HANDED_OFF',
    to: c => (c.job.channel === Channel.DC ? JobStage.OUTBOUND_TO_DC : JobStage.OUTBOUND_TO_VD),
    photo: true,
    effects: async c => {
      const ship = lastShipment(c.job, OUT_LEGS)
      if (!ship || ship.status === 'PENDING_DISPATCH') throw new ActionError('ยังไม่ได้จัดรถเข้ารับ (รอ DC/VD แจ้งคนรถ)')
      await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', pickedUpAt: c.now } })
    },
  },
}
