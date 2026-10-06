import { prisma } from '../../src/lib/db'
import {
  createVendorApplication,
  listVendorApplications,
  approveVendorApplication,
} from '../../src/lib/services/vendor-application.service'
import { VendorApplicationStatus } from '@prisma/client'

async function runLifecycleTest() {
  console.log('--- Testing Vendor Application Lifecycle ---')

  const testTaxId = '9999999999999'
  const storeName = 'ร้านเทสต์คู่ค้า แอร์แอนด์เซอร์วิส'

  // Clean up any previous test leftovers
  await prisma.vendorApplication.deleteMany({ where: { taxId: testTaxId } })

  // 1. Submit Application
  const testInput = {
    store: {
      name: storeName,
      type: 'บริษัทจำกัด' as const,
      taxId: testTaxId,
      phone: '0899999999',
      lineId: '@testvendor',
      branches: [
        {
          id: 'b-test-1',
          branchName: 'สาขาเทสต์ 1',
          address: '99/99 ซอยทดสอบ ถนนทดสอบ',
          province: 'กรุงเทพมหานคร',
          amphoe: 'บางนา',
          phone: '0899999999',
          photo: null,
          radius: 35,
          vip: true,
          express: true,
        },
      ],
    },
    expertise: {
      appliances: { washing: true, fridge: true, air: true },
      isBrandAuthorized: true,
      defaultSlaDays: 5,
      warrantyDays: 90,
    },
    coverage: {
      coverage: {
        BAP: {
          transport: 'pickup' as const,
          days: ['mon', 'wed', 'fri'],
          times: ['morning'],
          frequency: 'สัปดาห์ละ 3 ครั้ง',
          note: '',
          transitDays: '2-3',
          vendorDeliveryAddressId: 'b-test-1',
        },
      },
    },
    finance: {
      bank: 'กสิกรไทย',
      accNo: '9998887776',
      accName: storeName,
      commission: true as const,
      documents: {
        idcard: '/uploads/test-idcard.jpg',
        company: '',
        license: '',
        portfolio: [],
      },
    },
    agreements: {
      agreements: {
        sla: true as const,
        pdpa: true as const,
        standard: true as const,
        transportDamage: true as const,
        warrantyRepeat: true as const,
      },
      signatureUrl: '/uploads/test-sig.png',
    },
  }

  const app = await createVendorApplication(testInput)
  console.log('✔ 1. Created application:', app.applicationNo, 'Tier:', app.estimatedTier, 'Score:', app.score)

  if (app.status !== VendorApplicationStatus.PENDING_APPROVAL) {
    throw new Error(`Expected PENDING_APPROVAL, got ${app.status}`)
  }

  // 2. Query as Admin
  const pendingApps = await listVendorApplications(VendorApplicationStatus.PENDING_APPROVAL)
  const found = pendingApps.find(a => a.id === app.id)
  if (!found) {
    throw new Error('Application not found in pending list')
  }
  console.log('✔ 2. Admin successfully found pending application in list')

  // 3. Approve Application
  const approvedApp = await approveVendorApplication(app.id, 'admin-tester')
  console.log('✔ 3. Application approved, approvedParentId:', approvedApp.approvedParentId)

  if (approvedApp.status !== VendorApplicationStatus.APPROVED) {
    throw new Error(`Expected APPROVED, got ${approvedApp.status}`)
  }

  // 4. Verify VendorParent created
  const parent = await prisma.vendorParent.findUnique({
    where: { id: approvedApp.approvedParentId! },
    include: { centers: true },
  })
  if (!parent) {
    throw new Error('VendorParent was not created in database')
  }
  if (parent.name !== storeName) {
    throw new Error(`Expected name ${storeName}, got ${parent.name}`)
  }
  if (parent.centers.length === 0) {
    throw new Error('VendorCenter was not created for the branch')
  }
  console.log('✔ 4. Verified VendorParent and VendorCenter successfully created:', parent.code, 'centers:', parent.centers.length)

  // 5. Cleanup test data
  await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: parent.centers.map(c => c.id) } } })
  await prisma.vendorCenter.deleteMany({ where: { vendorParentId: parent.id } })
  await prisma.vendorParent.delete({ where: { id: parent.id } })
  await prisma.vendorApplication.delete({ where: { id: app.id } })
  console.log('✔ 5. Cleaned up test records cleanly')

  console.log('Lifecycle test finished successfully!')
}

runLifecycleTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Lifecycle test failed:', err)
    process.exit(1)
  })
