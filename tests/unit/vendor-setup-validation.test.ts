import {
  step1StoreSchema,
  step2ExpertiseSchema,
  step3CoverageSchema,
  step4FinanceSchema,
  step5AgreementsSchema,
  fullVendorApplicationSchema,
} from '../../src/lib/validations/vendor-setup.schema'

function runValidationTests() {
  console.log('Running vendor-setup.schema unit tests...')

  // Test 1: Invalid Tax ID in Step 1
  const invalidTax = step1StoreSchema.safeParse({
    name: 'ทดสอบร้านซ่อม',
    type: 'บริษัทจำกัด',
    taxId: '12345', // < 13 digits
    phone: '0812345678',
    branches: [
      {
        id: 'b1',
        branchName: 'สาขาหลัก',
        address: '123 ถนนสุขุมวิท',
        province: 'กรุงเทพมหานคร',
        phone: '0812345678',
        radius: 30,
        vip: false,
        express: false,
      },
    ],
  })

  if (invalidTax.success) {
    throw new Error('Expected validation to fail for invalid tax ID')
  }
  console.log('✔ Test 1: Invalid Tax ID correctly rejected')

  // Test 2: Valid Full Application
  const validData = {
    store: {
      name: 'บริษัท ช่างดี เซอร์วิส จำกัด',
      type: 'บริษัทจำกัด',
      taxId: '0105561234567',
      phone: '0819876543',
      lineId: '@changdee',
      branches: [
        {
          id: 'b1',
          branchName: 'สาขาหลัก บางนา',
          address: '888/9 หมู่ 1 ถนนบางนา-ตราด',
          province: 'สมุทรปราการ',
          amphoe: 'บางพลี',
          phone: '0819876543',
          radius: 40,
          vip: true,
          express: true,
        },
      ],
    },
    expertise: {
      appliances: { washing: true, fridge: true, air: false },
      isBrandAuthorized: true,
      defaultSlaDays: 5,
      warrantyDays: 90,
    },
    coverage: {
      coverage: {
        BAP: {
          transport: 'pickup',
          days: ['mon', 'wed', 'fri'],
          times: ['morning'],
          frequency: 'สัปดาห์ละ 3 ครั้ง',
        },
      },
    },
    finance: {
      bank: 'กสิกรไทย',
      accNo: '0123456789',
      accName: 'บริษัท ช่างดี เซอร์วิส จำกัด',
      commission: true,
      documents: {
        idcard: '/uploads/vendors/idcard.jpg',
        company: '/uploads/vendors/company.pdf',
        license: '',
        portfolio: [],
      },
    },
    agreements: {
      agreements: {
        sla: true,
        pdpa: true,
        standard: true,
        transportDamage: true,
        warrantyRepeat: true,
      },
      signatureUrl: 'data:image/png;base64,sample',
    },
  }

  const parsed = fullVendorApplicationSchema.safeParse(validData)
  if (!parsed.success) {
    throw new Error(`Expected valid full data, got errors: ${JSON.stringify(parsed.error.errors)}`)
  }
  console.log('✔ Test 2: Valid full application successfully parsed')

  // Test 3: Missing agreements rejected
  const missingAgreement = step5AgreementsSchema.safeParse({
    agreements: {
      sla: true,
      pdpa: true,
      standard: false, // Not agreed
      transportDamage: true,
      warrantyRepeat: true,
    },
    signatureUrl: 'data:image/png;base64,sample',
  })

  if (missingAgreement.success) {
    throw new Error('Expected validation to fail when an agreement checkbox is false')
  }
  console.log('✔ Test 3: Unchecked agreements correctly rejected')

  console.log('All vendor-setup validation tests passed successfully!')
}

runValidationTests()
