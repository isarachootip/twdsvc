import { prisma } from '../src/lib/db'

async function migrateVendorPostalCodes() {
  const centers = await prisma.vendorCenter.findMany({
    select: { id: true, code: true, address: true, postalCode: true },
  })
  console.log(`Found ${centers.length} vendor centers`)

  let updatedCount = 0
  for (const c of centers) {
    if (!c.postalCode && c.address) {
      const match = c.address.match(/\b(\d{5})\b/)
      if (match) {
        await prisma.vendorCenter.update({
          where: { id: c.id },
          data: { postalCode: match[1] },
        })
        console.log(`Updated center ${c.code} with postalCode: ${match[1]}`)
        updatedCount++
      }
    }
  }
  console.log(`Migration completed. Updated ${updatedCount} centers.`)
}

migrateVendorPostalCodes()
  .catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
