import fs from 'fs'
import * as xlsx from 'xlsx'
import { PrismaClient } from '@prisma/client'
import {
  parseVendorDataRows,
  parseVendorBrandRows,
  parseSkuPartRows,
  resolveBranchChannel,
} from '../src/lib/parsers/vendor-matching-parser'
import type {
  RawVdDataRow,
  RawVendorBrandRow,
  RawSkuPartRow,
} from '../src/lib/parsers/vendor-matching-types'
import {
  upsertVendorsAndCenters,
  upsertBrandsAndLinks,
  syncBranchRoutes,
  batchUpdateCommodityVendors,
  ImportSummary,
} from '../src/lib/services/vendor-matching-importer'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  const isCommit = args.includes('--commit')
  const fileArg = args.find(a => !a.startsWith('--'))
  const filePath =
    fileArg || 'C:\\Users\\isara\\Downloads\\Match VD update 01-09-2026 (เทียบ VD เเละประวัติซ่อม) (1).xlsx'

  console.log('===========================================================')
  console.log(`🚀 VD & Repair History Matching Importer`)
  console.log(`📁 File: ${filePath}`)
  console.log(`⚙️  Mode: ${isCommit ? '⚡ COMMIT (Executing Database Changes)' : '🔍 DRY-RUN (Preview Only)'}`)
  console.log('===========================================================\n')

  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found at: ${filePath}`)
  }

  const t0 = Date.now()
  console.log('📖 Reading Excel sheets...')
  const wb = xlsx.readFile(filePath, { dense: true })

  // 1. Parse Vendor Master
  const vdSheet = wb.Sheets['VD Data ลบข้อมูลซ้ำ'] || wb.Sheets['VD Data Fulldata']
  if (!vdSheet) throw new Error('Sheet "VD Data ลบข้อมูลซ้ำ" not found')
  const rawVdRows = xlsx.utils.sheet_to_json<RawVdDataRow>(vdSheet)
  const parsedVendors = parseVendorDataRows(rawVdRows)
  const activeVendors = parsedVendors.filter(v => v.active)
  const inactiveVendors = parsedVendors.filter(v => !v.active)

  // 2. Parse Brand Mappings (Row 0 is title, Row 1 is header)
  const brandSheet = wb.Sheets['สรุป Vendor และ Brand ในสังกัด']
  if (!brandSheet) throw new Error('Sheet "สรุป Vendor และ Brand ในสังกัด" not found')
  const rawBrandRows = xlsx.utils.sheet_to_json<RawVendorBrandRow>(brandSheet, { range: 1 })
  const parsedBrands = parseVendorBrandRows(rawBrandRows)

  // 3. Parse SKU Parts
  const skuSheet = wb.Sheets['Remove Parts,Premium']
  const rawSkuRows = skuSheet ? xlsx.utils.sheet_to_json<RawSkuPartRow>(skuSheet) : []
  const parsedSkus = parseSkuPartRows(rawSkuRows)

  console.log(`📊 Parsed Summary:`)
  console.log(`   - Total Vendors: ${parsedVendors.length} (Active: ${activeVendors.length}, Inactive: ${inactiveVendors.length})`)
  console.log(`   - Vendor-Brand Groups: ${parsedBrands.length} vendors`)
  const totalBrandNames = new Set(parsedBrands.flatMap(b => b.brandNames))
  console.log(`   - Unique Authorised Brands: ${totalBrandNames.size} brands`)
  console.log(`   - SKUs to Enrich: ${parsedSkus.length.toLocaleString()} items\n`)

  if (!isCommit) {
    console.log('🔍 [DRY RUN PREVIEW]')
    console.log('   Sample Active Vendors:')
    activeVendors.slice(0, 3).forEach(v => {
      console.log(`     • [${v.vendorId}] ${v.name} | Drop: ${v.dropPoint} | SLA: ${v.slaDays}d | Zip: ${v.postalCode || '-'}`)
    })

    console.log('\n   Sample Hybrid Channel Routing:')
    const testVendors = activeVendors.filter(v => v.dropPoint.includes('ตจว.')).slice(0, 2)
    testVendors.forEach(v => {
      const bkkCh = resolveBranchChannel(v.dropPoint, 'กรุงเทพมหานคร', '10540')
      const upCh = resolveBranchChannel(v.dropPoint, 'เชียงใหม่', '50000')
      console.log(`     • ${v.name}: BKK (10540) → ${bkkCh} | Chiang Mai (50000) → ${upCh}`)
    })

    console.log('\n   Sample Brand Mappings:')
    parsedBrands.slice(0, 3).forEach(b => {
      console.log(`     • [${b.vendorId}] ${b.vendorName}: ${b.brandNames.join(', ')}`)
    })

    console.log('\n💡 Dry-run completed successfully. Run with --commit to apply changes to database.')
    return
  }

  // COMMIT MODE
  const summary: ImportSummary = {
    vendorsCreated: 0,
    vendorsUpdated: 0,
    centersCreated: 0,
    centersUpdated: 0,
    brandsCreated: 0,
    vendorBrandsLinked: 0,
    routesCreated: 0,
    routesUpdated: 0,
    skusUpdated: 0,
  }

  console.log('⏳ Upserting Vendors and Centers...')
  const vendorMap = await upsertVendorsAndCenters(prisma, parsedVendors, summary)

  console.log('⏳ Upserting Brands and Linking to Vendors...')
  await upsertBrandsAndLinks(prisma, parsedBrands, parsedVendors, vendorMap, summary)

  console.log('⏳ Synchronizing Branch-Vendor Routes for all branches...')
  await syncBranchRoutes(prisma, activeVendors, vendorMap, summary)

  console.log(`⏳ Batch updating ${parsedSkus.length.toLocaleString()} Commodity SKUs...`)
  summary.skusUpdated = await batchUpdateCommodityVendors(prisma, parsedSkus)

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  console.log('\n🎉 ===========================================================')
  console.log(`✅ IMPORT COMPLETED IN ${elapsed}s`)
  console.log('===========================================================')
  console.log(`   - Vendors: Created ${summary.vendorsCreated}, Updated ${summary.vendorsUpdated}`)
  console.log(`   - Centers: Created ${summary.centersCreated}, Updated ${summary.centersUpdated}`)
  console.log(`   - Brands: Created ${summary.brandsCreated}, Links Created: ${summary.vendorBrandsLinked}`)
  console.log(`   - Routes: Created ${summary.routesCreated}, Updated ${summary.routesUpdated}`)
  console.log(`   - SKUs Enriched: ${summary.skusUpdated.toLocaleString()}`)
  console.log('===========================================================\n')
}

main()
  .catch(err => {
    console.error('❌ Import failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
