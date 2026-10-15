import assert from 'node:assert'
import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import { executeAction } from '../../src/lib/state-machine'
import { JobStage, QuoteStatus } from '@prisma/client'

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
})
