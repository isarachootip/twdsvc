import fs from 'fs'
import path from 'path'
import * as xlsx from 'xlsx'
import {
  parseVendorDataRows,
  parseVendorBrandRows,
  parseSkuPartRows,
} from '../src/lib/parsers/vendor-matching-parser'
import type {
  RawVdDataRow,
  RawVendorBrandRow,
  RawSkuPartRow,
} from '../src/lib/parsers/vendor-matching-types'

const excelPath = 'C:\\Users\\isara\\Downloads\\Match VD update 01-09-2026 (เทียบ VD เเละประวัติซ่อม) (1).xlsx'
const wb = xlsx.readFile(excelPath, { dense: true })

const rawVdRows = xlsx.utils.sheet_to_json<RawVdDataRow>(wb.Sheets['VD Data ลบข้อมูลซ้ำ'])
const parsedVendors = parseVendorDataRows(rawVdRows)

const rawBrandRows = xlsx.utils.sheet_to_json<RawVendorBrandRow>(wb.Sheets['สรุป Vendor และ Brand ในสังกัด'], { range: 1 })
const parsedBrands = parseVendorBrandRows(rawBrandRows)

const rawSkuRows = xlsx.utils.sheet_to_json<RawSkuPartRow>(wb.Sheets['Remove Parts,Premium'])
const parsedSkus = parseSkuPartRows(rawSkuRows)

// Combine brand mappings into parsedVendors
const brandMap = new Map<string, string[]>()
for (const b of parsedBrands) {
  brandMap.set(b.vendorId, b.brandNames)
}

const vendorSeedData = parsedVendors.map(v => {
  const brandsFromSheet = brandMap.get(v.vendorId) || brandMap.get(`${v.vendorId}-1`) || []
  const allBrands = Array.from(new Set([...v.brands, ...brandsFromSheet]))
  return {
    vendorId: v.vendorId,
    name: v.name,
    active: v.active,
    isBrandAuthorized: v.isBrandAuthorized,
    slaDays: v.slaDays,
    dropPoint: v.dropPoint,
    address: v.address,
    postalCode: v.postalCode,
    deliveryMethod: v.deliveryMethod,
    brands: allBrands,
  }
})

const vendorJsonPath = path.join(process.cwd(), 'prisma', 'vendor_matching.json')
fs.writeFileSync(vendorJsonPath, JSON.stringify(vendorSeedData, null, 2), 'utf-8')
console.log(`✅ Saved ${vendorSeedData.length} vendors to ${vendorJsonPath}`)

// Compact SKU mapping: [sku, vendorNo, vendorName]
const skuTuples = parsedSkus.map(s => [s.sku, s.vendorNo, s.vendorName])
const skuJsonPath = path.join(process.cwd(), 'prisma', 'sku_vendors.json')
fs.writeFileSync(skuJsonPath, JSON.stringify(skuTuples), 'utf-8')
console.log(`✅ Saved ${skuTuples.length} SKUs to ${skuJsonPath}`)

const vStat = fs.statSync(vendorJsonPath)
const sStat = fs.statSync(skuJsonPath)
console.log(`Sizes: vendor_matching.json = ${(vStat.size / 1024).toFixed(1)} KB, sku_vendors.json = ${(sStat.size / 1024).toFixed(1)} KB`)
