// Fee calculation — pure functions (05_business_rules.md §1)

export interface FeeRate {
  operationFee: number  // baht
  shippingFee3pl: number // baht
}

export interface FeeInput {
  jobType: 'CUSTOMER' | 'STOCK'
  hasWarranty: boolean
  shippingMethod: 'STANDARD' | 'EXPRESS'
  feeRate: FeeRate
}

export interface FeeResult {
  operationFee: number
  shippingFee: number
  total: number
}

export function calcIntakeFees(input: FeeInput): FeeResult {
  if (input.jobType === 'STOCK') {
    return { operationFee: 0, shippingFee: 0, total: 0 }
  }
  if (input.shippingMethod === 'EXPRESS') {
    const operationFee = input.feeRate.operationFee
    const shippingFee = input.feeRate.shippingFee3pl
    return { operationFee, shippingFee, total: operationFee + shippingFee }
  }
  // STANDARD
  const operationFee = input.hasWarranty ? 0 : input.feeRate.operationFee
  return { operationFee, shippingFee: 0, total: operationFee }
}

// Quote calculation — pure functions (05_business_rules.md §2)

export interface QuoteLine {
  unitPrice: number
  quantity: number
}

export function calcQuoteTotals(lines: QuoteLine[], vatRate = 0.07) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  const vatAmount = roundHalfUp(subtotal * vatRate)
  const total = subtotal + vatAmount
  return { subtotal, vatAmount, total }
}

function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5)
}

// Balance calculation
export interface JobChargeLike { amount: number }
export interface PaymentLike { amount: number; status: string }

export function calcBalance(charges: JobChargeLike[], payments: PaymentLike[]): number {
  const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0)
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)
  return totalCharges - totalPaid
}

// SLA helpers

export function calcSlaDeadline(startedAt: Date, hours: number): Date {
  return new Date(startedAt.getTime() + hours * 60 * 60 * 1000)
}

export function getSlaStatus(clock: {
  dueAt: Date
  pausedMinutes: number
  stoppedAt?: Date | null
  status: string
}): 'ON_TRACK' | 'AT_RISK' | 'OVERDUE' {
  if (clock.status === 'STOPPED') return 'ON_TRACK'
  const now = Date.now()
  const dueMs = clock.dueAt.getTime()
  if (now > dueMs) return 'OVERDUE'
  const remaining = dueMs - now
  const total = dueMs - (clock.dueAt.getTime() - clock.pausedMinutes * 60000)
  if (remaining / total < 0.2) return 'AT_RISK'
  return 'ON_TRACK'
}

export function getHoursInStep(clock: {
  startedAt: Date
  pausedMinutes: number
  stoppedAt?: Date | null
}): number {
  const end = clock.stoppedAt ?? new Date()
  const elapsedMs = end.getTime() - clock.startedAt.getTime() - clock.pausedMinutes * 60000
  return Math.floor(Math.max(0, elapsedMs) / (60 * 60 * 1000))
}
