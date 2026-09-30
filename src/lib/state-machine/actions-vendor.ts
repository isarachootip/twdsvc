import { JobStage, Channel, QuoteStatus, QuoteDecision } from '@prisma/client'
import { generateTrackingNo } from '../number-generator'
import { ActionDef } from './types'
import { ActionError } from './errors'
import { lastShipment, OUT_LEGS, IN_LEGS, buildQuote, createInboundShipment } from './helpers'

export const VENDOR_ACTIONS: Record<string, ActionDef> = {
  vd_receive: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.OUTBOUND_TO_VD],
    event: 'VD_RECEIVED',
    to: () => JobStage.VD_INSPECTING,
    effects: async c => {
      if (!c.job.vendorCenterId && c.actor.role === 'ADMIN') {
        const centerId = (c.input.vendorCenterId as string) || (await c.tx.vendorCenter.findFirst({ where: { active: true } }))?.id
        if (centerId) {
          await c.tx.job.update({ where: { id: c.job.id }, data: { vendorCenterId: centerId } })
          c.job.vendorCenterId = centerId
        }
      }
      const ship = lastShipment(c.job, OUT_LEGS)
      if (ship && ship.status !== 'DELIVERED') await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now, pickedUpAt: ship.pickedUpAt ?? c.now } })
    },
  },

  vd_submit_quote: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.VD_INSPECTING],
    event: 'QUOTE_SENT',
    to: c => ((c.extra.quoteTotal as number) === 0 ? JobStage.REPAIRING : JobStage.WAITING_APPROVAL),
    validate: c => { if (c.job.type !== 'CUSTOMER') throw new ActionError('งานสต็อกไม่มีขั้นตอนเสนอราคา — ใช้ "เริ่มซ่อม"') },
    effects: async c => {
      const version = c.job.quotes.reduce((m, q) => Math.max(m, q.version), 0) + 1
      const q = await buildQuote(c, version)
      if (q.total === 0) {
        await c.tx.quote.update({ where: { id: q.id }, data: { status: QuoteStatus.APPROVED, decidedAt: c.now } })
        await c.tx.job.update({ where: { id: c.job.id }, data: { decision: QuoteDecision.AUTO_APPROVED } })
        await c.tx.publicToken.updateMany({ where: { jobId: c.job.id, type: 'QUOTE', usedAt: null }, data: { usedAt: c.now } })
        c.extraEvents.push('CUSTOMER_APPROVED')
      }
    },
  },

  vd_revise_quote: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.WAITING_APPROVAL, JobStage.VD_INSPECTING],
    event: 'QUOTE_REVISED',
    effects: async c => {
      await c.tx.quote.updateMany({ where: { jobId: c.job.id, status: 'SENT' }, data: { status: QuoteStatus.SUPERSEDED } })
      await c.tx.publicToken.updateMany({ where: { jobId: c.job.id, type: 'QUOTE', usedAt: null }, data: { usedAt: c.now } })
      const version = c.job.quotes.reduce((m, q) => Math.max(m, q.version), 0) + 1
      await buildQuote(c, version)
    },
  },

  vd_start_repair: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.VD_INSPECTING],
    event: 'REPAIR_STARTED',
    to: () => JobStage.REPAIRING,
    validate: c => { if (c.job.type !== 'STOCK') throw new ActionError('งานลูกค้าต้องส่งใบเสนอราคาก่อน') },
  },

  vd_pause_parts: { roles: ['VD', 'ADMIN'], from: [JobStage.REPAIRING], event: 'REPAIR_PAUSED' },
  vd_resume_parts: { roles: ['VD', 'ADMIN'], from: [JobStage.REPAIRING], event: 'REPAIR_RESUMED' },

  vd_finish_repair: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.REPAIRING],
    event: 'REPAIR_FINISHED',
    to: () => JobStage.RETURN_PACKING,
    effects: async c => { await createInboundShipment(c) },
  },

  vd_return_pack: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.RETURN_PACKING],
    event: 'RETURN_PACKED',
    to: c => (c.job.channel === Channel.DC ? JobStage.INBOUND_TO_DC : JobStage.INBOUND_TO_BRANCH),
    photo: c => c.job.channel !== Channel.TPL,
    effects: async c => {
      await createInboundShipment(c)
      const ship = await c.tx.shipment.findFirst({ where: { jobId: c.job.id, legType: { in: IN_LEGS }, status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' } })
      if (ship) {
        if (c.job.channel === Channel.TPL) {
          const trackingNo = await generateTrackingNo()
          await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DISPATCHED', dispatchedAt: c.now, trackingNo } })
          c.extra.trackingNo = trackingNo
        } else {
          await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', dispatchedAt: ship.dispatchedAt ?? c.now, pickedUpAt: c.now } })
        }
      }
      c.extra.printLabel = true
    },
  },
}
