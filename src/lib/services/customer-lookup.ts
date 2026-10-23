import { prisma } from '@/lib/db'
import type { CustomerLookupItem } from '@/lib/validations/customer'
import { normalizePhoneNumber } from './customer-aggregation'

export async function lookupCustomerByExactPhone(phone: string): Promise<CustomerLookupItem | null> {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 9) return null
  const job = await prisma.job.findFirst({
    where: { customerPhone: digits, type: 'CUSTOMER' },
    orderBy: { openedAt: 'desc' },
    select: {
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      customerZip: true,
      taxInvoiceName: true,
      taxInvoiceId: true,
      taxInvoiceAddr: true,
      openedAt: true,
    },
  })
  if (!job) return null
  const count = await prisma.job.count({ where: { customerPhone: digits } })
  return {
    customerName: job.customerName ?? '',
    customerPhone: job.customerPhone ?? digits,
    customerAddress: job.customerAddress,
    customerZip: job.customerZip,
    taxInvoiceName: job.taxInvoiceName,
    taxInvoiceId: job.taxInvoiceId,
    taxInvoiceAddr: job.taxInvoiceAddr,
    openedAt: job.openedAt,
    jobCount: count,
  }
}

export async function lookupCustomersByPhonePrefix(
  prefix: string,
  limit = 6
): Promise<CustomerLookupItem[]> {
  const digits = prefix.replace(/\D/g, '')
  if (digits.length < 3) return []
  const jobs = await prisma.job.findMany({
    where: {
      type: 'CUSTOMER',
      customerPhone: { contains: digits },
    },
    orderBy: { openedAt: 'desc' },
    select: {
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      customerZip: true,
      taxInvoiceName: true,
      taxInvoiceId: true,
      taxInvoiceAddr: true,
      openedAt: true,
    },
    take: 150,
  })

  const grouped = new Map<string, CustomerLookupItem>()
  for (const job of jobs) {
    const norm = normalizePhoneNumber(job.customerPhone || '')
    if (!norm) continue
    const existing = grouped.get(norm)
    if (!existing) {
      grouped.set(norm, {
        customerName: job.customerName ?? '',
        customerPhone: norm,
        customerAddress: job.customerAddress,
        customerZip: job.customerZip,
        taxInvoiceName: job.taxInvoiceName,
        taxInvoiceId: job.taxInvoiceId,
        taxInvoiceAddr: job.taxInvoiceAddr,
        openedAt: job.openedAt,
        jobCount: 1,
      })
    } else {
      existing.jobCount += 1
      if (!existing.customerAddress && job.customerAddress) {
        existing.customerAddress = job.customerAddress
        existing.customerZip = job.customerZip
      }
      if (!existing.taxInvoiceId && job.taxInvoiceId) {
        existing.taxInvoiceName = job.taxInvoiceName
        existing.taxInvoiceId = job.taxInvoiceId
        existing.taxInvoiceAddr = job.taxInvoiceAddr
      }
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => {
      const aStarts = a.customerPhone.startsWith(digits) ? 0 : 1
      const bStarts = b.customerPhone.startsWith(digits) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
    })
    .slice(0, limit)
}
