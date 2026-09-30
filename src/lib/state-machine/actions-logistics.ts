import crypto from 'crypto'
import { JobStage, Channel, ShipmentLegType, CarrierType } from '@prisma/client'
import { ActionDef } from './types'
import { ActionError } from './errors'
import { lastShipment, OUT_LEGS, IN_LEGS, totalBalance } from './helpers'

export const LOGISTICS_ACTIONS: Record<string, ActionDef> = {
  dispatch_pickup: {
    roles: ['DC', 'VD', 'ADMIN'],
    from: [JobStage.GR_PACKED, JobStage.AT_DC_OUTBOUND, JobStage.AT_DC_INBOUND],
    event: 'SHIPMENT_DISPATCHED',
    effects: async c => {
      let leg: ShipmentLegType | null = null
      let carrier: CarrierType | null = null
      const st = c.job.stage
      if (st === JobStage.GR_PACKED && c.job.channel === Channel.DC) { leg = 'BRANCH_TO_DC'; carrier = 'DC_FLEET' }
      else if (st === JobStage.GR_PACKED && c.job.channel === Channel.DSD) { leg = 'BRANCH_TO_VD'; carrier = 'VD_FLEET' }
      else if (st === JobStage.AT_DC_OUTBOUND) { leg = 'DC_TO_VD'; carrier = 'VD_FLEET' }
      else if (st === JobStage.AT_DC_INBOUND) { leg = 'DC_TO_BRANCH'; carrier = 'DC_FLEET' }
      if (!leg || !carrier) throw new ActionError('งานนี้ไม่อยู่ในขั้นตอนที่ต้องจัดรถ')
      if (c.actor.role === 'DC' && carrier !== 'DC_FLEET') throw new ActionError('ขาขนส่งนี้ VD เป็นผู้จัดรถ')
      if (c.actor.role === 'VD' && carrier !== 'VD_FLEET') throw new ActionError('ขาขนส่งนี้ DC เป็นผู้จัดรถ')
      let ship = c.job.shipments.find(s => s.legType === leg && s.status !== 'CANCELLED')
      if (!ship) ship = await c.tx.shipment.create({ data: { jobId: c.job.id, legType: leg, carrier, status: 'PENDING_DISPATCH' } })
      if (ship.status !== 'PENDING_DISPATCH') throw new ActionError('แจ้งคนรถไปแล้ว')
      let driverToken: string | null = null
      if (c.input.method === 'LINK') {
        driverToken = crypto.randomBytes(24).toString('base64url')
        await c.tx.publicToken.create({ data: { jobId: c.job.id, type: 'DRIVER', token: driverToken, expiresAt: new Date(c.now.getTime() + 48 * 3600000) } })
        c.extra.driverUrl = `/d/${driverToken}`
      }
      await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DISPATCHED', dispatchedAt: c.now, driverToken } })
      c.extra.legType = leg
      c.extra.method = c.input.method ?? 'PRINT'
    },
  },

  carrier_confirm_pickup: {
    roles: ['VD', 'DRIVER', 'ADMIN'],
    from: [JobStage.GR_PACKED, JobStage.OUTBOUND_TO_VD],
    event: c => (c.job.stage === JobStage.GR_PACKED ? 'OUTBOUND_HANDED_OFF' : 'CARRIER_PICKUP_CONFIRMED'),
    to: c => (c.job.stage === JobStage.GR_PACKED ? JobStage.OUTBOUND_TO_VD : c.job.stage),
    photo: true,
    validate: c => {
      if (c.job.channel !== Channel.DSD) throw new ActionError('ใช้ได้เฉพาะงานช่องทาง DSD (VD เข้ารับที่สาขา)')
    },
    effects: async c => {
      const ship = lastShipment(c.job, OUT_LEGS)
      if (!ship || ship.status === 'PENDING_DISPATCH') throw new ActionError('ยังไม่ได้ส่งรถเข้ารับ')
      if (ship.status === 'DISPATCHED') await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', pickedUpAt: c.now } })
    },
  },

  dc_receive_outbound: {
    roles: ['DC', 'ADMIN'],
    from: [JobStage.OUTBOUND_TO_DC],
    event: 'DC_RECEIVED_OUTBOUND',
    to: () => JobStage.AT_DC_OUTBOUND,
    location: true,
    effects: async c => {
      const ship = c.job.shipments.find(s => s.legType === 'BRANCH_TO_DC' && s.status !== 'CANCELLED')
      if (ship) await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now } })
      if (!c.job.shipments.some(s => s.legType === 'DC_TO_VD' && s.status !== 'CANCELLED')) {
        await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'DC_TO_VD', carrier: 'VD_FLEET', status: 'PENDING_DISPATCH' } })
      }
    },
  },

  dc_handoff_vd: {
    roles: ['DC', 'ADMIN'],
    from: [JobStage.AT_DC_OUTBOUND],
    event: 'DC_HANDED_OFF_VD',
    to: () => JobStage.OUTBOUND_TO_VD,
    photo: true,
    effects: async c => {
      const ship = c.job.shipments.find(s => s.legType === 'DC_TO_VD' && s.status !== 'CANCELLED')
      if (!ship || ship.status === 'PENDING_DISPATCH') throw new ActionError('VD ยังไม่ได้ส่งรถเข้ารับที่ DC')
      await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', pickedUpAt: c.now } })
    },
  },

  tpl_delivered: {
    roles: ['VD', 'SYSTEM', 'ADMIN'],
    from: [JobStage.OUTBOUND_TO_VD, JobStage.GR_PACKED],
    event: 'VD_RECEIVED',
    to: () => JobStage.VD_INSPECTING,
    validate: c => { if (c.job.channel !== Channel.TPL) throw new ActionError('ใช้ได้เฉพาะงานช่องทาง 3PL') },
    effects: async c => {
      const ship = lastShipment(c.job, OUT_LEGS)
      if (ship && ship.status !== 'DELIVERED') await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now, pickedUpAt: ship.pickedUpAt ?? c.now } })
      if (c.job.stage === JobStage.GR_PACKED) c.extraEvents.push('OUTBOUND_HANDED_OFF')
    },
  },

  dc_receive_inbound: {
    roles: ['DC', 'ADMIN'],
    from: [JobStage.INBOUND_TO_DC],
    event: 'DC_RECEIVED_INBOUND',
    to: () => JobStage.AT_DC_INBOUND,
    photo: true,
    effects: async c => {
      const ship = c.job.shipments.find(s => s.legType === 'VD_TO_DC' && s.status !== 'CANCELLED')
      if (ship) await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now } })
      if (!c.job.shipments.some(s => s.legType === 'DC_TO_BRANCH' && s.status !== 'CANCELLED')) {
        await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'DC_TO_BRANCH', carrier: 'DC_FLEET', status: 'PENDING_DISPATCH' } })
      }
    },
  },

  dc_dispatch_confirm: {
    roles: ['DC', 'ADMIN'],
    from: [JobStage.AT_DC_INBOUND],
    event: 'DC_DISPATCHED_TO_BRANCH',
    to: () => JobStage.INBOUND_TO_BRANCH,
    effects: async c => {
      const ship = c.job.shipments.find(s => s.legType === 'DC_TO_BRANCH' && s.status !== 'CANCELLED')
      if (!ship || ship.status === 'PENDING_DISPATCH') throw new ActionError('ยังไม่ได้แจ้งคนรถ (Print / ส่ง Link ก่อน)')
      await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', pickedUpAt: c.now } })
    },
  },

  gr_receive_return: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.INBOUND_TO_BRANCH],
    event: 'GR_RETURN_RECEIVED',
    to: () => JobStage.GR_RETURN_RECEIVED,
    photo: true,
    location: true,
    effects: async c => {
      const ship = lastShipment(c.job, IN_LEGS)
      if (ship && ship.status !== 'DELIVERED') await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now, pickedUpAt: ship.pickedUpAt ?? c.now } })
    },
  },

  gr_deliver_cs: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.GR_RETURN_RECEIVED],
    event: 'DELIVERED_TO_CS',
    to: () => JobStage.READY_FOR_PICKUP,
    photo: true,
    effects: async c => {
      if (c.job.type === 'CUSTOMER' && totalBalance(c.job) > 0) {
        const token = crypto.randomBytes(24).toString('base64url')
        await c.tx.publicToken.create({ data: { jobId: c.job.id, type: 'PAYMENT', token, expiresAt: new Date(c.now.getTime() + 7 * 86400000) } })
        c.extra.payUrl = `/pay/${token}`
      }
    },
  },
}
