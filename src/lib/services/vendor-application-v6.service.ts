import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import { Prisma, VendorApplicationStatus } from '@prisma/client'
import type { VendorApplicationV6Input } from '../validations/vendor-application-v6.schema'

/** Generate SCyyMMxxxx code (e.g. SC26100001) matching Thai Watsadu SC format */
function generateSCNumber(): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const seq = String(crypto.randomInt(1000, 9999))
  return `SC${yy}${mm}${seq}`
}

export async function createVendorApplicationV6(input: VendorApplicationV6Input) {
  const storeName = input.company.trim()
  const taxId = input.taxId.trim()
  const phone = input.primaryContact.phone.trim()
  const email = input.primaryContact.email.trim().toLowerCase()

  const data = {
    status: VendorApplicationStatus.PENDING_APPROVAL,
    storeName,
    businessType: input.entityType,
    taxId,
    phone,
    email,
    lineId: input.primaryContact.line?.trim() || null,
    branches: input.branches as unknown as object,
    appliances: {
      carryIn: input.cinProducts,
      carryInBrands: input.cinBrands,
      onSite: input.onsProducts,
      onSiteBrands: input.onsBrands,
      productDetails: input.productDetails,
    } as unknown as object,
    isBrandAuthorized: input.authorized.includes('Authorized ของแบรนด์'),
    coverage: {
      radius: input.onsRadius,
      routes: input.coverage,
      carryInReceiveMethod: input.cinReceiveMethod,
    } as unknown as object,
    documents: input.documents as unknown as object,
    bank: input.bank as unknown as object,
    agreements: {
      terms: input.agreements,
      signName: input.signName,
      signPos: input.signPos,
      pricing: {
        cinFee: input.cinFee,
        onsFee: input.onsFee,
        feeCondition: input.feeCondition,
      },
      commercial: {
        gpPct: input.gpPct,
        creditTerm: input.creditTerm,
        billingCycle: input.billingCycle,
      },
      sla: {
        cinSlaDays: input.cinSlaDays,
        onsSlaApptHours: input.onsSlaApptHours,
        onsSlaArrivalDays: input.onsSlaArrivalDays,
      },
      capacity: {
        techTotal: input.techTotal,
        onsCapDay: input.onsCapDay,
        onsCapMonth: input.onsCapMonth,
      },
      authorizedBrands: input.authorizedBrands,
    } as unknown as object,
    estimatedTier: 'STANDARD',
    score: 80,
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const applicationNo = generateSCNumber()
    try {
      return await prisma.vendorApplication.create({ data: { ...data, applicationNo } })
    } catch (e) {
      const isDup = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
      if (!isDup || attempt >= 4) throw e
    }
  }
  throw new HttpError(500, 'ไม่สามารถสร้างเลขที่ใบสมัครได้ กรุณาลองใหม่อีกครั้ง')
}

export async function checkVendorApplicationStatus(appNo: string, contact: string) {
  const cleanAppNo = appNo.trim().toUpperCase()
  const cleanContact = contact.trim().toLowerCase().replace(/[\s-]/g, '')

  const app = await prisma.vendorApplication.findUnique({
    where: { applicationNo: cleanAppNo },
  })

  if (!app) {
    throw new HttpError(404, 'ไม่พบข้อมูลใบสมัคร กรุณาตรวจสอบเลขที่ใบสมัคร')
  }

  const appPhone = (app.phone || '').replace(/[\s-]/g, '')
  const appEmail = (app.email || '').toLowerCase()
  const matches = appPhone.includes(cleanContact) || cleanContact.includes(appPhone) || appEmail === cleanContact

  if (!matches) {
    throw new HttpError(403, 'เบอร์โทรหรืออีเมลไม่ตรงกับข้อมูลที่ลงทะเบียนไว้ในใบสมัคร')
  }

  return {
    applicationNo: app.applicationNo,
    storeName: app.storeName,
    businessType: app.businessType,
    status: app.status,
    submittedAt: app.createdAt,
    reviewedAt: app.reviewedAt,
    adminNotes: app.status === 'REJECTED' ? app.adminNotes : null,
  }
}
