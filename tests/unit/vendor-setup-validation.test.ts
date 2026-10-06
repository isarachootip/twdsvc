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

  // Test 4: javascript: / external URLs in documents rejected (admin UI renders these as links)
  for (const bad of ['javascript:alert(1)', 'https://evil.example/x.pdf', '//evil.example/x']) {
    const r = fullVendorApplicationSchema.safeParse({
      ...validData,
      finance: { ...validData.finance, documents: { ...validData.finance.documents, idcard: bad } },
    })
    if (r.success) throw new Error(`Expected unsafe document URL to be rejected: ${bad}`)
  }
  console.log('✔ Test 4: Unsafe document URLs correctly rejected')

  // Test 5: signature must be PNG/JPEG data URL or safe path, and size-capped
  const sigOk = (s: string) => step5AgreementsSchema.safeParse({ agreements: validData.agreements.agreements, signatureUrl: s }).success
  if (sigOk('data:image/svg+xml;base64,PHN2Zz4=')) throw new Error('Expected SVG signature to be rejected')
  if (sigOk('javascript:alert(1)')) throw new Error('Expected javascript: signature to be rejected')
  if (sigOk('data:image/png;base64,' + 'A'.repeat(2_000_000))) throw new Error('Expected oversized signature to be rejected')
  if (!sigOk('data:image/jpeg;base64,/9j/4AAQ')) throw new Error('Expected JPEG signature to be accepted')
  console.log('✔ Test 5: Signature type and size limits enforced')

  console.log('All vendor-setup validation tests passed successfully!')
}

runValidationTests()
