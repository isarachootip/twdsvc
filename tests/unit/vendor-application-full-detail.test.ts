import { describe, it, expect, setTier } from '../framework/core'
import { INITIAL_FORM_V6 } from '../../src/components/vendor-setup/initial-form-v6'
import { vendorApplicationV6Schema } from '../../src/lib/validations/vendor-application-v6.schema'
import { buildVendorApplicationV6Data } from '../../src/lib/services/vendor-application-v6.service'
import { parseVendorApplicationFullDetail } from '../../src/lib/vendor-application-detail'

setTier('Tier 1')

describe('Unit: Vendor Application Full 10-Section Persistence & Detail Normalizer', () => {
  const fullFormInput = vendorApplicationV6Schema.parse({
    ...INITIAL_FORM_V6,
    supplierRegistered: 'เคยลงทะเบียนทำการค้ากับไทวัสดุ',
    spcode: '620163',
    entityType: 'บริษัทจำกัด',
    company: 'บริษัท ไทยเซอร์วิส โปร จำกัด',
    regNo: '0105560998877',
    taxId: '0105560998877',
    companyAddr: {
      line1: '88/9 ถนนเทพรัตน',
      subdistrict: 'บางแก้ว',
      district: 'บางพลี',
      province: 'สมุทรปราการ',
      zip: '10540',
      phone: '023456789',
      note: 'อาคาร B ชั้น 2',
    },
    branchType: 'มีศูนย์บริการหลายสาขา',
    branches: [
      {
        line1: '88/9 ถนนเทพรัตน',
        subdistrict: 'บางแก้ว',
        district: 'บางพลี',
        province: 'สมุทรปราการ',
        zip: '10540',
        phone: '023456789',
        contactName: 'นายสมชาย สาขาหลัก',
        note: 'ติดถนนใหญ่',
      },
      {
        line1: '120/5 ถนนสุขุมวิท',
        subdistrict: 'นาเกลือ',
        district: 'บางละมุง',
        province: 'ชลบุรี',
        zip: '20150',
        phone: '038112233',
        contactName: 'นางสาววิภา สาขาชลบุรี',
        note: 'ตรงข้ามปั๊ม ปตท.',
      },
    ],
    authorized: 'เป็นศูนย์บริการแต่งตั้ง (Authorized ของแบรนด์)',
    authorizedBrands: [
      { brand: 'DAIKIN', productType: 'เครื่องปรับอากาศ', certNo: 'DK-2026-01', expireDate: '2027-12-31' },
    ],
    primaryContact: {
      name: 'นายกิตติพงศ์ ประสานงาน',
      pos: 'ผู้จัดการฝ่ายบริการ',
      phone: '0812223333',
      email: 'kittipong@thaiservicepro.co.th',
      line: '@thaiservicepro',
    },
    backupContact: {
      name: 'นายสำรอง พร้อมช่วย',
      phone: '0894445555',
      timeStart: '18:00',
      timeEnd: '22:00',
    },
    authorizer: {
      name: 'นายอนุมัติ กรรมการ',
      pos: 'กรรมการผู้จัดการ',
      phone: '0819990000',
      email: 'director@thaiservicepro.co.th',
    },
    bank: {
      accName: 'บจก. ไทยเซอร์วิส โปร',
      accNo: '4051234567',
      bank: 'ไทยพาณิชย์',
      bankBranch: 'เมกาบางนา',
      vat20: 'มี',
    },
    cinProducts: ['ปั๊มน้ำ', 'เครื่องมือช่าง'],
    cinBrands: ['MAKITA', 'MITSUBISHI'],
    cinReceiveMethod: 'รับสินค้าจาก DC',
    onsProducts: ['เครื่องปรับอากาศ'],
    onsBrands: ['DAIKIN'],
    productDetails: {
      'เครื่องปรับอากาศ': { repair: true, replacePart: true, install: true },
    },
    productGroupRates: [
      {
        serviceType: 'CARRY_IN',
        groupName: 'ปั๊มน้ำ',
        minInspectionFee: 500,
        gpPct: 15,
        isCustomGroup: false,
        tasks: { repair: true, replacePart: true, install: false },
      },
      {
        serviceType: 'ON_SITE',
        groupName: 'เครื่องปรับอากาศ',
        minInspectionFee: 1000,
        gpPct: 18,
        isCustomGroup: false,
        tasks: { repair: true, replacePart: true, install: true },
      },
    ],
    productNote: 'รับเฉพาะแอร์ไม่เกิน 36,000 BTU',
    techTotal: 15,
    techOut: 4,
    onsTech: 8,
    onsTeams: 4,
    onsBackup: 2,
    onsCapDay: 12,
    onsCapMonth: 280,
    cinDays: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
    cinOpen: '08:30',
    cinClose: '17:30',
    cinPickDays: ['จันทร์', 'พุธ', 'ศุกร์'],
    cinPickStart: '09:00',
    cinPickEnd: '16:00',
    onsDays: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'],
    onsHours: '08:00',
    onsAppt: '18:00',
    onsFast: 4,
    onsQueue: 10,
    onsRadius: '40 กม.',
    coverage: {
      BN01: { onsite: true, respBranchIdx: 0 },
      PTY01: { onsite: true, respBranchIdx: 1 },
      CMI01: { onsite: false, respBranchIdx: 0 },
    },
    cinFee: '500',
    onsFee: '1000',
    feeCondition: 'ฟรีค่าเปิดเครื่องกรณีลูกค้ายินยอมซ่อมตามใบเสนอราคา',
    priceNote: 'เกิน 40 กม. คิดกม.ละ 12 บาท',
    gpPct: '18%',
    creditTerm: '45 วัน',
    billingCycle: 'ทุกวันที่ 25 ของเดือน',
    cinSlaDays: '5 วัน',
    onsSlaApptHours: 'ภายใน 12 ชม.',
    onsSlaArrivalDays: 'ภายใน 2 วัน',
    damageLiability: 'มีประกันภัยคุ้มครองสินค้าและทรัพย์สินบุคคลภายนอก',
    safetyStandards: ['ตรวจประวัติก่อนรับเข้าทำงาน', 'แต่งเครื่องแบบ', 'มีบัตรประจำตัวช่าง'],
    onsiteTools: ['เกจวัดน้ำยาแอร์ดิจิทัล', 'ปั๊มสุญญากาศ'],
    documents: {
      file_0: '/api/files/dbd-doc.pdf',
      file_1: '/api/files/vat20-doc.pdf',
      file_2: '/api/files/bookbank.jpg',
    },
    agreements: {
      sla: true,
      inspect: true,
      reportApp: true,
      training: true,
      pdpa: true,
      truth: true,
    },
    signName: 'นายอนุมัติ กรรมการ',
    signPos: 'กรรมการผู้จัดการ',
  })

  it('FULL-V6-01: Persists and normalizes 100% of all 10 sections without losing any field', () => {
    const dbPayload = buildVendorApplicationV6Data(fullFormInput)
    const normalized = parseVendorApplicationFullDetail({
      id: 'app-1',
      applicationNo: 'SC26110001',
      ...dbPayload,
      signatureUrl: null,
      estimatedCases: 0,
      approvedParentId: null,
      adminNotes: null,
      reviewedBy: 'admin-1',
      reviewerName: 'ผู้ดูแลระบบหลัก',
      reviewedAt: '2026-11-11T15:00:00.000Z',
      createdAt: '2026-11-11T14:00:00.000Z',
      resolvedSites: {
        BN01: { code: 'BN01', nickname: 'บางนา', name: 'ไทวัสดุ สาขาบางนา', province: 'สมุทรปราการ' },
        PTY01: { code: 'PTY01', nickname: 'พัทยา', name: 'ไทวัสดุ สาขาพัทยา', province: 'ชลบุรี' },
      },
    })

    // Section 1
    expect(normalized.section1.supplierRegistered).toBe('เคยลงทะเบียนทำการค้ากับไทวัสดุ')
    expect(normalized.section1.spcode).toBe('620163')
    expect(normalized.section1.regNo).toBe('0105560998877')
    expect(normalized.section1.companyAddr.line1).toBe('88/9 ถนนเทพรัตน')
    expect(normalized.section1.companyAddr.province).toBe('สมุทรปราการ')
    expect(normalized.section1.branchType).toBe('มีศูนย์บริการหลายสาขา')
    expect(normalized.section1.branches.length).toBe(2)
    expect(normalized.section1.primaryContact.name).toBe('นายกิตติพงศ์ ประสานงาน')
    expect(normalized.section1.primaryContact.pos).toBe('ผู้จัดการฝ่ายบริการ')
    expect(normalized.section1.backupContact.name).toBe('นายสำรอง พร้อมช่วย')
    expect(normalized.section1.authorizer.name).toBe('นายอนุมัติ กรรมการ')
    expect(normalized.section1.bank.bankBranch).toBe('เมกาบางนา')
    expect(normalized.section1.bank.vat20).toBe('มี')

    // Section 2
    expect(normalized.section2.cinProducts).toEqual(['ปั๊มน้ำ', 'เครื่องมือช่าง'])
    expect(normalized.section2.cinReceiveMethod).toBe('รับสินค้าจาก DC')
    expect(normalized.section2.productGroupRates.length).toBe(2)
    expect(normalized.section2.productNote).toBe('รับเฉพาะแอร์ไม่เกิน 36,000 BTU')

    // Section 3
    expect(normalized.section3.techTotal).toBe(15)
    expect(normalized.section3.techOut).toBe(4)
    expect(normalized.section3.onsTech).toBe(8)
    expect(normalized.section3.onsTeams).toBe(4)
    expect(normalized.section3.onsBackup).toBe(2)
    expect(normalized.section3.onsCapDay).toBe(12)
    expect(normalized.section3.onsCapMonth).toBe(280)

    // Section 4
    expect(normalized.section4.cinDays.length).toBe(6)
    expect(normalized.section4.cinOpen).toBe('08:30')
    expect(normalized.section4.cinClose).toBe('17:30')
    expect(normalized.section4.cinPickDays).toEqual(['จันทร์', 'พุธ', 'ศุกร์'])
    expect(normalized.section4.onsHours).toBe('08:00')
    expect(normalized.section4.onsFast).toBe(4)
    expect(normalized.section4.onsQueue).toBe(10)

    // Section 5 (only onsite: true active routes or clearly resolved routes)
    expect(normalized.section5.onsRadius).toBe('40 กม.')
    expect(normalized.section5.activeRoutes.length).toBe(2)
    expect(normalized.section5.activeRoutes[0].siteDisplayName).toBe('บางนา')
    expect(normalized.section5.activeRoutes[1].respBranchLabel).toContain('สาขาที่ 2')

    // Section 6, 7, 8, 9
    expect(normalized.section6.feeCondition).toBe('ฟรีค่าเปิดเครื่องกรณีลูกค้ายินยอมซ่อมตามใบเสนอราคา')
    expect(normalized.section6.priceNote).toBe('เกิน 40 กม. คิดกม.ละ 12 บาท')
    expect(normalized.section7.creditTerm).toBe('45 วัน')
    expect(normalized.section7.billingCycle).toBe('ทุกวันที่ 25 ของเดือน')
    expect(normalized.section8.cinSlaDays).toBe('5 วัน')
    expect(normalized.section8.onsSlaApptHours).toBe('ภายใน 12 ชม.')
    expect(normalized.section9.damageLiability).toBe('มีประกันภัยคุ้มครองสินค้าและทรัพย์สินบุคคลภายนอก')
    expect(normalized.section9.safetyStandards.length).toBe(3)
    expect(normalized.section9.onsiteTools).toEqual(['เกจวัดน้ำยาแอร์ดิจิทัล', 'ปั๊มสุญญากาศ'])

    // Section 10 & Audit
    const attachedDocs = normalized.section10.documents.filter(d => Boolean(d.fileUrl))
    expect(attachedDocs.length).toBe(3)
    expect(normalized.section10.signName).toBe('นายอนุมัติ กรรมการ')
    expect(normalized.reviewerName).toBe('ผู้ดูแลระบบหลัก')
  })

  it('FULL-V6-02: Safely normalizes legacy partial records with "-" fallbacks and zero crashes', () => {
    const normalized = parseVendorApplicationFullDetail({
      id: 'legacy-1',
      applicationNo: 'SC26109999',
      status: 'PENDING_APPROVAL',
      storeName: 'ร้านช่างเก่าเซอร์วิส',
      businessType: 'บุคคลธรรมดา',
      taxId: '1100100100100',
      phone: '0811112222',
      email: 'old@shop.com',
      lineId: null,
      branches: [{ line1: '12/3 ถนนสุขสวัสดิ์', province: 'กรุงเทพมหานคร', contactName: 'ช่างเก่า' }],
      appliances: { carryIn: ['ปั๊มน้ำ'], onSite: [] },
      isBrandAuthorized: false,
      coverage: {},
      documents: {},
      bank: { bank: 'กรุงไทย', accNo: '9876543210', accName: 'นายช่างเก่า' },
      agreements: {
        signName: 'นายช่างเก่า',
        signPos: 'เจ้าของร้าน',
      },
      signatureUrl: null,
      estimatedTier: 'STANDARD',
      estimatedCases: 0,
      score: 75,
      approvedParentId: null,
      adminNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: '2026-10-01T10:00:00.000Z',
    })

    expect(normalized.section1.supplierRegistered).toBe('-')
    expect(normalized.section1.spcode).toBe('-')
    expect(normalized.section1.companyAddr.line1).toBe('-')
    expect(normalized.section1.primaryContact.phone).toBe('0811112222')
    expect(normalized.section4.cinOpen).toBe('-')
    expect(normalized.section9.damageLiability).toBe('-')
    expect(normalized.section9.safetyStandards).toEqual([])
    expect(normalized.section10.signName).toBe('นายช่างเก่า')
  })
})
