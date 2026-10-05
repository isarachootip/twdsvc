import fs from 'fs'
import path from 'path'
import * as xlsx from 'xlsx'
import { PrismaClient } from '@prisma/client'
import { mergeStoreSheets, StoreInputRecord } from '../src/lib/parsers/store-parser'

const prisma = new PrismaClient()

async function importStores(filePath?: string) {
  const targetPath = filePath || process.argv[2] || 'C:\\Users\\isara\\Downloads\\store_new.xlsx'
  console.log(`📂 Reading Excel file: ${targetPath}`)

  if (!fs.existsSync(targetPath)) {
    throw new Error(`File not found at path: ${targetPath}`)
  }

  const wb = xlsx.readFile(targetPath)
  const sheet1Name = wb.SheetNames[0]
  const sheet2Name = wb.SheetNames.find(n => n.includes('(2)') || n.toLowerCase().includes('rcv')) || wb.SheetNames[1]

  const sheet1Rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheet1Name])
  const sheet2Rows = sheet2Name ? xlsx.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheet2Name]) : []

  console.log(`Found ${sheet1Rows.length} rows in ${sheet1Name}, ${sheet2Rows.length} rows in ${sheet2Name || 'none'}`)

  const stores: StoreInputRecord[] = mergeStoreSheets(sheet1Rows, sheet2Rows)
  console.log(`Parsed ${stores.length} valid store records. Starting database upsert...`)

  let createdCount = 0
  let updatedCount = 0

  for (const s of stores) {
    const existing = await prisma.site.findUnique({ where: { code: s.code } })
    await prisma.site.upsert({
      where: { code: s.code },
      update: {
        stCode: s.stCode,
        name: s.name,
        nameEn: s.nameEn,
        nickname: s.nickname,
        legalName: s.legalName,
        type: s.type,
        province: s.province,
        district: s.district,
        subdistrict: s.subdistrict,
        postalCode: s.postalCode,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        googleMapsUrl: s.googleMapsUrl,
        phone: s.phone,
        openingHours: s.openingHours,
        rcvOpeningHours: s.rcvOpeningHours,
        storeGroup: s.storeGroup,
        rom: s.rom,
        districtManager: s.districtManager,
        groupEmail: s.groupEmail,
        active: true,
      },
      create: {
        code: s.code,
        stCode: s.stCode,
        name: s.name,
        nameEn: s.nameEn,
        nickname: s.nickname,
        legalName: s.legalName,
        type: s.type,
        province: s.province,
        district: s.district,
        subdistrict: s.subdistrict,
        postalCode: s.postalCode,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        googleMapsUrl: s.googleMapsUrl,
        phone: s.phone,
        openingHours: s.openingHours,
        rcvOpeningHours: s.rcvOpeningHours,
        storeGroup: s.storeGroup,
        rom: s.rom,
        districtManager: s.districtManager,
        groupEmail: s.groupEmail,
        active: true,
      },
    })

    if (existing) {
      updatedCount++
    } else {
      createdCount++
    }
  }

  // Update prisma/stores.json
  const storesJsonPath = path.join(process.cwd(), 'prisma', 'stores.json')
  fs.writeFileSync(storesJsonPath, JSON.stringify(stores, null, 2), 'utf-8')
  console.log(`💾 Saved ${stores.length} records to ${storesJsonPath}`)

  console.log(`\n🎉 Store import complete!`)
  console.log(`   - Created: ${createdCount}`)
  console.log(`   - Updated: ${updatedCount}`)
  console.log(`   - Total processed: ${stores.length}`)
}

importStores()
  .catch(err => {
    console.error('❌ Import failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
