import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeAction } from '@/lib/state-machine'
import { findToken, rateLimited } from '@/lib/public-token'

const LEG_LABEL: Record<string, [string, string]> = {
  BRANCH_TO_DC: ['สาขาต้นทาง', 'คลังกระจายสินค้า (DC)'],
  DC_TO_VD: ['คลังกระจายสินค้า (DC)', 'ศูนย์บริการซ่อม (VD)'],
  BRANCH_TO_VD: ['สาขาต้นทาง', 'ศูนย์บริการซ่อม (VD)'],
  VD_TO_DC: ['ศูนย์บริการซ่อม (VD)', 'คลังกระจายสินค้า (DC)'],
  DC_TO_BRANCH: ['คลังกระจายสินค้า (DC)', 'สาขาปลายทาง'],
  VD_TO_BRANCH: ['ศูนย์บริการซ่อม (VD)', 'สาขาปลายทาง'],
}

async function loadJobData(token: string) {
  const pt = await findToken(token, ['DRIVER', 'TRACKING', 'QUOTE'])
  if (!pt || pt.expiresAt < new Date()) return null

  const ship = await prisma.shipment.findFirst({
    where: {
      OR: [
        { driverToken: token },
        { jobId: pt.jobId },
      ],
      status: { not: 'CANCELLED' },
    },
    orderBy: { createdAt: 'desc' },
  })

  const job = await prisma.job.findUnique({
    where: { id: pt.jobId },
    include: {
      branch: { select: { name: true, address: true, phone: true } },
      vendorCenter: {
        select: {
          code: true,
          address: true,
          phone: true,
          vendorParent: { select: { name: true } },
        },
      },
      events: {
        where: { type: 'DELIVERY_SCHEDULED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  return job ? { pt, ship, job } : null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (await rateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { token } = await params
  const data = await loadJobData(token)
  if (!data) return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' }, { status: 404 })

  const { pt, ship, job } = data
  const [defaultOrigin, defaultDest] = LEG_LABEL[ship?.legType ?? 'BRANCH_TO_DC'] ?? ['สาขา', 'คลังสินค้า']

  const originName = ship?.legType?.startsWith('VD')
    ? `${job.vendorCenter?.vendorParent.name || 'ศูนย์บริการ'} (${job.vendorCenter?.code || '-'})`
    : job.branch.name

  const destName = ship?.legType?.endsWith('VD')
    ? `${job.vendorCenter?.vendorParent.name || 'ศูนย์บริการ'} (${job.vendorCenter?.code || '-'})`
    : ship?.legType?.endsWith('DC')
    ? 'คลังกระจายสินค้า (DC)'
    : job.branch.name

  // F14-T01: Display route leg and shipment information
  const legInfo = {
    legType: ship?.legType ?? 'BRANCH_TO_DC',
    origin: originName || defaultOrigin,
    destination: destName || defaultDest,
    status: ship?.status ?? 'DISPATCHED',
  }

  const rawPhone = job.customerPhone ? job.customerPhone.replace(/\D/g, '') : ''
  const maskedPhone = rawPhone.length >= 10
    ? `${rawPhone.slice(0, 3)}-xxx-${rawPhone.slice(7)}`
    : rawPhone

  const lastAppointment = job.events[0]?.payload as {
    deliveryType?: string
    appointmentDate?: string
    timeSlot?: string
    address?: string
    note?: string
  } | null

  return NextResponse.json({
    jobNo: job.jobNo,
    productName: job.productName,
    brandName: job.brandName,
    customerName: job.customerName,
    customerPhone: maskedPhone,
    customerAddress: job.customerAddress,
    branchName: job.branch.name,
    branchPhone: job.branch.phone,
    branchAddress: job.branch.address,
    stage: job.stage,
    isDriver: pt.type === 'DRIVER',
    legInfo,
    shipment: ship ? {
      legType: ship.legType,
      carrier: ship.carrier,
      trackingNo: ship.trackingNo,
      status: ship.status,
    } : null,
    canConfirmPickup: (ship?.carrier === 'VD_FLEET' || ship?.carrier === 'DC_FLEET') &&
      ship.status === 'DISPATCHED' &&
      job.stage === 'GR_PACKED',
    appointment: lastAppointment ?? null,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (await rateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { token } = await params
  const data = await loadJobData(token)
  if (!data) return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' }, { status: 404 })

  const { pt, job, ship } = data
  const body = await req.json().catch(() => ({}))

  // 1. Customer Delivery Scheduling appointment submission
  if (body.deliveryType || body.appointmentDate) {
    const deliveryType = body.deliveryType === 'HOME_DELIVERY' ? 'HOME_DELIVERY' : 'BRANCH_PICKUP'
    const appointmentDate = body.appointmentDate || new Date().toISOString().slice(0, 10)
    const timeSlot = body.timeSlot || '09:00 - 12:00'
    const address = body.address || job.customerAddress || ''
    const note = body.note || ''

    await prisma.jobEvent.create({
      data: {
        jobId: job.id,
        type: 'DELIVERY_SCHEDULED',
        actorRole: 'CUSTOMER',
        payload: {
          deliveryType,
          appointmentDate,
          timeSlot,
          address,
          note,
        },
        note: `ลูกค้านัดหมายรับสินค้า: ${deliveryType === 'HOME_DELIVERY' ? 'จัดส่งถึงบ้าน' : 'รับที่สาขา'} วันที่ ${appointmentDate} เวลา ${timeSlot}`,
      },
    })

    return NextResponse.json({
      success: true,
      scheduled: true,
      appointment: {
        deliveryType,
        appointmentDate,
        timeSlot,
        address,
      },
    })
  }

  // 2. Carrier/Driver confirm pickup with verification photo
  if (body.photos || body.carrierConfirm) {
    const r = await executeAction(
      job.id,
      'carrier_confirm_pickup',
      {
        photos: body.photos ?? [],
        note: 'คนรถยืนยันรับสินค้าผ่านลิงก์พัสดุ',
      },
      { userId: null, role: 'DRIVER' }
    )

    if (!r.success) {
      // Fallback update shipment if carrier action not registered
      if (ship) {
        await prisma.shipment.update({
          where: { id: ship.id },
          data: { status: 'PICKED_UP', pickedUpAt: new Date() },
        })
      }
    }

    return NextResponse.json({ success: true, carrierConfirmed: true })
  }

  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
}
