import assert from 'node:assert'
import { parseSkuRow, dedupeBySku, CommodityRecord } from '@/lib/parsers/sku-parser'

console.log('--- Running SKU Parser Unit Tests ---')

// 1. Full row from screenshot: every header column mapped
const r1 = parseSkuRow({
  sku: 60453445, ibc: 8851234567890, sbc: 'NULL', barcode2: 'B2', barcode3: 'NULL', barcode4: null, barcode5: '',
  sku_name: '  ประตู PVC ', sku_condition: 1, sku_condition_name: 'New', brand_id: 101, brand: 'ABC', model: 'M-1',
  vendor_no: 5001, vendor_name: 'Vendor X', dept_no: 1, dept_name: 'Construction', sdept_no: 2, sdept_name: 'Door Material',
  class_no: 1, class_name: 'Door / Frame', sclass_no: 2, sclass_name: 'PVC Door', unit_code: 'EA', unit_name: 'EACH',
  sku_status_code: 'A', sku_status_name: 'Active', sku_price: 4690, sku_cost: 1, distrmcode: 3, norprice: 4690, posprice: '4690.50',
}) as CommodityRecord
assert.strictEqual(r1.sku, '60453445')
assert.strictEqual(r1.name, 'ประตู PVC')
assert.strictEqual(r1.barcode, '8851234567890')
assert.strictEqual(r1.brand, 'ABC')
assert.strictEqual(r1.productType, 'Door / Frame')
assert.strictEqual(r1.active, true)
assert.strictEqual(r1.ibc, '8851234567890')
assert.strictEqual(r1.sbc, null)
assert.strictEqual(r1.barcode2, 'B2')
assert.strictEqual(r1.barcode5, null)
assert.strictEqual(r1.brandCode, '101')
assert.strictEqual(r1.vendorName, 'Vendor X')
assert.strictEqual(r1.sclassName, 'PVC Door')
assert.strictEqual(r1.unitCode, 'EA')
assert.strictEqual(r1.skuStatusName, 'Active')
assert.strictEqual(r1.distrmcode, '3')
assert.strictEqual(r1.skuPrice, 4690)
assert.strictEqual(r1.skuCost, 1)
assert.strictEqual(r1.posprice, 4690.5)

// 2. In-active status → active=false; NULL strings → fallbacks
const r2 = parseSkuRow({ sku: '123', ibc: 'NULL', sbc: '999', sku_name: 'X', brand: 'NULL', class_name: 'NULL', dept_name: 'แผนก', sku_status_code: 'I', sku_price: 'NULL' })
assert.strictEqual(r2?.barcode, '999')
assert.strictEqual(r2?.brand, '-')
assert.strictEqual(r2?.productType, 'แผนก')
assert.strictEqual(r2?.active, false)
assert.strictEqual(r2?.skuPrice, null)

// 3. Missing SKU or name → rejected
assert.strictEqual(parseSkuRow({ sku: 'NULL', sku_name: 'X' }), null)
assert.strictEqual(parseSkuRow({ sku: '1', sku_name: '' }), null)

// 4. Dedupe keeps last occurrence
const a = parseSkuRow({ sku: 'A', sku_name: 'old' }) as CommodityRecord
const b = parseSkuRow({ sku: 'A', sku_name: 'new' }) as CommodityRecord
const d = dedupeBySku([a, b])
assert.strictEqual(d.length, 1)
assert.strictEqual(d[0].name, 'new')

console.log('✓ SKU parser tests passed')
