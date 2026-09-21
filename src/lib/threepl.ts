import { prisma } from './db'
import { CarrierType, ShipmentLegType, ShipmentStatus, JobStage } from '@prisma/client'

export interface Book3PLResult {
  trackingNo: string
  carrierName: string
  estimatedDeliveryDays: number
  shipmentId: string
}

/**
 * Books parcel shipment with 3PL carrier (e.g. Kerry, Flash, Thailand Post)
 */
export async function book3PLShipment(
  jobId: string,
  legType: ShipmentLegType = ShipmentLegType.BRANCH_TO_VD,
  cost: number = 80
): Promise<Book3PLResult> {
  const carrierName = '3PL Express'
  const randomSuffix = Math.floor(100000000 + Math.random() * 900000000)
  const trackingNo = `TPL${randomSuffix}TH`

  const shipment = await prisma.shipment.create({
    data: {
      jobId,
      legType,
      carrier: CarrierType.TPL,
      status: ShipmentStatus.DISPATCHED,
      trackingNo,
      dispatchedAt: new Date(),
      cost,
    },
  })

  // Log job event
  await prisma.jobEvent.create({
    data: {
      jobId,
      type: '3PL_BOOKED',
      actorRole: 'SYSTEM',
      note: `เรียกรถ 3PL เข้ารับพัสดุ เลขแทร็กกิ้ง: ${trackingNo}`,
      payload: { trackingNo, carrier: carrierName },
    },
  })

  return {
    trackingNo,
    carrierName,
    estimatedDeliveryDays: 2,
    shipmentId: shipment.id,
  }
}

/**
 * Handles incoming 3PL webhook notification
 */
export async function handle3PLWebhook(payload: {
  trackingNo: string
  status: 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED'
  eventTime?: string
  location?: string
}) {
  const shipment = await prisma.shipment.findFirst({
    where: { trackingNo: payload.trackingNo },
    include: { job: true },
  })

  if (!shipment) {
    throw new Error(`Shipment with trackingNo ${payload.trackingNo} not found`)
  }

  const now = payload.eventTime ? new Date(payload.eventTime) : new Date()

  if (payload.status === 'PICKED_UP') {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: ShipmentStatus.PICKED_UP, pickedUpAt: now },
    })
    await prisma.jobEvent.create({
      data: {
        jobId: shipment.jobId,
        type: '3PL_PICKED_UP',
        note: `3PL เข้ารับพัสดุแล้ว ณ ${payload.location || 'สาขา'}`,
        payload,
      },
    })
  } else if (payload.status === 'DELIVERED') {
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: ShipmentStatus.DELIVERED, deliveredAt: now },
    })

    // If outbound leg, move job to VD_INSPECTING or AT_DC_OUTBOUND
    let toStage = shipment.job.stage
    if (shipment.legType === ShipmentLegType.BRANCH_TO_VD || shipment.legType === ShipmentLegType.DC_TO_VD) {
      toStage = JobStage.VD_INSPECTING
    } else if (shipment.legType === ShipmentLegType.VD_TO_BRANCH || shipment.legType === ShipmentLegType.DC_TO_BRANCH) {
      toStage = JobStage.GR_RETURN_RECEIVED
    }

    await prisma.job.update({
      where: { id: shipment.jobId },
      data: { stage: toStage, stageEnteredAt: now, version: { increment: 1 } },
    })

    await prisma.jobEvent.create({
      data: {
        jobId: shipment.jobId,
        type: '3PL_DELIVERED',
        toStage,
        note: `3PL จัดส่งพัสดุถึงปลายทางแล้ว (${payload.location || 'ศูนย์ซ่อม'})`,
        payload,
      },
    })
  }

  return { success: true }
}
