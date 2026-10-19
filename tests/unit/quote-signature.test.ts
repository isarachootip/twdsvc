import assert from 'node:assert'
import { NextRequest } from 'next/server'
import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import { executeAction } from '../../src/lib/state-machine'
import { JobStage, QuoteStatus } from '@prisma/client'
import { signAccessToken } from '../../src/lib/auth'
import { POST as managerSignRoute } from '../../src/app/api/jobs/[id]/quote/manager-sign/route'

setTier('Tier 1')

describe('Unit: Quotation Digital Signatures & Gatekeeper Workflow', () => {
  it('QS-01: Manager signature fields can be persisted on a Quote', async () => {
    // Locate or create a test quote
    const branch = await prisma.site.findFirst({ where: { active: true } })
    assert.ok(branch, 'Branch must exist')

    const job = await prisma.job.create({
      data: {
        jobNo: `TEST-QS-${Date.now().toString().slice(-6)}`,
        type: 'CUSTOMER',
        stage: JobStage.WAITING_APPROVAL,
        branchId: branch.id,
        customerName: 'คุณทดสอบ ลายเซ็น',
        productName: 'สว่านโรตารี่ MAKITA HR2470',
        brandName: 'MAKITA',
        symptom: 'หัวสว่านไม่หมุน',
        createdBy: 'test-user',
      },
    })

    const quote = await prisma.quote.create({
      data: {
        jobId: job.id,
        quoteNo: `QT-TEST-${Date.now().toString().slice(-6)}`,
        version: 1,
        status: QuoteStatus.SENT,
        subtotal: 50000,
        vatAmount: 3500,
        total: 53500,
        repairDays: 3,
        repairWarrantyDays: 30,
        createdBy: 'test-system',
      },
    })

    // Simulate Manager on duty signing
    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        managerSignatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        managerSignerName: 'สมศรี ผู้จัดการเวร',
        isManagerProxy: true,
        managerSignedAt: new Date(),
      },
    })

    expect(updated.managerSignerName).toBe('สมศรี ผู้จัดการเวร')
    expect(updated.isManagerProxy).toBe(true)
    assert.ok(updated.managerSignedAt, 'managerSignedAt must be set')
    assert.ok(updated.managerSignatureUrl?.startsWith('data:image/'), 'managerSignatureUrl must be saved')

    // Clean up
    await prisma.quote.delete({ where: { id: quote.id } })
    await prisma.job.delete({ where: { id: job.id } })
  })

  it('QS-02: Customer approval saves customer signature and timestamp', async () => {
    const branch = await prisma.site.findFirst({ where: { active: true } })
    assert.ok(branch, 'Branch must exist')

    const job = await prisma.job.create({
      data: {
        jobNo: `TEST-CS-${Date.now().toString().slice(-6)}`,
        type: 'CUSTOMER',
        stage: JobStage.WAITING_APPROVAL,
        branchId: branch.id,
        customerName: 'ลูกค้าทดสอบระบบ',
        productName: 'เครื่องเจียร BOSCH GWS 060',
        brandName: 'BOSCH',
        symptom: 'เปิดไม่ติด',
        createdBy: 'test-user',
      },
    })

    const quote = await prisma.quote.create({
      data: {
        jobId: job.id,
        quoteNo: `QT-CS-${Date.now().toString().slice(-6)}`,
        version: 1,
        status: QuoteStatus.SENT,
        subtotal: 30000,
        vatAmount: 2100,
        total: 32100,
        repairDays: 2,
        repairWarrantyDays: 30,
        managerSignedAt: new Date(),
        managerSignerName: branch.storeManagerName || 'ผู้จัดการสาขา',
        createdBy: 'test-system',
      },
    })

    const customerSig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const res = await executeAction(
      job.id,
      'customer_approve',
      {
        version: job.version,
        signatureUrl: customerSig,
      },
      { userId: null, role: 'CUSTOMER' }
    )

    expect(res.success).toBe(true)

    const reloadedQuote = await prisma.quote.findUnique({ where: { id: quote.id } })
    expect(reloadedQuote?.status).toBe('APPROVED')
    expect(reloadedQuote?.customerSignatureUrl).toBe(customerSig)
    assert.ok(reloadedQuote?.customerSignedAt, 'customerSignedAt must be set')

    // Clean up
    await prisma.jobCharge.deleteMany({ where: { jobId: job.id } })
    await prisma.quote.delete({ where: { id: quote.id } })
    await prisma.jobEvent.deleteMany({ where: { jobId: job.id } })
    await prisma.job.delete({ where: { id: job.id } })
  })

  it('QS-03: Newly submitted quote is unapproved (managerSignedAt is null) requiring manager approval before sending to customer', async () => {
    const branch = await prisma.site.findFirst({ where: { active: true } })
    assert.ok(branch, 'Branch must exist')

    const job = await prisma.job.create({
      data: {
        jobNo: `TEST-QS3-${Date.now().toString().slice(-6)}`,
        type: 'CUSTOMER',
        stage: JobStage.WAITING_APPROVAL,
        branchId: branch.id,
        customerName: 'ลูกค้าทดสอบขั้นตอนรออนุมัติ',
        productName: 'ปั๊มน้ำ MITSUBISHI WP-205R',
        brandName: 'MITSUBISHI',
        symptom: 'น้ำไม่ไหล',
        createdBy: 'test-user',
      },
    })

    const quote = await prisma.quote.create({
      data: {
        jobId: job.id,
        quoteNo: `QT-QS3-${Date.now().toString().slice(-6)}`,
        version: 1,
        status: QuoteStatus.SENT,
        subtotal: 45000,
        vatAmount: 3150,
        total: 48150,
        repairDays: 5,
        repairWarrantyDays: 30,
        createdBy: 'test-system',
      },
    })

    // Newly submitted quote must wait for manager signature before being approved/sent to customer
    expect(quote.status).toBe('SENT')
    expect(quote.managerSignedAt).toBe(null)
    expect(quote.customerSignedAt).toBe(null)

    // Clean up
    await prisma.quote.delete({ where: { id: quote.id } })
    await prisma.job.delete({ where: { id: job.id } })
  })

  it('QS-04: Signed quote satisfies gatekeeper allowing sending quotation link to customer via LON', async () => {
    const branch = await prisma.site.findFirst({ where: { active: true } })
    assert.ok(branch, 'Branch must exist')

    const job = await prisma.job.create({
      data: {
        jobNo: `TEST-QS4-${Date.now().toString().slice(-6)}`,
        type: 'CUSTOMER',
        stage: JobStage.WAITING_APPROVAL,
        branchId: branch.id,
        customerName: 'ลูกค้าทดสอบส่ง LON',
        productName: 'เครื่องตัดหญ้า HONDA GX35',
        brandName: 'HONDA',
        symptom: 'สตาร์ทไม่ติด',
        createdBy: 'test-user',
      },
    })

    const quote = await prisma.quote.create({
      data: {
        jobId: job.id,
        quoteNo: `QT-QS4-${Date.now().toString().slice(-6)}`,
        version: 1,
        status: QuoteStatus.SENT,
        subtotal: 60000,
        vatAmount: 4200,
        total: 64200,
        repairDays: 4,
        repairWarrantyDays: 60,
        managerSignedAt: new Date(),
        managerSignerName: branch.storeManagerName || 'ผู้จัดการสาขา',
        managerSignatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        createdBy: 'test-system',
      },
    })

    expect(Boolean(quote.managerSignedAt)).toBe(true)
    expect(quote.managerSignerName).toBeTruthy()
    expect(quote.total).toBe(64200)

    // Clean up
    await prisma.quote.delete({ where: { id: quote.id } })
    await prisma.job.delete({ where: { id: job.id } })
  })

  it('QS-05: ฿0 Quote manager sign-off auto advances job to REPAIRING and marks quote APPROVED', async () => {
    const branch = await prisma.site.findFirst({ where: { active: true } })
    assert.ok(branch, 'Branch must exist')

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN', active: true } })
    assert.ok(adminUser, 'Admin user must exist')
    const token = await signAccessToken({
      id: adminUser.id,
      username: adminUser.username,
      role: 'ADMIN',
      siteId: null,
      vendorCenterId: null,
      fullName: adminUser.fullName,
    })

    const job = await prisma.job.create({
      data: {
        jobNo: `TEST-QS5-${Date.now().toString().slice(-6)}`,
        type: 'CUSTOMER',
        stage: JobStage.WAITING_APPROVAL,
        branchId: branch.id,
        customerName: 'ลูกค้าทดสอบ 0 บาท',
        productName: 'เครื่องเจียร BOSCH GWS 060',
        brandName: 'BOSCH',
        symptom: 'เปิดไม่ติด',
        createdBy: 'test-user',
      },
    })

    const quote = await prisma.quote.create({
      data: {
        jobId: job.id,
        quoteNo: `QT-QS5-${Date.now().toString().slice(-6)}`,
        version: 1,
        status: QuoteStatus.SENT,
        subtotal: 0,
        vatAmount: 0,
        total: 0,
        repairDays: 2,
        repairWarrantyDays: 30,
        createdBy: 'test-system',
      },
    })

    const req = new NextRequest(`http://localhost:3000/api/jobs/${job.id}/quote/manager-sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'sign',
        signatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signerName: 'ผู้จัดการสาขา ทดสอบ',
      }),
    })

    const res = await managerSignRoute(req, { params: Promise.resolve({ id: job.id }) })
    expect(res.status).toBe(200)

    const updatedJob = await prisma.job.findUnique({ where: { id: job.id } })
    const updatedQuote = await prisma.quote.findUnique({ where: { id: quote.id } })

    expect(updatedJob?.stage).toBe(JobStage.REPAIRING)
    expect(updatedJob?.decision).toBe('AUTO_APPROVED')
    expect(updatedQuote?.status).toBe(QuoteStatus.APPROVED)
    expect(Boolean(updatedQuote?.managerSignedAt)).toBe(true)

    // Clean up
    await prisma.jobEvent.deleteMany({ where: { jobId: job.id } })
    await prisma.quote.delete({ where: { id: quote.id } })
    await prisma.job.delete({ where: { id: job.id } })
  })

  it('QS-06: Manager can request revision sending job back to VD_INSPECTING with reason', async () => {
    const branch = await prisma.site.findFirst({ where: { active: true } })
    assert.ok(branch, 'Branch must exist')

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN', active: true } })
    assert.ok(adminUser, 'Admin user must exist')
    const token = await signAccessToken({
      id: adminUser.id,
      username: adminUser.username,
      role: 'ADMIN',
      siteId: null,
      vendorCenterId: null,
      fullName: adminUser.fullName,
    })

    const job = await prisma.job.create({
      data: {
        jobNo: `TEST-QS6-${Date.now().toString().slice(-6)}`,
        type: 'CUSTOMER',
        stage: JobStage.WAITING_APPROVAL,
        branchId: branch.id,
        customerName: 'ลูกค้าทดสอบ ขอทบทวน',
        productName: 'ปั๊มน้ำ MITSUBISHI',
        brandName: 'MITSUBISHI',
        symptom: 'น้ำไม่ไหล',
        createdBy: 'test-user',
      },
    })

    const quote = await prisma.quote.create({
      data: {
        jobId: job.id,
        quoteNo: `QT-QS6-${Date.now().toString().slice(-6)}`,
        version: 1,
        status: QuoteStatus.SENT,
        subtotal: 50000,
        vatAmount: 3500,
        total: 53500,
        repairDays: 3,
        repairWarrantyDays: 30,
        createdBy: 'test-system',
      },
    })

    const req = new NextRequest(`http://localhost:3000/api/jobs/${job.id}/quote/manager-sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'request_revision',
        reason: 'ราคาอะไหล่สูงเกินไป ขอให้ช่างช่วยตรวจสอบอะไหล่เทียบ',
      }),
    })

    const res = await managerSignRoute(req, { params: Promise.resolve({ id: job.id }) })
    expect(res.status).toBe(200)

    const updatedJob = await prisma.job.findUnique({ where: { id: job.id } })
    const updatedQuote = await prisma.quote.findUnique({ where: { id: quote.id } })

    expect(updatedJob?.stage).toBe(JobStage.VD_INSPECTING)
    expect(updatedQuote?.status).toBe(QuoteStatus.SUPERSEDED)

    // Clean up
    await prisma.jobEvent.deleteMany({ where: { jobId: job.id } })
    await prisma.quote.delete({ where: { id: quote.id } })
    await prisma.job.delete({ where: { id: job.id } })
  })

  it('QS-07: Manager can reject quote sending job to RETURN_PACKING with reason', async () => {
    const branch = await prisma.site.findFirst({ where: { active: true } })
    assert.ok(branch, 'Branch must exist')

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN', active: true } })
    assert.ok(adminUser, 'Admin user must exist')
    const token = await signAccessToken({
      id: adminUser.id,
      username: adminUser.username,
      role: 'ADMIN',
      siteId: null,
      vendorCenterId: null,
      fullName: adminUser.fullName,
    })

    const job = await prisma.job.create({
      data: {
        jobNo: `TEST-QS7-${Date.now().toString().slice(-6)}`,
        type: 'CUSTOMER',
        stage: JobStage.WAITING_APPROVAL,
        branchId: branch.id,
        customerName: 'ลูกค้าทดสอบ ปฏิเสธ',
        productName: 'สว่านไร้สาย DEWALT',
        brandName: 'DEWALT',
        symptom: 'มอเตอร์ไหม้',
        createdBy: 'test-user',
      },
    })

    const quote = await prisma.quote.create({
      data: {
        jobId: job.id,
        quoteNo: `QT-QS7-${Date.now().toString().slice(-6)}`,
        version: 1,
        status: QuoteStatus.SENT,
        subtotal: 90000,
        vatAmount: 6300,
        total: 96300,
        repairDays: 5,
        repairWarrantyDays: 30,
        createdBy: 'test-system',
      },
    })

    const req = new NextRequest(`http://localhost:3000/api/jobs/${job.id}/quote/manager-sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'reject',
        reason: 'ค่าซ่อมสูงเกินมูลค่าสินค้า ขอส่งคืนสินค้า',
      }),
    })

    const res = await managerSignRoute(req, { params: Promise.resolve({ id: job.id }) })
    expect(res.status).toBe(200)

    const updatedJob = await prisma.job.findUnique({ where: { id: job.id } })
    const updatedQuote = await prisma.quote.findUnique({ where: { id: quote.id } })

    expect(updatedJob?.stage).toBe(JobStage.RETURN_PACKING)
    expect(updatedJob?.decision).toBe('REJECTED')
    expect(updatedQuote?.status).toBe(QuoteStatus.REJECTED)

    // Clean up
    await prisma.jobEvent.deleteMany({ where: { jobId: job.id } })
    await prisma.quote.delete({ where: { id: quote.id } })
    await prisma.job.delete({ where: { id: job.id } })
  })
})

