import { extractApplicationProductRates } from './validations/vendor-product-group.schema'
import { extractApplicationCommercialTerms } from './vendor-billing-cycle'
import {
  STANDARD_AGREEMENT_ITEMS,
  type RawVendorApplicationRecord,
  type NormalizedVendorApplication,
} from './vendor-application-types'
import {
  asObj,
  asStr,
  asNumOrNull,
  asStrArr,
  parseAddress,
  parseBranches,
  parseAuthorizedBrands,
  parseDocuments,
  parseActiveCoverageRoutes,
} from './vendor-application-parsers'

export function parseVendorApplicationFullDetail(raw: RawVendorApplicationRecord): NormalizedVendorApplication {
  const agr = asObj(raw.agreements)
  const profile = asObj(agr.companyProfile)
  const primary = asObj(profile.primaryContact)
  const backup = asObj(profile.backupContact)
  const authPerson = asObj(profile.authorizer)
  const bankObj = asObj(raw.bank)
  const appObj = asObj(raw.appliances)
  const covObj = asObj(raw.coverage)
  const capObj = asObj(agr.capacity)
  const hoursObj = asObj(agr.workingHours)
  const pricingObj = asObj(agr.pricing)
  const slaObj = asObj(agr.sla)
  const safetyObj = asObj(agr.safetyCompliance)
  const termsObj = asObj(agr.terms)

  const branches = parseBranches(raw.branches)
  const commercial = extractApplicationCommercialTerms(raw.agreements)
  const productGroupRates = extractApplicationProductRates(raw.appliances, raw.agreements)

  const rawProdDetails = asObj(appObj.productDetails)
  const productDetails: Record<string, { repair: boolean; replacePart: boolean; install: boolean }> = {}
  for (const [k, v] of Object.entries(rawProdDetails)) {
    const d = asObj(v)
    productDetails[k] = {
      repair: Boolean(d.repair),
      replacePart: Boolean(d.replacePart),
      install: Boolean(d.install),
    }
  }

  const createdStr = raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt)
  const reviewedStr = raw.reviewedAt
    ? raw.reviewedAt instanceof Date ? raw.reviewedAt.toISOString() : String(raw.reviewedAt)
    : null

  return {
    id: raw.id,
    applicationNo: raw.applicationNo,
    status: raw.status,
    estimatedTier: raw.estimatedTier || 'STANDARD',
    score: raw.score ?? 0,
    createdAt: createdStr,
    reviewedAt: reviewedStr,
    reviewedBy: raw.reviewedBy ?? null,
    reviewerName: raw.reviewerName ?? null,
    adminNotes: raw.adminNotes ?? null,
    approvedParentId: raw.approvedParentId ?? null,
    section1: {
      supplierRegistered: asStr(profile.supplierRegistered),
      spcode: asStr(profile.spcode),
      entityType: asStr(raw.businessType),
      storeName: asStr(raw.storeName),
      regNo: asStr(profile.regNo),
      taxId: asStr(raw.taxId),
      companyAddr: parseAddress(profile.companyAddr),
      branchType: asStr(profile.branchType, branches.length > 1 ? 'มีศูนย์บริการหลายสาขา' : 'ศูนย์บริการเดียว'),
      branches,
      isBrandAuthorized: Boolean(raw.isBrandAuthorized),
      authorizedText: asStr(
        profile.authorized,
        raw.isBrandAuthorized ? 'เป็นศูนย์บริการแต่งตั้ง (Authorized ของแบรนด์)' : 'ศูนย์ซ่อมอิสระทั่วไป'
      ),
      authorizedBrands: parseAuthorizedBrands(agr.authorizedBrands),
      primaryContact: {
        name: asStr(primary.name),
        pos: asStr(primary.pos),
        phone: asStr(primary.phone, asStr(raw.phone)),
        email: asStr(primary.email, asStr(raw.email)),
        line: asStr(primary.line, asStr(raw.lineId)),
      },
      backupContact: {
        name: asStr(backup.name),
        phone: asStr(backup.phone),
        timeStart: asStr(backup.timeStart),
        timeEnd: asStr(backup.timeEnd),
      },
      authorizer: {
        name: asStr(authPerson.name),
        pos: asStr(authPerson.pos),
        phone: asStr(authPerson.phone),
        email: asStr(authPerson.email),
      },
      bank: {
        accName: asStr(bankObj.accName),
        accNo: asStr(bankObj.accNo),
        bank: asStr(bankObj.bank),
        bankBranch: asStr(bankObj.bankBranch),
        vat20: asStr(bankObj.vat20),
      },
    },
    section2: {
      cinProducts: asStrArr(appObj.carryIn),
      cinAllBrands: appObj.carryInAllBrands === true,
      cinBrands: appObj.carryInAllBrands === true ? [] : asStrArr(appObj.carryInBrands),
      cinReceiveMethod: asStr(covObj.carryInReceiveMethod),
      onsProducts: asStrArr(appObj.onSite),
      onsAllBrands: appObj.onSiteAllBrands === true,
      onsBrands: appObj.onSiteAllBrands === true ? [] : asStrArr(appObj.onSiteBrands),
      productDetails,
      productGroupRates,
      productNote: asStr(appObj.productNote),
    },
    section3: {
      techTotal: asNumOrNull(capObj.techTotal),
      techOut: asNumOrNull(capObj.techOut),
      onsTech: asNumOrNull(capObj.onsTech),
      onsTeams: asNumOrNull(capObj.onsTeams),
      onsBackup: asNumOrNull(capObj.onsBackup),
      onsCapDay: asNumOrNull(capObj.onsCapDay),
      onsCapMonth: asNumOrNull(capObj.onsCapMonth),
    },
    section4: {
      cinDays: asStrArr(hoursObj.cinDays),
      cinOpen: asStr(hoursObj.cinOpen),
      cinClose: asStr(hoursObj.cinClose),
      cinPickDays: asStrArr(hoursObj.cinPickDays),
      cinPickStart: asStr(hoursObj.cinPickStart),
      cinPickEnd: asStr(hoursObj.cinPickEnd),
      onsDays: asStrArr(hoursObj.onsDays),
      onsHours: asStr(hoursObj.onsHours),
      onsAppt: asStr(hoursObj.onsAppt),
      onsFast: asNumOrNull(hoursObj.onsFast),
      onsQueue: asNumOrNull(hoursObj.onsQueue),
    },
    section5: {
      onsRadius: asStr(covObj.radius),
      activeRoutes: parseActiveCoverageRoutes(covObj, branches, raw.resolvedSites),
    },
    section6: {
      cinFee: asStr(pricingObj.cinFee),
      onsFee: asStr(pricingObj.onsFee),
      feeCondition: asStr(pricingObj.feeCondition),
      priceNote: asStr(pricingObj.priceNote),
    },
    section7: {
      gpPct: asStr(asObj(agr.commercial).gpPct),
      creditTerm: commercial.creditTerm,
      billingCycle: commercial.billingCycle,
    },
    section8: {
      cinSlaDays: asStr(slaObj.cinSlaDays),
      onsSlaApptHours: asStr(slaObj.onsSlaApptHours),
      onsSlaArrivalDays: asStr(slaObj.onsSlaArrivalDays),
    },
    section9: {
      damageLiability: asStr(safetyObj.damageLiability),
      safetyStandards: asStrArr(safetyObj.safetyStandards),
      onsiteTools: asStrArr(safetyObj.onsiteTools),
    },
    section10: {
      documents: parseDocuments(raw.documents),
      agreements: STANDARD_AGREEMENT_ITEMS.map(item => ({
        key: item.key,
        label: item.label,
        accepted: typeof termsObj[item.key] === 'boolean' ? Boolean(termsObj[item.key]) : Boolean(agr[item.key]),
      })),
      signName: asStr(agr.signName),
      signPos: asStr(agr.signPos),
      signatureUrl: raw.signatureUrl ?? null,
    },
  }
}
