/**
 * Normalize legacy Baht-stored Quotes, QuoteLines, and REPAIR / OPERATION_FEE_CREDIT JobCharges
 * into standardized Satang units (1 THB = 100 Satang) and remove duplicate ฿300 INSPECTION_FEE lines.
 *
 * Usage:
 *   npx tsx scripts/normalize-money-satang.ts            # Dry-run
 *   npx tsx scripts/normalize-money-satang.ts --apply    # Apply changes to DB
 */

import { prisma } from '../src/lib/db'
import { calcQuoteTotals } from '../src/lib/fees'

function isLegacyBahtQuote(quote: {
  subtotal: number
  vatAmount: number
  total: number
  lines: Array<{ type: string; unitPrice: number; quantity: number }>
}): boolean {
  if (quote.lines.some(l => l.type === 'INSPECTION_FEE' && l.unitPrice > 0 && l.unitPrice <= 1000)) {
    return true
  }
  if (quote.subtotal > 0 && quote.subtotal < 10000) {
    return true
  }
  if (quote.lines.some(l => l.unitPrice > 0 && l.unitPrice < 5000 && l.unitPrice % 100 !== 0)) {
    return true
  }
  return false
}

export async function normalizeMoneySatang(opts: { apply: boolean }) {
  const quotes = await prisma.quote.findMany({
    include: {
      lines: true,
      job: {
        include: {
          charges: true,
          payments: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  let updatedQuotes = 0
  let updatedCharges = 0

  for (const q of quotes) {
    const legacy = isLegacyBahtQuote(q)
    const hasInspectionLine = q.lines.some(l => l.type === 'INSPECTION_FEE')

    if (!legacy && !hasInspectionLine) continue

    const nonInspectionLines = q.lines.filter(l => l.type !== 'INSPECTION_FEE')
    const normalizedLines = nonInspectionLines.map(l => {
      const unitPriceSatang = legacy && l.unitPrice < 50000 ? Math.round(l.unitPrice * 100) : l.unitPrice
      return {
        id: l.id,
        type: l.type,
        description: l.description,
        unitPrice: unitPriceSatang,
        quantity: l.quantity,
      }
    })

    const totals = normalizedLines.length > 0 || hasInspectionLine
      ? calcQuoteTotals(
          normalizedLines.map(l => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
          0.07
        )
      : {
          subtotal: Math.round(q.subtotal * 100),
          vatAmount: Math.round(q.vatAmount * 100),
          total: Math.round(q.total * 100),
        }

    console.log(
      `[Quote ${q.quoteNo} / Job ${q.job.jobNo}] subtotal: ${q.subtotal} -> ${totals.subtotal}, vat: ${q.vatAmount} -> ${totals.vatAmount}, total: ${q.total} -> ${totals.total}`
    )

    if (opts.apply) {
      await prisma.$transaction(async tx => {
        if (hasInspectionLine && nonInspectionLines.length > 0) {
          await tx.quoteLine.deleteMany({
            where: { quoteId: q.id, type: 'INSPECTION_FEE' },
          })
        }
        for (const nl of normalizedLines) {
          await tx.quoteLine.update({
            where: { id: nl.id },
            data: { unitPrice: nl.unitPrice },
          })
        }
        await tx.quote.update({
          where: { id: q.id },
          data: {
            subtotal: totals.subtotal,
            vatAmount: totals.vatAmount,
            total: totals.total,
          },
        })
      })
    }
    updatedQuotes++

    // Check JobCharges on this job if quote is APPROVED
    if (q.status === 'APPROVED') {
      const repairCharge = q.job.charges.find(c => c.type === 'REPAIR')
      const creditCharge = q.job.charges.find(c => c.type === 'OPERATION_FEE_CREDIT')
      const opFeeCharged = q.job.charges
        .filter(c => c.type === 'OPERATION_FEE')
        .reduce((s, c) => s + c.amount, 0)
      const expectedCredit = -Math.min(opFeeCharged, totals.total)

      if (repairCharge && repairCharge.amount !== totals.total) {
        console.log(
          `  -> [JobCharge REPAIR] ${repairCharge.amount} -> ${totals.total}`
        )
        if (opts.apply) {
          await prisma.jobCharge.update({
            where: { id: repairCharge.id },
            data: { amount: totals.total },
          })
        }
        updatedCharges++
      }

      if (creditCharge && creditCharge.amount !== expectedCredit) {
        console.log(
          `  -> [JobCharge OPERATION_FEE_CREDIT] ${creditCharge.amount} -> ${expectedCredit}`
        )
        if (opts.apply) {
          await prisma.jobCharge.update({
            where: { id: creditCharge.id },
            data: { amount: expectedCredit },
          })
        }
        updatedCharges++
      }
    }
  }

  return { updatedQuotes, updatedCharges }
}

if (typeof require !== 'undefined' && require.main === module) {
  const apply = process.argv.includes('--apply')
  normalizeMoneySatang({ apply })
    .then(res => {
      console.log(`Done (apply=${apply}):`, res)
      process.exit(0)
    })
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}
