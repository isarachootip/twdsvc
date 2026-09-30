/**
 * Tier 1: Admin Full Access Integration Suite
 * Rigorous empirical verification of requirements R1, R2, R3 for ADMIN user:
 * 1. R1: Full Route Access & Menus - all 11 system navigation menus, full write permission, all page paths authorized.
 * 2. R2: Interactive Actions & Permission Overrides - unrestricted jobScope, state machine transitions succeed for ADMIN across all role queues.
 * 3. R3: Branch & Vendor Center Fallbacks - fallback branch logic, stock creation branch overrides, and queue filtering.
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { MENU_DEFS } from '../../../src/lib/constants'
import { menusForRole, canWriteMenu } from '../../../src/lib/menus'
import { jobScope } from '../../../src/lib/api'
import { QUEUES } from '../../../src/lib/queues'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'
import { prisma } from '../../../src/lib/db'
import { signAccessToken, runWithAuthToken } from '../../../src/lib/auth'
import { NextRequest } from 'next/server'
import { POST as createJobRoute } from '../../../src/app/api/jobs/route'
import { POST as createStockJobRoute } from '../../../src/app/api/jobs/stock/route'
import { POST as executeActionRoute } from '../../../src/app/api/jobs/[id]/action/route'
import { GET as getJobRoute } from '../../../src/app/api/jobs/[id]/route'
import { GET as getCsQueueRoute } from '../../../src/app/api/queues/CS/route'
import { GET as getGrQueueRoute } from '../../../src/app/api/queues/GR/route'
import { GET as getDcQueueRoute } from '../../../src/app/api/queues/DC/route'
import { GET as getVdQueueRoute } from '../../../src/app/api/queues/VD/route'
import { GET as getAdminQueueRoute } from '../../../src/app/api/queues/ADMIN/route'
import { GET as getTradeInRoute, POST as createTradeInRoute } from '../../../src/app/api/tradein/route'
import { GET as getTradeInKpisRoute } from '../../../src/app/api/tradein/kpis/route'
import { GET as getAdminFeesRoute } from '../../../src/app/api/admin/fees/route'
import { GET as getAdminPayoutRoute } from '../../../src/app/api/admin/payout-config/route'
import { GET as getAdminPromotionsRoute } from '../../../src/app/api/admin/promotions/route'
import { GET as getAdminRbacRoute } from '../../../src/app/api/admin/rbac/route'
import { GET as getAdminRoutesRoute } from '../../../src/app/api/admin/routes/route'
import { GET as getAdminSettingsRoute } from '../../../src/app/api/admin/settings/route'
import { GET as getAdminSitesRoute } from '../../../src/app/api/admin/sites/route'
import { GET as getAdminSlaRoute } from '../../../src/app/api/admin/sla/route'
import { GET as getAdminUsersRoute } from '../../../src/app/api/admin/users/route'
import { GET as getAdminVendorsRoute } from '../../../src/app/api/admin/vendors/route'
import { POST as submitQuoteRoute, GET as getQuoteRoute } from '../../../src/app/api/jobs/[id]/quote/route'
import { PATCH as patchJobRoute } from '../../../src/app/api/jobs/[id]/route'
import { POST as createPaymentLinkRoute } from '../../../src/app/api/jobs/[id]/payment-link/route'
import { GET as getJobByNoRoute } from '../../../src/app/api/jobs/by-no/[jobNo]/route'
import { POST as previewFeesRoute } from '../../../src/app/api/jobs/preview-fees/route'
import { GET as lookupCustomerRoute } from '../../../src/app/api/customers/lookup/route'
import { GET as getExecutiveReportRoute } from '../../../src/app/api/reports/executive/route'
import { GET as getOverviewReportRoute } from '../../../src/app/api/reports/overview/route'
import { GET as getVdPaymentReportRoute } from '../../../src/app/api/reports/vd-payment/route'
import { GET as getMeRoute } from '../../../src/app/api/me/route'
import { GET as getSitesRoute } from '../../../src/app/api/sites/route'
import { GET as getVendorCentersRoute } from '../../../src/app/api/vendor-centers/route'
import { GET as getPromotionsRoute } from '../../../src/app/api/promotions/route'

setTier('Tier 1')

describe('Admin Full Access & Operational Flow Integration (R1, R2, R3)', () => {
  it('API-T00: ADMIN session token successfully signs and verifies against database', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { username: 'test_am' } })
    const token = await signAccessToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      siteId: user.siteId,
      vendorCenterId: user.vendorCenterId,
    })
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(50)
  })
  const adminUser = createMockUser({
    role: 'ADMIN',
    username: 'test_am',
    fullName: 'Test Admin User',
    siteId: undefined,
    vendorCenterId: undefined,
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // R1: Complete Route Access & Navigation Visibility for Admin
  // ─────────────────────────────────────────────────────────────────────────────

  it('R1-T01: ADMIN role has navigation access to all 11 system navigation menus in MENU_DEFS', async () => {
    const adminMenus = await menusForRole('ADMIN')
    const allExpectedKeys = MENU_DEFS.map((m) => m.key)

    expect(adminMenus.length).toBe(allExpectedKeys.length)
    for (const key of allExpectedKeys) {
      expect(adminMenus).toContain(key)
    }
  })

  it('R1-T02: ADMIN role has canWriteMenu=true for every registered menu item', async () => {
    for (const def of MENU_DEFS) {
      const canWrite = await canWriteMenu('ADMIN', def.key)
      expect(canWrite).toBe(true)
    }
  })

  it('R1-T03: RBAC menu matrix authorizes ADMIN on all 11 operational and admin screens', () => {
    const adminRoles = SPEC_ORACLE.RBAC_MENU_MATRIX.ADMIN
    expect(adminRoles.length).toBe(11)
    expect(adminRoles).toContain('exec')
    expect(adminRoles).toContain('analytics')
    expect(adminRoles).toContain('jobs')
    expect(adminRoles).toContain('cs')
    expect(adminRoles).toContain('gr')
    expect(adminRoles).toContain('dc')
    expect(adminRoles).toContain('vd')
    expect(adminRoles).toContain('tradein')
    expect(adminRoles).toContain('s2')
    expect(adminRoles).toContain('vd_payment')
    expect(adminRoles).toContain('admin')
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // R2: Interactive Actions & Permission Overrides across All Role Queues
  // ─────────────────────────────────────────────────────────────────────────────

  it('R2-T01: jobScope returns unrestricted empty scope ({}) for ADMIN user with null siteId and vendorCenterId', async () => {
    const scope = await jobScope({
      id: 'usr-admin-1',
      username: 'test_am',
      fullName: 'Test Admin',
      role: 'ADMIN',
      siteId: null,
      vendorCenterId: null,
    })

    expect(Object.keys(scope).length).toBe(0)
  })

  it('R2-T02: QUEUES definitions for GR, DC, VD, CS, and ADMIN all explicitly authorize ADMIN', () => {
    expect(QUEUES.GR.roles).toContain('ADMIN')
    expect(QUEUES.DC.roles).toContain('ADMIN')
    expect(QUEUES.VD.roles).toContain('ADMIN')
    expect(QUEUES.CS.roles).toContain('ADMIN')
    expect(QUEUES.ADMIN.roles).toContain('ADMIN')
  })

  it('R2-T03: ADMIN seamlessly executes end-to-end standard repair lifecycle across CS, GR, DC, VD queues', () => {
    let job = createMockJob({
      stage: 'CS_OPENED',
      channel: 'DC',
      hasWarranty: false,
      charges: [{ type: 'OPERATION_FEE', amountSatang: 15000 }],
      payments: [{ amountSatang: 15000, status: 'PAID', method: 'PROMPTPAY_QR' }],
    })

    // 1. GR receives from CS (Admin actor)
    const r1 = simulateAction(job, 'gr_receive', adminUser, { location: 'A-01-01', photos: ['p1.jpg'] })
    expect(r1.success).toBe(true)
    job = r1.job!
    expect(job.stage).toBe('GR_RECEIVED')

    // 2. GR packs (Admin actor)
    const r2 = simulateAction(job, 'gr_pack', adminUser, { location: 'A-01-02', photos: ['label.jpg'] })
    expect(r2.success).toBe(true)
    job = r2.job!
    expect(job.stage).toBe('GR_PACKED')

    // 3. DC dispatches vehicle and GR hands off to carrier (Admin actor)
    const rDisp = simulateAction(job, 'dispatch_pickup', adminUser, { method: 'PRINT' })
    expect(rDisp.success).toBe(true)
    job = rDisp.job!

    const r3 = simulateAction(job, 'gr_handoff', adminUser, { photos: ['truck.jpg'] })
    expect(r3.success).toBe(true)
    job = r3.job!
    expect(job.stage).toBe('OUTBOUND_TO_DC')

    // 4. DC receives at warehouse (Admin actor)
    const r4 = simulateAction(job, 'dc_receive_outbound', adminUser, { location: 'DC-01-A' })
    expect(r4.success).toBe(true)
    job = r4.job!
    expect(job.stage).toBe('AT_DC_OUTBOUND')

    // 5. DC hands off to VD (Admin actor)
    const r5 = simulateAction(job, 'dc_handoff_vd', adminUser, { photos: ['dc_vd.jpg'] })
    expect(r5.success).toBe(true)
    job = r5.job!
    expect(job.stage).toBe('OUTBOUND_TO_VD')

    // 6. VD receives at service center (Admin actor)
    const r6 = simulateAction(job, 'vd_receive', adminUser)
    expect(r6.success).toBe(true)
    job = r6.job!
    expect(job.stage).toBe('VD_INSPECTING')

    // 7. VD submits quote (Admin actor)
    const r7 = simulateAction(job, 'vd_submit_quote', adminUser, {
      repairDays: 5,
      lines: [
        { unitPriceSatang: 100000, quantity: 1 },
        { unitPriceSatang: 50000, quantity: 1 },
      ],
    })
    expect(r7.success).toBe(true)
    job = r7.job!
    expect(job.stage).toBe('WAITING_APPROVAL')

    // 8. Admin approves quotation (Admin actor)
    const r8 = simulateAction(job, 'customer_approve', adminUser, { decision: 'approve' })
    expect(r8.success).toBe(true)
    job = r8.job!
    expect(job.stage).toBe('REPAIRING')

    // 9. VD completes repair (Admin actor)
    const r9 = simulateAction(job, 'vd_finish_repair', adminUser)
    expect(r9.success).toBe(true)
    job = r9.job!
    expect(job.stage).toBe('RETURN_PACKING')

    // 10. VD packs and sends back to DC (Admin actor)
    const r10 = simulateAction(job, 'vd_return_pack', adminUser, { photos: ['return_pack.jpg'] })
    expect(r10.success).toBe(true)
    job = r10.job!
    expect(job.stage).toBe('INBOUND_TO_DC')

    // 11. DC receives inbound return (Admin actor)
    const r11 = simulateAction(job, 'dc_receive_inbound', adminUser, { photos: ['dc_return.jpg'] })
    expect(r11.success).toBe(true)
    job = r11.job!
    expect(job.stage).toBe('AT_DC_INBOUND')

    // 12. DC dispatches back to branch (Admin actor)
    const r12 = simulateAction(job, 'dc_dispatch_confirm', adminUser)
    expect(r12.success).toBe(true)
    job = r12.job!
    expect(job.stage).toBe('INBOUND_TO_BRANCH')

    // 13. GR receives at branch (Admin actor)
    const r13 = simulateAction(job, 'gr_receive_return', adminUser, { location: 'R-01-01', photos: ['gr_ret.jpg'] })
    expect(r13.success).toBe(true)
    job = r13.job!
    expect(job.stage).toBe('GR_RETURN_RECEIVED')

    // 14. GR delivers to CS counter (Admin actor)
    const r14 = simulateAction(job, 'gr_deliver_cs', adminUser, { photos: ['to_cs.jpg'] })
    expect(r14.success).toBe(true)
    job = r14.job!
    expect(job.stage).toBe('READY_FOR_PICKUP')

    // 15. Record repair payment (160500 - 15000 opFee credit = 145500 satang)
    const rPay = simulateAction(job, 'record_repair_payment', adminUser, {
      amountSatang: 145500,
      paymentMethod: 'PROMPTPAY_QR',
    })
    expect(rPay.success).toBe(true)
    job = rPay.job!

    // 16. CS delivers to customer / closes job (Admin actor)
    const r16 = simulateAction(job, 'cs_close', adminUser)
    expect(r16.success).toBe(true)
    job = r16.job!
    expect(job.stage).toBe('CLOSED_REPAIRED')
  })

  it('R2-T04: ADMIN can handle quotation rejection and direct inbound return flow', () => {
    const job = createMockJob({
      stage: 'WAITING_APPROVAL',
      channel: 'DC',
      hasWarranty: false,
    })

    const res = simulateAction(job, 'customer_reject', adminUser, { decision: 'reject' })
    expect(res.success).toBe(true)
    expect(res.job?.stage).toBe('RETURN_PACKING')
    expect(res.job?.decision).toBe('REJECTED')
  })

  it('R2-T05: ADMIN can pause and resume SLA for waiting parts in VD queue', () => {
    const job = createMockJob({
      stage: 'REPAIRING',
      channel: 'DSD',
      slaClocks: [
        {
          stepCode: 'VD_REPAIR',
          status: 'RUNNING',
          startedAt: new Date(),
          dueAt: new Date(Date.now() + 24 * 3600000),
          pausedMinutes: 0,
          stoppedAt: null,
        },
      ],
    })

    // Pause SLA (Admin actor)
    const rPause = simulateAction(job, 'vd_pause_parts', adminUser, { reason: 'Waiting for parts' })
    expect(rPause.success).toBe(true)
    const clockPaused = rPause.job?.slaClocks.find((c) => c.stepCode === 'VD_REPAIR')
    expect(clockPaused?.status).toBe('PAUSED')

    // Resume SLA (Admin actor)
    const rResume = simulateAction(rPause.job!, 'vd_resume_parts', adminUser, { pauseDurationMs: 3600000 })
    expect(rResume.success).toBe(true)
    const clockResumed = rResume.job?.slaClocks.find((c) => c.stepCode === 'VD_REPAIR')
    expect(clockResumed?.status).toBe('RUNNING')
    expect(clockResumed?.pausedMinutes).toBe(60)
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // R3: Branch & Vendor Center Context Fallback & S2 Stock Management
  // ─────────────────────────────────────────────────────────────────────────────

  it('R3-T01: ADMIN can execute S2 branch stock repair workflow without customer quotation or payment gate', () => {
    let stockJob = createMockJob({
      type: 'STOCK',
      stage: 'VD_INSPECTING',
      customerName: 'Branch Stock',
      channel: 'DC',
      charges: [],
      payments: [],
    })

    // Stock repair starts directly without quote (Admin actor)
    const rStart = simulateAction(stockJob, 'vd_start_repair', adminUser)
    expect(rStart.success).toBe(true)
    stockJob = rStart.job!
    expect(stockJob.stage).toBe('REPAIRING')

    // Complete repair (Admin actor)
    const rFinish = simulateAction(stockJob, 'vd_finish_repair', adminUser)
    expect(rFinish.success).toBe(true)
    stockJob = rFinish.job!
    expect(stockJob.stage).toBe('RETURN_PACKING')

    // Pack for return (Admin actor)
    const rPack = simulateAction(stockJob, 'vd_return_pack', adminUser, { photos: ['stk_pack.jpg'] })
    expect(rPack.success).toBe(true)
    stockJob = rPack.job!
    expect(stockJob.stage).toBe('INBOUND_TO_DC')

    // DC receives and dispatches (Admin actor)
    const rDcRec = simulateAction(stockJob, 'dc_receive_inbound', adminUser, { photos: ['p.jpg'] })
    expect(rDcRec.success).toBe(true)
    stockJob = rDcRec.job!

    const rDcDisp = simulateAction(stockJob, 'dc_dispatch_confirm', adminUser)
    expect(rDcDisp.success).toBe(true)
    stockJob = rDcDisp.job!
    expect(stockJob.stage).toBe('INBOUND_TO_BRANCH')

    // GR receives return and delivers to CS / staging (Admin actor)
    const rGrRec = simulateAction(stockJob, 'gr_receive_return', adminUser, { location: 'S-RET-01', photos: ['p.jpg'] })
    expect(rGrRec.success).toBe(true)
    stockJob = rGrRec.job!

    const rGrDeliv = simulateAction(stockJob, 'gr_deliver_cs', adminUser, { photos: ['p.jpg'] })
    expect(rGrDeliv.success).toBe(true)
    stockJob = rGrDeliv.job!
    expect(stockJob.stage).toBe('READY_FOR_PICKUP')

    // Close stock job directly (Admin actor) without payment
    const rClose = simulateAction(stockJob, 'cs_close', adminUser)
    expect(rClose.success).toBe(true)
    stockJob = rClose.job!
    expect(stockJob.stage).toBe('CLOSED_REPAIRED')
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // R4: Live Database Automated API Route Integration Tests (ADMIN Session Token)
  // ─────────────────────────────────────────────────────────────────────────────

  async function getAdminToken() {
    const user = await prisma.user.findUniqueOrThrow({ where: { username: 'test_am' } })
    return await signAccessToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      siteId: user.siteId,
      vendorCenterId: user.vendorCenterId,
    })
  }

  it('API-T01: Accessing /api/queues/CS, /api/queues/GR, /api/queues/DC, /api/queues/VD, /api/queues/ADMIN with ADMIN session token returns 200 and full tabs structure', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const csRes = await getCsQueueRoute(new Request('http://localhost:3000/api/queues/CS'))
      expect(csRes.status).toBe(200)
      const csData = await csRes.json()
      expect(csData.tabs).toBeDefined()
      expect(Array.isArray(csData.tabs.pickup)).toBe(true)

      const grRes = await getGrQueueRoute(new Request('http://localhost:3000/api/queues/GR'))
      expect(grRes.status).toBe(200)
      const grData = await grRes.json()
      expect(grData.tabs).toBeDefined()
      expect(Array.isArray(grData.tabs.receive)).toBe(true)

      const dcRes = await getDcQueueRoute(new Request('http://localhost:3000/api/queues/DC'))
      expect(dcRes.status).toBe(200)
      const dcData = await dcRes.json()
      expect(dcData.tabs).toBeDefined()

      const vdRes = await getVdQueueRoute(new Request('http://localhost:3000/api/queues/VD'))
      expect(vdRes.status).toBe(200)
      const vdData = await vdRes.json()
      expect(vdData.tabs).toBeDefined()

      const adminRes = await getAdminQueueRoute(new Request('http://localhost:3000/api/queues/ADMIN'))
      expect(adminRes.status).toBe(200)
      const adminData = await adminRes.json()
      expect(adminData.tabs).toBeDefined()
    })
  })

  it('API-T02: ADMIN can query queues with branchId and vendorCenterId search parameters', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const branch = await prisma.site.findFirstOrThrow({ where: { type: 'BRANCH' } })
      const filteredCs = await getCsQueueRoute(new Request(`http://localhost:3000/api/queues/CS?branchId=${branch.id}`))
      expect(filteredCs.status).toBe(200)
      const csData = await filteredCs.json()
      expect(csData.tabs).toBeDefined()

      const vc = await prisma.vendorCenter.findFirstOrThrow()
      const filteredVd = await getVdQueueRoute(new Request(`http://localhost:3000/api/queues/VD?vendorCenterId=${vc.id}`))
      expect(filteredVd.status).toBe(200)
      const vdData = await filteredVd.json()
      expect(vdData.tabs).toBeDefined()
    })
  })

  it('API-T03: Creating a job (POST /api/jobs) with selected branchId persists the exact branchId', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const branch = await prisma.site.findFirstOrThrow({ where: { code: 'SK' } })
      const brand = await prisma.brand.findFirstOrThrow()
      const size = await prisma.sizeCategory.findFirstOrThrow()

      const req = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: branch.id,
          customerName: 'สมชาย ทดสอบแอดมิน',
          customerPhone: '0812345678',
          productName: 'สว่านโรตารี่ทดสอบ',
          brandId: brand.id,
          brandName: brand.name,
          symptom: 'เปิดไม่ติด ไฟไม่เข้า',
          sizeCategoryId: size.id,
          hasWarranty: true,
          shippingMethod: 'STANDARD',
        }),
      })

      const res = await createJobRoute(req)
      const data = await res.json()
      if (res.status !== 201) console.log('API-T03 ERR:', res.status, data)
      expect(res.status).toBe(201)
      expect(data.jobNo).toBeDefined()

      const saved = await prisma.job.findUniqueOrThrow({ where: { id: data.id } })
      expect(saved.branchId).toBe(branch.id)
      expect(saved.createdBy).toBe('test_am')
    })
  })

  it('API-T04: Creating a job (POST /api/jobs) without branchId automatically falls back to default active branch', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const brand = await prisma.brand.findFirstOrThrow()
      const size = await prisma.sizeCategory.findFirstOrThrow()

      const req = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'สมหญิง ทดสอบโฟลว์แอดมิน',
          customerPhone: '0898765432',
          productName: 'ปั๊มน้ำทดสอบ',
          brandId: brand.id,
          brandName: brand.name,
          symptom: 'น้ำรั่วซึม',
          sizeCategoryId: size.id,
          hasWarranty: false,
          shippingMethod: 'STANDARD',
        }),
      })

      const res = await createJobRoute(req)
      expect(res.status).toBe(201)
      const data = await res.json()
      const saved = await prisma.job.findUniqueOrThrow({ where: { id: data.id } })
      expect(saved.branchId).toBeDefined()
      expect(saved.branchId.length).toBeGreaterThan(0)
    })
  })

  it('API-T05: Creating an S2 stock job (POST /api/jobs/stock) as ADMIN when multiple branches exist persists selected branchId', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const skBranch = await prisma.site.findFirstOrThrow({ where: { code: 'SK' } })
      const vc = await prisma.vendorCenter.findFirstOrThrow()

      const req = new NextRequest('http://localhost:3000/api/jobs/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: skBranch.id,
          vendorCenterId: vc.id,
          receiverName: 'ช่างสมหมาย VD',
          channel: 'DC',
          items: [
            { sku: 'STK-001', productName: 'หินเจียรสต็อก', quantity: 2, holdStockNo: 'HOLD-101', symptom: 'สวิตช์เสีย' },
          ],
        }),
      })

      const res = await createStockJobRoute(req)
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.jobNo).toBeDefined()
      expect(data.branchId).toBe(skBranch.id)

      const saved = await prisma.job.findUniqueOrThrow({ where: { id: data.id } })
      expect(saved.branchId).toBe(skBranch.id)
      expect(saved.type).toBe('STOCK')
    })
  })

  it('API-T06: ADMIN seamlessly executes end-to-end repair lifecycle and approves quotation on customer behalf via POST /api/jobs/[id]/action', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const branch = await prisma.site.findFirstOrThrow({ where: { code: 'BN' } })
      const brand = await prisma.brand.findFirstOrThrow()
      const size = await prisma.sizeCategory.findFirstOrThrow()

      const createReq = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: branch.id,
          customerName: 'ลูกค้าทดสอบ ทรานสิชัน',
          customerPhone: '0822223333',
          productName: 'เครื่องเจาะคอนกรีต',
          brandId: brand.id,
          brandName: brand.name,
          symptom: 'หัวสว่านติดขัด',
          sizeCategoryId: size.id,
          hasWarranty: true,
          shippingMethod: 'STANDARD',
        }),
      })
      const createRes = await createJobRoute(createReq)
      const job = await createRes.json()
      const jobId = job.id

      async function step(name: string, act: string, body: any = {}) {
        const r = await executeActionRoute(
          new NextRequest(`http://localhost:3000/api/jobs/${jobId}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: act, ...body }),
          }),
          { params: Promise.resolve({ id: jobId }) }
        )
        const d = await r.json()
        if (r.status !== 200) {
          throw new Error(`Step [${name}] failed with status ${r.status}: ${JSON.stringify(d)}`)
        }
        return d
      }

      // 1. GR receives from CS
      await step('gr_receive', 'gr_receive', { location: 'A-01-01', photos: [{ fileUrl: 'https://example.com/p1.jpg' }] })

      // 2. GR packs
      await step('gr_pack', 'gr_pack', { location: 'A-01-02', photos: [{ fileUrl: 'https://example.com/p2.jpg' }] })

      // 3. DC dispatches pickup
      await step('dispatch_pickup', 'dispatch_pickup', { method: 'PRINT' })

      // 4. GR hands off to carrier
      await step('gr_handoff', 'gr_handoff', { photos: [{ fileUrl: 'https://example.com/p3.jpg' }] })

      // 5. DC receives outbound at warehouse
      await step('dc_receive_outbound', 'dc_receive_outbound', { location: 'DC-01-A' })

      // 5.1. Dispatch pickup truck for VD (leg: DC_TO_VD)
      await step('dispatch_pickup_vd', 'dispatch_pickup', { method: 'PRINT' })

      // 6. DC hands off to VD
      await step('dc_handoff_vd', 'dc_handoff_vd', { photos: [{ fileUrl: 'https://example.com/p4.jpg' }] })

      // 7. VD receives
      await step('vd_receive', 'vd_receive')

      // 8. VD submits quotation
      await step('vd_submit_quote', 'vd_submit_quote', {
        repairDays: 3,
        lines: [{ type: 'PART', description: 'เปลี่ยนสวิตช์และสายไฟ', unitPrice: 350, quantity: 1 }],
      })

      // 9. ADMIN invokes customer_approve directly on behalf of customer!
      const afterApprove = await step('customer_approve', 'customer_approve', { decision: 'approve' })
      expect(afterApprove.stage).toBe('REPAIRING')

      // 10. VD finishes repair
      await step('vd_finish_repair', 'vd_finish_repair')

      // 11. VD returns and packs
      await step('vd_return_pack', 'vd_return_pack', { photos: [{ fileUrl: 'https://example.com/p5.jpg' }] })

      // 12. DC receives inbound
      await step('dc_receive_inbound', 'dc_receive_inbound', { photos: [{ fileUrl: 'https://example.com/p6.jpg' }] })

      // 12.1. Dispatch return truck back to branch (leg: DC_TO_BRANCH)
      await step('dispatch_pickup_branch', 'dispatch_pickup', { method: 'PRINT' })

      // 13. DC dispatches back to branch
      await step('dc_dispatch_confirm', 'dc_dispatch_confirm')

      // 14. GR receives return at branch
      await step('gr_receive_return', 'gr_receive_return', { location: 'A-01-03', photos: [{ fileUrl: 'https://example.com/p7.jpg' }] })

      // 15. GR delivers to CS
      await step('gr_deliver_cs', 'gr_deliver_cs', { photos: [{ fileUrl: 'https://example.com/p8.jpg' }] })

      // 15.1. Record repair payment for outstanding balance (ADMIN can record payment)
      await step('record_repair_payment', 'record_repair_payment', { paymentMethod: 'PROMPTPAY_QR' })

      // 16. CS close
      const finalJob = await step('cs_close', 'cs_close', { pickupOption: 'REPAIRED' })
      expect(finalJob.stage).toBe('CLOSED_REPAIRED')
    })
  })

  it('API-T07: Live navigation to /vd/jobs/[id]/quote endpoint GET /api/jobs/[id] succeeds for ADMIN with full view without 403', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const anyJob = await prisma.job.findFirstOrThrow()
      const req = new NextRequest(`http://localhost:3000/api/jobs/${anyJob.id}`)
      const res = await getJobRoute(req, { params: Promise.resolve({ id: anyJob.id }) })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(anyJob.id)
      expect(data.jobNo).toBe(anyJob.jobNo)
    })
  })

  it('API-T08: ADMIN can reject quotation via POST /api/jobs/[id]/action (customer_reject)', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const branch = await prisma.site.findFirstOrThrow({ where: { code: 'BN' } })
      const brand = await prisma.brand.findFirstOrThrow()
      const size = await prisma.sizeCategory.findFirstOrThrow()

      const createReq = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: branch.id,
          customerName: 'ลูกค้าทดสอบ ปฏิเสธราคา',
          customerPhone: '0833334444',
          productName: 'เครื่องตัดหญ้า',
          brandId: brand.id,
          brandName: brand.name,
          symptom: 'เครื่องดับ',
          sizeCategoryId: size.id,
          hasWarranty: false,
          shippingMethod: 'STANDARD',
        }),
      })
      const createRes = await createJobRoute(createReq)
      const job = await createRes.json()
      const jobId = job.id

      // Fast-forward to VD_INSPECTING
      const vc = await prisma.vendorCenter.findFirstOrThrow()
      await prisma.job.update({ where: { id: jobId }, data: { stage: 'VD_INSPECTING', vendorCenterId: vc.id } })

      // Submit quotation first
      const quoteReq = new NextRequest(`http://localhost:3000/api/jobs/${jobId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vd_submit_quote',
          repairDays: 5,
          lines: [{ type: 'PART', description: 'เปลี่ยนมอเตอร์', unitPrice: 2500, quantity: 1 }],
        }),
      })
      const quoteRes = await executeActionRoute(quoteReq, { params: Promise.resolve({ id: jobId }) })
      expect(quoteRes.status).toBe(200)

      // Admin executes customer_reject on behalf of customer!
      const actReq = new NextRequest(`http://localhost:3000/api/jobs/${jobId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'customer_reject', decision: 'reject', reason: 'ราคาแพงเกินไป' }),
      })
      const res = await executeActionRoute(actReq, { params: Promise.resolve({ id: jobId }) })
      const data = await res.json()
      if (res.status !== 200) {
        throw new Error(`API-T08 customer_reject failed with status ${res.status}: ${JSON.stringify(data)}`)
      }
      expect(res.status).toBe(200)
      expect(data.stage).toBe('RETURN_PACKING')
    })
  })

  it('API-T09: S2 Stock repair workflow execution via POST /api/jobs/[id]/action by ADMIN (cs_close directly without payment)', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const skBranch = await prisma.site.findFirstOrThrow({ where: { code: 'SK' } })
      const vc = await prisma.vendorCenter.findFirstOrThrow()

      const stockReq = new NextRequest('http://localhost:3000/api/jobs/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: skBranch.id,
          vendorCenterId: vc.id,
          receiverName: 'ช่างสมหมาย S2',
          channel: 'DC',
          items: [{ sku: 'STK-009', productName: 'ปั๊มแช่สต็อก', quantity: 1, symptom: 'ใบพัดล็อค' }],
        }),
      })
      const stockRes = await createStockJobRoute(stockReq)
      const stockJob = await stockRes.json()
      const jobId = stockJob.id

      await prisma.job.update({ where: { id: jobId }, data: { stage: 'READY_FOR_PICKUP' } })

      const closeReq = new NextRequest(`http://localhost:3000/api/jobs/${jobId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cs_close' }),
      })
      const closeRes = await executeActionRoute(closeReq, { params: Promise.resolve({ id: jobId }) })
      expect(closeRes.status).toBe(200)
      const closedJob = await closeRes.json()
      expect(closedJob.stage).toBe('CLOSED_REPAIRED')
    })
  })

  it('API-T10: ADMIN queries DC queue with branchId parameter and isolates jobs by branch', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const branch = await prisma.site.findFirstOrThrow({ where: { type: 'BRANCH' } })
      const dcReq = new NextRequest(`http://localhost:3000/api/queues/DC?branchId=${branch.id}`, {
        headers: { authorization: `Bearer ${token}` },
      })
      const res = await getDcQueueRoute(dcReq)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.tabs).toBeDefined()
      expect(Array.isArray(data.tabs.pickup)).toBe(true)
      for (const j of data.tabs.pickup) {
        expect(j.branch.id).toBe(branch.id)
      }
    })
  })

  it('API-T11: ADMIN accesses /api/tradein and /api/tradein/kpis with and without branchId filter', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const branch = await prisma.site.findFirstOrThrow({ where: { type: 'BRANCH' } })

      // GET /api/tradein without filter
      const listReq = new NextRequest('http://localhost:3000/api/tradein', {
        headers: { authorization: `Bearer ${token}` },
      })
      const listRes = await getTradeInRoute(listReq)
      expect(listRes.status).toBe(200)
      const listData = await listRes.json()
      expect(Array.isArray(listData)).toBe(true)

      // GET /api/tradein with branchId filter
      const filteredReq = new NextRequest(`http://localhost:3000/api/tradein?branchId=${branch.id}`, {
        headers: { authorization: `Bearer ${token}` },
      })
      const filteredRes = await getTradeInRoute(filteredReq)
      expect(filteredRes.status).toBe(200)

      // GET /api/tradein/kpis with branchId
      const kpisReq = new NextRequest(`http://localhost:3000/api/tradein/kpis?branchId=${branch.id}`, {
        headers: { authorization: `Bearer ${token}` },
      })
      const kpisRes = await getTradeInKpisRoute(kpisReq)
      expect(kpisRes.status).toBe(200)
      const kpisData = await kpisRes.json()
      expect(typeof kpisData.total).toBe('number')
      expect(typeof kpisData.used).toBe('number')
      expect(typeof kpisData.conversion).toBe('number')
    })
  })

  it('API-T12: ADMIN creates a Trade-in coupon (POST /api/tradein) with Bearer token authentication', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const req = new NextRequest('http://localhost:3000/api/tradein', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'TYPE1',
          customerName: 'สมปอง ทดสอบเทรดอิน',
          customerPhone: '0819998877',
          productName: 'สว่านไร้สายเครื่องเก่า',
          brandName: 'MAKITA',
          discountPct: 10,
          symptom: 'มอเตอร์เสีย ซ่อมไม่คุ้ม',
        }),
      })
      const res = await createTradeInRoute(req)
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.tradeInNo).toMatch(/^TI-\d{4}-\d{5}$/)
      expect(data.customerName).toBe('สมปอง ทดสอบเทรดอิน')
      expect(data.status).toBe('ISSUED')
      expect(data.discountPct).toBe(10)

      // Verify persisted in DB
      const dbRecord = await prisma.tradeIn.findUnique({ where: { tradeInNo: data.tradeInNo } })
      expect(dbRecord).not.toBeNull()
      expect(dbRecord?.createdBy).toBe('test_am')
    })
  })

  it('API-T13: ADMIN accesses all 10 /api/admin/* endpoints with Bearer token authentication without 401 or 403', async () => {
    const token = await getAdminToken()
    const headers = { authorization: `Bearer ${token}` }

    const [
      feesRes,
      payoutRes,
      promotionsRes,
      rbacRes,
      routesRes,
      settingsRes,
      sitesRes,
      slaRes,
      usersRes,
      vendorsRes,
    ] = await Promise.all([
      getAdminFeesRoute(new NextRequest('http://localhost:3000/api/admin/fees', { headers })),
      getAdminPayoutRoute(new NextRequest('http://localhost:3000/api/admin/payout-config', { headers })),
      getAdminPromotionsRoute(new NextRequest('http://localhost:3000/api/admin/promotions', { headers })),
      getAdminRbacRoute(new NextRequest('http://localhost:3000/api/admin/rbac', { headers })),
      getAdminRoutesRoute(new NextRequest('http://localhost:3000/api/admin/routes', { headers })),
      getAdminSettingsRoute(new NextRequest('http://localhost:3000/api/admin/settings', { headers })),
      getAdminSitesRoute(new NextRequest('http://localhost:3000/api/admin/sites', { headers })),
      getAdminSlaRoute(new NextRequest('http://localhost:3000/api/admin/sla', { headers })),
      getAdminUsersRoute(new NextRequest('http://localhost:3000/api/admin/users', { headers })),
      getAdminVendorsRoute(new NextRequest('http://localhost:3000/api/admin/vendors', { headers })),
    ])

    expect(feesRes.status).toBe(200)
    expect(payoutRes.status).toBe(200)
    expect(promotionsRes.status).toBe(200)
    expect(rbacRes.status).toBe(200)
    expect(routesRes.status).toBe(200)
    expect(settingsRes.status).toBe(200)
    expect(sitesRes.status).toBe(200)
    expect(slaRes.status).toBe(200)
    expect(usersRes.status).toBe(200)
    expect(vendorsRes.status).toBe(200)
  })

  it('API-T14: Robustness - ADMIN job creation without branchId automatically resolves valid branch fallback', async () => {
    const token = await getAdminToken()
    await runWithAuthToken(token, async () => {
      const brand = await prisma.brand.findFirstOrThrow()
      const size = await prisma.sizeCategory.findFirstOrThrow()

      const req = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          // branchId omitted on purpose!
          customerName: 'ลูกค้าทดสอบ สาขาอัตโนมัติ',
          customerPhone: '0813334444',
          productName: 'พัดลมอุตสาหกรรม',
          brandId: brand.id,
          brandName: brand.name,
          symptom: 'สายไฟขาด',
          sizeCategoryId: size.id,
          hasWarranty: false,
          shippingMethod: 'STANDARD',
        }),
      })
      const res = await createJobRoute(req)
      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.jobNo).toMatch(/^JB-\d{4}-\d{5}$/)

      // Verify in DB that a valid branchId was assigned automatically
      const savedJob = await prisma.job.findUnique({ where: { id: data.id } })
      expect(savedJob).not.toBeNull()
      expect(typeof savedJob?.branchId).toBe('string')
      expect(savedJob?.branchId.length).toBeGreaterThan(0)
    })
  })

  it('API-T15: ADMIN submits quotation via POST /api/jobs/[id]/quote with Bearer token authentication and line items', async () => {
    const token = await getAdminToken()
    const branch = await prisma.site.findFirstOrThrow({ where: { code: 'BN' } })
    const brand = await prisma.brand.findFirstOrThrow()
    const size = await prisma.sizeCategory.findFirstOrThrow()
    const vc = await prisma.vendorCenter.findFirstOrThrow()

    // Create job and advance to VD_INSPECTING
    const job = await prisma.job.create({
      data: {
        jobNo: `JB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: 'ลูกค้าทดสอบ Quote Endpoint',
        customerPhone: '0891112222',
        productName: 'สว่านโรตารี่',
        brandId: brand.id,
        brandName: brand.name,
        sizeCategoryId: size.id,
        branchId: branch.id,
        vendorCenterId: vc.id,
        stage: 'VD_INSPECTING',
        createdBy: 'test_am',
      },
    })

    const req = new NextRequest(`http://localhost:3000/api/jobs/${job.id}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        repairDays: 4,
        vendorNote: 'ทดสอบการส่งใบเสนอราคาโดย ADMIN',
        lines: [
          { type: 'PART', description: 'เปลี่ยนหัวจับดอกสว่าน', unitPrice: 1200, quantity: 1, partWaitDays: 2, partWarrantyDays: 90 },
          { type: 'LABOR', description: 'ค่าบริการตรวจเช็คและติดตั้ง', unitPrice: 350, quantity: 1 },
          { type: 'OTHER', description: 'น้ำมันหล่อลื่นสังเคราะห์พิเศษ', unitPrice: 150, quantity: 1 },
        ],
      }),
    })

    const res = await submitQuoteRoute(req, { params: Promise.resolve({ id: job.id }) })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.quote).not.toBeNull()
    expect(data.quote.repairDays).toBe(4)
    expect(data.quote.lines.length).toBeGreaterThanOrEqual(4) // 3 user lines + 1 inspection fee

    // Verify job stage is now WAITING_APPROVAL
    const updatedJob = await prisma.job.findUniqueOrThrow({ where: { id: job.id } })
    expect(updatedJob.stage).toBe('WAITING_APPROVAL')
  })

  it('API-T16: ADMIN retrieves active quotation via GET /api/jobs/[id]/quote with Bearer token authentication', async () => {
    const token = await getAdminToken()
    const anyJobWithQuote = await prisma.quote.findFirstOrThrow({ include: { job: true } })
    const jobId = anyJobWithQuote.jobId

    const req = new NextRequest(`http://localhost:3000/api/jobs/${jobId}/quote`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    const res = await getQuoteRoute(req, { params: Promise.resolve({ id: jobId }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.quote).not.toBeNull()
    expect(data.job).not.toBeNull()
    expect(data.job.id).toBe(jobId)
    expect(Array.isArray(data.quote.lines)).toBe(true)
  })

  it('API-T17: ADMIN revises quotation via POST /api/jobs/[id]/quote creating a version 2 quotation', async () => {
    const token = await getAdminToken()
    const branch = await prisma.site.findFirstOrThrow({ where: { code: 'BN' } })
    const brand = await prisma.brand.findFirstOrThrow()
    const size = await prisma.sizeCategory.findFirstOrThrow()
    const vc = await prisma.vendorCenter.findFirstOrThrow()

    // Create job at WAITING_APPROVAL with an existing initial quote
    const job = await prisma.job.create({
      data: {
        jobNo: `JB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: 'ลูกค้าทดสอบ Revise Quote',
        customerPhone: '0892223333',
        productName: 'เครื่องเจียร์ 4 นิ้ว',
        brandId: brand.id,
        brandName: brand.name,
        sizeCategoryId: size.id,
        branchId: branch.id,
        vendorCenterId: vc.id,
        stage: 'WAITING_APPROVAL',
        createdBy: 'test_am',
      },
    })

    await prisma.quote.create({
      data: {
        jobId: job.id,
        quoteNo: `QT-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        version: 1,
        status: 'SENT',
        subtotal: 1000,
        vatAmount: 70,
        total: 1070,
        repairDays: 3,
        repairWarrantyDays: 30,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        createdBy: 'system',
      },
    })

    const req = new NextRequest(`http://localhost:3000/api/jobs/${job.id}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        revise: true,
        repairDays: 6,
        vendorNote: 'แก้ไขราคาตามที่ช่างประเมินใหม่',
        lines: [
          { type: 'PART', description: 'ชุดเฟืองขับใหม่', unitPrice: 850, quantity: 1 },
          { type: 'LABOR', description: 'ค่าแรงผ่าเครื่อง', unitPrice: 400, quantity: 1 },
        ],
      }),
    })

    const res = await submitQuoteRoute(req, { params: Promise.resolve({ id: job.id }) })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.quote.version).toBe(2)
    expect(data.quote.repairDays).toBe(6)

    // Verify old quote was marked SUPERSEDED
    const v1Quote = await prisma.quote.findFirst({ where: { jobId: job.id, version: 1 } })
    expect(v1Quote?.status).toBe('SUPERSEDED')
  })

  it('API-T18: ADMIN submits quotation with explicit vendorCenterId override linking the job to specified center', async () => {
    const token = await getAdminToken()
    const branch = await prisma.site.findFirstOrThrow({ where: { code: 'BN' } })
    const brand = await prisma.brand.findFirstOrThrow()
    const size = await prisma.sizeCategory.findFirstOrThrow()
    const centers = await prisma.vendorCenter.findMany({ include: { vendorParent: true } })
    expect(centers.length).toBeGreaterThanOrEqual(1)
    const targetCenter = centers[0]

    // Create job in VD_INSPECTING with NO initial vendorCenterId
    const job = await prisma.job.create({
      data: {
        jobNo: `JB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: 'ลูกค้าทดสอบ Explicit VendorCenter',
        customerPhone: '0894445555',
        productName: 'ปั๊มน้ำอัตโนมัติ',
        brandId: brand.id,
        brandName: brand.name,
        sizeCategoryId: size.id,
        branchId: branch.id,
        vendorCenterId: null, // intentionally null!
        stage: 'VD_INSPECTING',
        createdBy: 'test_am',
      },
    })

    const req = new NextRequest(`http://localhost:3000/api/jobs/${job.id}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vendorCenterId: targetCenter.id,
        repairDays: 5,
        lines: [{ type: 'PART', description: 'ซีลกันรั่วและใบพัด', unitPrice: 750, quantity: 1 }],
      }),
    })

    const res = await submitQuoteRoute(req, { params: Promise.resolve({ id: job.id }) })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)

    // Verify the job in DB is now bound to targetCenter.id
    const savedJob = await prisma.job.findUniqueOrThrow({ where: { id: job.id } })
    expect(savedJob.vendorCenterId).toBe(targetCenter.id)
  })

  it('API-T19: Robustness - ADMIN quotation submission on job with null vendorCenterId falls back automatically without error', async () => {
    const token = await getAdminToken()
    const branch = await prisma.site.findFirstOrThrow({ where: { code: 'BN' } })
    const brand = await prisma.brand.findFirstOrThrow()
    const size = await prisma.sizeCategory.findFirstOrThrow()

    // Create job with null vendorCenterId
    const job = await prisma.job.create({
      data: {
        jobNo: `JB-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: 'ลูกค้าทดสอบ Fallback VendorCenter',
        customerPhone: '0896667777',
        productName: 'เครื่องขัดกระดาษทราย',
        brandId: brand.id,
        brandName: brand.name,
        sizeCategoryId: size.id,
        branchId: branch.id,
        vendorCenterId: null,
        stage: 'VD_INSPECTING',
        createdBy: 'test_am',
      },
    })

    // Submitting without vendorCenterId in body
    const req = new NextRequest(`http://localhost:3000/api/jobs/${job.id}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        repairDays: 3,
        lines: [{ type: 'PART', description: 'แผ่นยางรองขัด', unitPrice: 200, quantity: 1 }],
      }),
    })

    const res = await submitQuoteRoute(req, { params: Promise.resolve({ id: job.id }) })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.quote).not.toBeNull()

    // DB record should have fallen back and assigned a valid vendorCenterId
    const savedJob = await prisma.job.findUniqueOrThrow({ where: { id: job.id } })
    expect(typeof savedJob.vendorCenterId).toBe('string')
    expect(savedJob.vendorCenterId?.length).toBeGreaterThan(0)
  })

  it('API-T20: Direct Bearer token authentication verification across all patched API endpoints without cookie context', async () => {
    const token = await getAdminToken()
    const headers = {
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    const anyJob = await prisma.job.findFirstOrThrow()

    // 1. GET /api/jobs/[id]
    const jobRes = await getJobRoute(new NextRequest(`http://localhost:3000/api/jobs/${anyJob.id}`, { headers }), { params: Promise.resolve({ id: anyJob.id }) })
    expect(jobRes.status).toBe(200)

    // 2. POST /api/jobs/[id]/payment-link
    const payLinkRes = await createPaymentLinkRoute(new NextRequest(`http://localhost:3000/api/jobs/${anyJob.id}/payment-link`, { method: 'POST', headers }), { params: Promise.resolve({ id: anyJob.id }) })
    expect(payLinkRes.status).toBe(200)

    // 3. GET /api/jobs/by-no/[jobNo]
    const byNoRes = await getJobByNoRoute(new NextRequest(`http://localhost:3000/api/jobs/by-no/${anyJob.jobNo}`, { headers }), { params: Promise.resolve({ jobNo: anyJob.jobNo }) })
    expect(byNoRes.status).toBe(200)

    // 4. POST /api/jobs/preview-fees
    const size = await prisma.sizeCategory.findFirstOrThrow()
    const prevFeesRes = await previewFeesRoute(new NextRequest('http://localhost:3000/api/jobs/preview-fees', { method: 'POST', headers, body: JSON.stringify({ sizeCategoryId: size.id, hasWarranty: false, shippingMethod: 'STANDARD' }) }))
    expect(prevFeesRes.status).toBe(200)

    // 5. GET /api/customers/lookup
    const custRes = await lookupCustomerRoute(new NextRequest('http://localhost:3000/api/customers/lookup?phone=0812345678', { headers }))
    expect(custRes.status).toBe(200)

    // 6. GET /api/reports/executive
    const execRes = await getExecutiveReportRoute(new NextRequest('http://localhost:3000/api/reports/executive?period=month', { headers }))
    expect(execRes.status).toBe(200)

    // 7. GET /api/reports/overview
    const overRes = await getOverviewReportRoute(new NextRequest('http://localhost:3000/api/reports/overview?period=weekly', { headers }))
    expect(overRes.status).toBe(200)

    // 8. GET /api/reports/vd-payment
    const vdPayRes = await getVdPaymentReportRoute(new NextRequest('http://localhost:3000/api/reports/vd-payment', { headers }))
    expect(vdPayRes.status).toBe(200)

    // 9. GET /api/me
    const meRes = await getMeRoute(new NextRequest('http://localhost:3000/api/me', { headers }))
    expect(meRes.status).toBe(200)

    // 10. GET /api/sites
    const sitesRes = await getSitesRoute(new NextRequest('http://localhost:3000/api/sites', { headers }))
    expect(sitesRes.status).toBe(200)

    // 11. GET /api/vendor-centers
    const vcRes = await getVendorCentersRoute(new NextRequest('http://localhost:3000/api/vendor-centers', { headers }))
    expect(vcRes.status).toBe(200)

    // 12. GET /api/promotions
    const promoRes = await getPromotionsRoute(new NextRequest('http://localhost:3000/api/promotions', { headers }))
    expect(promoRes.status).toBe(200)
  })
})
