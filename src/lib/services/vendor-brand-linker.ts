import { Prisma } from '@prisma/client'

/**
 * Matches brand names case-insensitively against `brands` table, creates missing Brand rows
 * automatically, and links them to `vendor_brands` idempotently.
 */
export async function syncVendorApplicationBrands(
  tx: Prisma.TransactionClient,
  vendorParentId: string,
  brandNames: readonly string[]
): Promise<number[]> {
  const cleaned = brandNames.map(b => b.trim()).filter(Boolean)
  if (cleaned.length === 0) return []

  const existingBrands = await tx.brand.findMany({
    select: { id: true, name: true, active: true },
  })
  const byUpper = new Map<string, { id: number; active: boolean }>()
  for (const b of existingBrands) {
    byUpper.set(b.name.trim().toUpperCase(), { id: b.id, active: b.active })
  }

  const resolvedBrandIds: number[] = []

  for (const rawName of cleaned) {
    const key = rawName.toUpperCase()
    const hit = byUpper.get(key)
    if (hit) {
      if (!hit.active) {
        await tx.brand.update({ where: { id: hit.id }, data: { active: true } })
        hit.active = true
      }
      resolvedBrandIds.push(hit.id)
      continue
    }

    try {
      const created = await tx.brand.create({
        data: { name: rawName, active: true },
      })
      byUpper.set(key, { id: created.id, active: true })
      resolvedBrandIds.push(created.id)
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const raced = await tx.brand.findFirst({
          where: { name: { equals: rawName, mode: 'insensitive' } },
        })
        if (raced) {
          byUpper.set(key, { id: raced.id, active: raced.active })
          resolvedBrandIds.push(raced.id)
          continue
        }
      }
      throw err
    }
  }

  const uniqueIds = Array.from(new Set(resolvedBrandIds))
  if (uniqueIds.length > 0) {
    await tx.vendorBrand.createMany({
      data: uniqueIds.map(brandId => ({
        vendorParentId,
        brandId,
      })),
      skipDuplicates: true,
    })
  }

  return uniqueIds
}
