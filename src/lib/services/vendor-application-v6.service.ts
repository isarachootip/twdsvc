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

/** Pure builder mapping 100% of V6 10-section form fields into Prisma JSON columns */
export function buildVendorApplicationV6Data(input: VendorApplicationV6Input) {
  const storeName = input.company.trim()
  const taxId = input.taxId.trim()
  const phone = input.primaryContact.phone.trim()
  const email = input.primaryContact.email.trim().toLowerCase()

  const cinRates = input.productGroupRates.filter(r => r.serviceType === 'CARRY_IN')
  const onsRates = input.productGroupRates.filter(r => r.serviceType === 'ON_SITE')
  const summaryCinFee = cinRates.length > 0 ? String(cinRates[0].minInspectionFee) : input.cinFee
  const summaryOnsFee = onsRates.length > 0 ? String(onsRates[0].minInspectionFee) : input.onsFee
  const summaryGpPct =
    input.productGroupRates.length > 0
      ? `${input.productGroupRates[0].gpPct}%`
      : input.gpPct

  return {
    status: VendorApplicationStatus.PENDING_APPROVAL,
    storeName,
    businessType: input.entityType,
    taxId,
    phone,
    email,
    lineId: input.primaryContact.line?.trim() || null,
    branches: input.branches as unknown as Prisma.InputJsonValue,
    appliances: {
      carryIn: input.cinProducts,
      carryInAllBrands: Boolean(input.cinAllBrands),
      carryInBrands: input.cinAllBrands ? [] : input.cinBrands,
      onSite: input.onsProducts,
      onSiteAllBrands: Boolean(input.onsAllBrands),
      onSiteBrands: input.onsAllBrands ? [] : input.onsBrands,
      productDetails: input.productDetails,
      productGroupRates: input.productGroupRates,
      productNote: input.productNote,
    } as unknown as Prisma.InputJsonValue,
    isBrandAuthorized:
      Boolean(input.authorized) &&
      !input.authorized.includes('ไม่ได้') &&
      !input.authorized.includes('ไม่ใช่') &&
      (input.authorized.includes('Authorized') || input.authorized.includes('แต่งตั้ง')),
    coverage: {
      radius: input.onsRadius,
      routes: input.coverage,
      carryInReceiveMethod: input.cinReceiveMethod,
    } as unknown as Prisma.InputJsonValue,
    documents: input.documents as unknown as Prisma.InputJsonValue,
    bank: input.bank as unknown as Prisma.InputJsonValue,
    agreements: {
      terms: input.agreements,
      signName: input.signName,
      signPos: input.signPos,
      companyProfile: {
        supplierRegistered: input.supplierRegistered,
        spcode: input.spcode,
        regNo: input.regNo,
        companyAddr: input.companyAddr,
        branchType: input.branchType,
        authorized: input.authorized,
        primaryContact: input.primaryContact,
        backupContact: input.backupContact,
        authorizer: input.authorizer,
      },
      pricing: {
        cinFee: summaryCinFee,
        onsFee: summaryOnsFee,
        feeCondition: input.feeCondition,
        priceNote: input.priceNote,
      },
      commercial: {
        gpPct: summaryGpPct,
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
        techOut: input.techOut,
        onsTech: input.onsTech,
        onsTeams: input.onsTeams,
        onsBackup: input.onsBackup,
        onsCapDay: input.onsCapDay,
        onsCapMonth: input.onsCapMonth,
      },
      workingHours: {
        cinDays: input.cinDays,
        cinOpen: input.cinOpen,
        cinClose: input.cinClose,
        cinPickDays: input.cinPickDays,
        cinPickStart: input.cinPickStart,
        cinPickEnd: input.cinPickEnd,
        onsDays: input.onsDays,
        onsHours: input.onsHours,
        onsAppt: input.onsAppt,
        onsFast: input.onsFast,
        onsQueue: input.onsQueue,
      },
      safetyCompliance: {
        damageLiability: input.damageLiability,
        safetyStandards: input.safetyStandards,
        onsiteTools: input.onsiteTools,
      },
      authorizedBrands: input.authorizedBrands,
    } as unknown as Prisma.InputJsonValue,
    estimatedTier: 'STANDARD',
    score: 80,
  }
}

export async function createVendorApplicationV6(input: VendorApplicationV6Input) {
  const data = buildVendorApplicationV6Data(input)

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
