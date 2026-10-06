import { prisma } from '../../src/lib/db'
import {
  createVendorApplication,
  listVendorApplications,
  approveVendorApplication,
  rejectVendorApplication,
} from '../../src/lib/services/vendor-application.service'
import { VendorApplicationStatus } from '@prisma/client'

async function runLifecycleTest() {
  console.log('--- Testing Vendor Application Lifecycle ---')

  const testTaxId = '9999999999999'
  const storeName = 'ร้านเทสต์คู่ค้า แอร์แอนด์เซอร์วิส'

  // Clean up any previous test leftovers (including vendor entities from failed runs)
  const staleParents = await prisma.vendorParent.findMany({ where: { name: storeName }, include: { centers: true } })
  const staleCenterIds = staleParents.flatMap(p => p.centers.map(c => c.id))
  await prisma.user.deleteMany({ where: { vendorCenterId: { in: staleCenterIds } } })
  await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: staleCenterIds } } })
  await prisma.vendorCenter.deleteMany({ where: { id: { in: staleCenterIds } } })
  await prisma.vendorParent.deleteMany({ where: { id: { in: staleParents.map(p => p.id) } } })
  await prisma.vendorApplication.deleteMany({ where: { taxId: testTaxId } })

  // 1. Submit Application
  const testInput = {
    store: {
      name: storeName,
      type: 'บริษัทจำกัด' as const,
      taxId: testTaxId,
      phone: '0899999999',
      email: 'vendor-test@example.com',
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

  // 3. Approve Application — with an existing route on the covered branch, the new route must be appended (backup)
  const site = await prisma.site.findFirst({ where: { OR: [{ code: 'BAP' }, { nickname: 'BAP' }] } })
  const fixtureRoute = site ? await prisma.branchVendorRoute.create({ data: { branchId: site.id, priority: 1 } }) : null
  const maxBefore = site
    ? (await prisma.branchVendorRoute.aggregate({ where: { branchId: site.id }, _max: { priority: true } }))._max.priority ?? 0
    : 0

  const { application: approvedApp, credentials } = await approveVendorApplication(app.id, 'admin-tester')
  console.log('✔ 3. Application approved, approvedParentId:', approvedApp.approvedParentId)

  if (site && fixtureRoute) {
    const centers = await prisma.vendorCenter.findMany({ where: { vendorParentId: approvedApp.approvedParentId! } })
    const newRoute = await prisma.branchVendorRoute.findFirst({ where: { branchId: site.id, primaryCenterId: { in: centers.map(c => c.id) } } })
    await prisma.branchVendorRoute.delete({ where: { id: fixtureRoute.id } })
    if (!newRoute) throw new Error('Expected a route for the covered branch')
    if (newRoute.priority !== maxBefore + 1) throw new Error(`Expected appended priority ${maxBefore + 1}, got ${newRoute.priority}`)
    console.log(`✔ 3b. New vendor route appended as backup (priority ${newRoute.priority})`)
  }

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

  // 4b. Decision is final: re-approve and reject-after-approve must both fail, without duplicating routes
  const routesBefore = await prisma.branchVendorRoute.count({ where: { primaryCenterId: { in: parent.centers.map(c => c.id) } } })
  let reApproveFailed = false
  try { await approveVendorApplication(app.id, 'admin-tester') } catch { reApproveFailed = true }
  if (!reApproveFailed) throw new Error('Expected re-approval of an APPROVED application to fail')
  let rejectFailed = false
  try { await rejectVendorApplication(app.id, 'late reject', 'admin-tester') } catch { rejectFailed = true }
  if (!rejectFailed) throw new Error('Expected reject of an APPROVED application to fail')
  const routesAfter = await prisma.branchVendorRoute.count({ where: { primaryCenterId: { in: parent.centers.map(c => c.id) } } })
  if (routesAfter !== routesBefore) throw new Error(`Route rows duplicated: ${routesBefore} → ${routesAfter}`)
  console.log('✔ 4b. Double decision correctly blocked, no duplicate routes')

  // 4c. VD login created in the same transaction: role VD, linked to first center, password hashed
  const vdUser = await prisma.user.findUnique({ where: { username: credentials.username } })
  if (!vdUser) throw new Error('VD user was not created on approval')
  if (vdUser.role !== 'VD') throw new Error(`Expected role VD, got ${vdUser.role}`)
  if (vdUser.vendorCenterId !== parent.centers[0].id) throw new Error('VD user must be linked to the first center')
  if (vdUser.password === credentials.tempPassword || !vdUser.password.startsWith('$2')) throw new Error('Password must be stored as a bcrypt hash')
  if (!vdUser.mustChangePassword) throw new Error('New VD user must be forced to change the temporary password')
  console.log('✔ 4c. VD user created with hashed password:', vdUser.username)

  // 5. Cleanup test data
  await prisma.user.deleteMany({ where: { vendorCenterId: { in: parent.centers.map(c => c.id) } } })
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
