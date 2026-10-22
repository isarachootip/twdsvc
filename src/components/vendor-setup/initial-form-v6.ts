import type { VendorApplicationFormV6 } from './types-v6'

export const INITIAL_FORM_V6: VendorApplicationFormV6 = {
  // 1
  supplierRegistered: '',
  spcode: '',
  entityType: 'บริษัทจำกัด',
  company: '',
  regNo: '',
  taxId: '',
  companyAddr: {
    line1: '',
    subdistrict: '',
    district: '',
    province: '',
    zip: '',
    phone: '',
    note: '',
  },
  branchType: 'ศูนย์บริการเดียว',
  branches: [
    {
      line1: '',
      subdistrict: '',
      district: '',
      province: '',
      zip: '',
      phone: '',
      contactName: '',
      note: '',
    },
  ],
  authorized: 'ไม่ได้เป็นศูนย์บริการ Authorized',
  authorizedBrands: [
    { brand: '', productType: '', certNo: '', expireDate: '' },
    { brand: '', productType: '', certNo: '', expireDate: '' },
  ],
  primaryContact: { name: '', pos: '', phone: '', email: '', line: '' },
  backupContact: { name: '', phone: '', timeStart: '08:00', timeEnd: '17:00' },
  authorizer: { name: '', pos: '', phone: '', email: '' },
  bank: { accName: '', accNo: '', bank: '', bankBranch: '', vat20: 'มี' },

  // 2
  cinProducts: [],
  cinBrands: [],
  cinReceiveMethod: 'รับสินค้าจาก DC',
  onsProducts: [],
  onsBrands: [],
  productDetails: {},
  productNote: '',

  // 3
  techTotal: 2,
  techOut: 0,
  onsTech: 1,
  onsTeams: 1,
  onsCapDay: 5,
  onsCapMonth: 100,
  onsBackup: 0,

  // 4
  cinDays: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
  cinOpen: '08:30',
  cinClose: '17:30',
  cinPickDays: ['จันทร์', 'พุธ', 'ศุกร์'],
  cinPickStart: '09:00',
  cinPickEnd: '16:00',
  onsDays: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'],
  onsHours: '08:30',
  onsAppt: '17:00',
  onsFast: 2,
  onsQueue: 8,

  // 5
  onsRadius: '30 กม.',
  coverage: {},

  // 6
  cinFee: '300',
  onsFee: '500',
  feeCondition: 'ซ่อมไม่ได้ไม่คิดเงิน ยกเว้นลูกค้ายกเลิกเองคิดค่าบริการตรวจเช็ค',
  priceNote: '',

  // 7
  gpPct: '18%',
  creditTerm: '30 วัน',
  billingCycle: 'ทุกวันที่ 25 ของเดือน',

  // 8
  cinSlaDays: '7 วัน',
  onsSlaApptHours: 'ภายใน 24 ชม.',
  onsSlaArrivalDays: 'ภายใน 3 วัน',

  // 9
  damageLiability: 'ชดใช้ตามมูลค่าความเสียหายจริง หรือตามวงเงินประกัน',
  safetyStandards: [
    'ตรวจประวัติก่อนรับเข้าทำงาน',
    'แต่งเครื่องแบบ',
    'มีบัตรประจำตัวช่าง',
    'มีประกันอุบัติเหตุช่าง',
    'สวมรองเท้าผ้าใบเข้าบ้านลูกค้า',
  ],
  onsiteTools: ['มัลติมิเตอร์', 'สว่านไฟฟ้า', 'ชุดประแจ', 'ปั๊มสุญญากาศ', 'เกจวัดน้ำยา'],

  // 10
  documents: {},
  agreements: {
    sla: false,
    inspect: false,
    reportApp: false,
    training: false,
    pdpa: false,
    truth: false,
  },
  signName: '',
  signPos: '',
}
