import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { PrismaClient, SiteType } from '@prisma/client'

const prisma = new PrismaClient()

interface RawStoreRow {
  STORE?: string | number
  STCODE?: string | number
  SnameTH?: string
  SName?: string
  STTNAME?: string
  THADDRESS?: string
  STTEL?: string | number
  STOREGROUP?: string
}

export function extractProvince(address?: string): string {
  if (!address) return 'กรุงเทพมหานคร'
  const match = address.match(/จังหวัด([^\s\d]+)/)
  if (match && match[1]) return match[1].trim()
  if (address.includes('กรุงเทพ')) return 'กรุงเทพมหานคร'
  return 'กรุงเทพมหานคร'
}

export async function importStores(filePath?: string) {
  const targetFile = filePath || 'C:\\Users\\isara\\Downloads\\StoreGPS(1).xlsx'
  if (!fs.existsSync(targetFile)) {
    throw new Error(`Excel file not found at: ${targetFile}`)
  }

  console.log(`📂 Reading Excel file: ${targetFile}`)
  const workbook = XLSX.readFile(targetFile)
  const sheetName = workbook.SheetNames[0] || 'Sheet1'
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<RawStoreRow>(sheet)
  console.log(`📊 Found ${rows.length} store records in [${sheetName}]`)

  let updatedLegacy = 0
  let newlyCreated = 0
  let updatedExisting = 0

  // 1. Check & Migrate legacy BN (Bangna) site if present
  const existingBn = await prisma.site.findUnique({ where: { code: 'BN' } })
  if (existingBn) {
    const bnRow = rows.find(r => String(r.STORE).trim() === '60920')
    const address = bnRow?.THADDRESS?.trim() || existingBn.address
    const phone = bnRow?.STTEL ? String(bnRow.STTEL).trim() : existingBn.phone
    const province = extractProvince(bnRow?.THADDRESS)

    await prisma.site.update({
      where: { id: existingBn.id },
      data: {
        code: '60920',
        name: 'สาขาบางนา',
        nickname: '60920',
        address,
        phone,
        province,
        active: true,
      },
    })
    console.log(`  ✓ Migrated legacy site 'BN' -> '60920' (Preserved existing jobs/users)`)
    updatedLegacy++
  }

  // 2. Check & Migrate legacy SK (Sukhaphiban 3) site if present
  const existingSk = await prisma.site.findUnique({ where: { code: 'SK' } })
  if (existingSk) {
    const skRow = rows.find(r => String(r.STORE).trim() === '60919')
    const address = skRow?.THADDRESS?.trim() || existingSk.address
    const phone = skRow?.STTEL ? String(skRow.STTEL).trim() : existingSk.phone
    const province = extractProvince(skRow?.THADDRESS)

    await prisma.site.update({
      where: { id: existingSk.id },
      data: {
        code: '60919',
        name: 'สาขาสุขาภิบาล 3',
        nickname: '60919',
        address,
        phone,
        province,
        active: true,
      },
    })
    console.log(`  ✓ Migrated legacy site 'SK' -> '60919' (Preserved existing jobs/users)`)
    updatedLegacy++
  }

  // 3. Ensure DC01 is kept active
  await prisma.site.updateMany({
    where: { code: 'DC01' },
    data: { active: true },
  })

  // 4. Upsert all rows from Excel
  for (const row of rows) {
    if (!row.STORE) continue
    const code = String(row.STORE).trim()
    const rawName = String(row.SnameTH || row.SName || code).trim()
    const name = rawName.startsWith('สาขา') ? rawName : `สาขา${rawName}`
    const address = row.THADDRESS ? String(row.THADDRESS).trim() : null
    const phone = row.STTEL ? String(row.STTEL).trim() : null
    const province = extractProvince(address ?? undefined)

    const before = await prisma.site.findUnique({ where: { code } })
    await prisma.site.upsert({
      where: { code },
      update: {
        name,
        nickname: code,
        address,
        phone,
        province,
        active: true,
      },
      create: {
        code,
        name,
        nickname: code,
        type: SiteType.BRANCH,
        address,
        phone,
        province,
        active: true,
      },
    })

    if (before) {
      updatedExisting++
    } else {
      newlyCreated++
    }
  }

  // 5. Export JSON for production deploy / seed compatibility
  const allBranches = await prisma.site.findMany({
    where: { active: true, type: SiteType.BRANCH },
    orderBy: { code: 'asc' },
    select: { code: true, name: true, nickname: true, type: true, province: true, address: true, phone: true },
  })
  const jsonPath = path.join(process.cwd(), 'prisma', 'stores.json')
  fs.writeFileSync(jsonPath, JSON.stringify(allBranches, null, 2), 'utf-8')
  console.log(`💾 Saved ${allBranches.length} branches to ${jsonPath}`)

  // 6. Verification & Summary Report
  const totalActive = await prisma.site.count({ where: { active: true } })
  const totalBranches = await prisma.site.count({ where: { active: true, type: SiteType.BRANCH } })
  const totalDcs = await prisma.site.count({ where: { active: true, type: SiteType.DC } })

  const bangna = await prisma.site.findUnique({
    where: { code: '60920' },
    include: { _count: { select: { jobs: true, users: true } } },
  })
  const sk3 = await prisma.site.findUnique({
    where: { code: '60919' },
    include: { _count: { select: { jobs: true, users: true } } },
  })

  console.log('\n======================================================')
  console.log('🎉 Store Import Completed Successfully!')
  console.log('======================================================')
  console.log(`- Legacy branches migrated   : ${updatedLegacy}`)
  console.log(`- Existing branches updated  : ${updatedExisting}`)
  console.log(`- New branches inserted      : ${newlyCreated}`)
  console.log(`- Total active sites in DB   : ${totalActive} (${totalBranches} BRANCH + ${totalDcs} DC)`)
  console.log(`- Bangna (60920) jobs        : ${bangna?._count.jobs ?? 0} jobs (Users: ${bangna?._count.users ?? 0})`)
  console.log(`- Sukhaphiban 3 (60919) jobs : ${sk3?._count.jobs ?? 0} jobs`)
  console.log('======================================================\n')

  return { totalActive, totalBranches, totalDcs, newlyCreated, updatedExisting, updatedLegacy }
}

if (require.main === module) {
  const filePath = process.argv[2]
  importStores(filePath)
    .catch(err => {
      console.error('❌ Import failed:', err)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
