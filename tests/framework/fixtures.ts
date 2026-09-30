import crypto from 'crypto'
import { SPEC_ORACLE } from './oracle'
import { MockUser, MockJob } from './types'

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const role = overrides.role ?? 'CS'
  return {
    id: `usr-${crypto.randomBytes(4).toString('hex')}`,
    username: overrides.username ?? `user_${role.toLowerCase()}`,
    fullName: overrides.fullName ?? `Test User ${role}`,
    role,
    siteId: overrides.siteId ?? (['CS', 'GR', 'S2'].includes(role) ? 'site-branch-001' : undefined),
    vendorCenterId: overrides.vendorCenterId ?? (role === 'VD' ? 'vc-001' : undefined),
    active: overrides.active ?? true,
    ...overrides,
  }
}

let jobCounter = 1000
export function createMockJob(overrides: Partial<MockJob> = {}): MockJob {
  jobCounter++
  const size = overrides.sizeCategory ?? 'SMALL'
  const hasWarranty = overrides.hasWarranty ?? true
  const shippingMethod = overrides.shippingMethod ?? 'STANDARD'
  const type = overrides.type ?? 'CUSTOMER'

  const fees = SPEC_ORACLE.calcIntakeFees({
    jobType: type,
    hasWarranty,
    shippingMethod,
    size,
  })

  const charges: Array<{ type: string; amountSatang: number }> = []
  if (fees.operationFeeSatang > 0) {
    charges.push({ type: 'OPERATION_FEE', amountSatang: fees.operationFeeSatang })
  }
  if (fees.shippingFeeSatang > 0) {
    charges.push({ type: 'SHIPPING_FEE', amountSatang: fees.shippingFeeSatang })
  }

  const now = new Date()
  return {
    id: overrides.id ?? `job-${crypto.randomBytes(4).toString('hex')}`,
    jobNo: overrides.jobNo ?? `JB-2609-${jobCounter}`,
    type,
    stage: overrides.stage ?? 'CS_OPENED',
    channel: overrides.channel ?? 'DC',
    branchId: overrides.branchId ?? 'site-branch-001',
    vendorCenterId: overrides.vendorCenterId ?? 'vc-001',
    customerName: overrides.customerName ?? 'สมชาย ใจดี',
    customerPhone: overrides.customerPhone ?? '0812345678',
    productName: overrides.productName ?? 'สว่านโรตารี่ 26 มม.',
    brandName: overrides.brandName ?? 'BOSCH',
    sizeCategory: size,
    hasWarranty,
    shippingMethod,
    version: overrides.version ?? 1,
    decision: overrides.decision ?? 'PENDING',
    closedAt: overrides.closedAt ?? null,
    charges: overrides.charges ?? charges,
    payments: overrides.payments ?? [],
    quotes: overrides.quotes ?? [],
    slaClocks: overrides.slaClocks ?? [
      {
        stepCode: 'CS_HANDOVER',
        status: 'RUNNING',
        startedAt: now,
        dueAt: new Date(now.getTime() + 24 * 3600000),
        pausedMinutes: 0,
        stoppedAt: null,
      },
    ],
    events: overrides.events ?? [
      { type: 'JOB_OPENED', fromStage: '', toStage: 'CS_OPENED', timestamp: now, actorRole: 'CS' },
    ],
    tokens: overrides.tokens ?? [
      {
        type: 'TRACKING',
        token: crypto.randomBytes(16).toString('hex'),
        expiresAt: new Date(now.getTime() + 90 * 24 * 3600000),
        usedAt: null,
      },
    ],
    ...overrides,
  }
}
