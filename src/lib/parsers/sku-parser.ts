/**
 * Parser for the Thaiwasadu MASTER_SKU Excel export → Commodity records.
 * Every Excel header column is mapped 1:1 (see TEXT_COLUMNS / PRICE_COLUMNS),
 * plus the legacy summary fields (barcode, name, brand, productType, active)
 * that existing search / CS intake depend on.
 */

/** Excel header → Commodity field (text columns). */
export const TEXT_COLUMNS = {
  ibc: 'ibc', sbc: 'sbc', barcode2: 'barcode2', barcode3: 'barcode3', barcode4: 'barcode4', barcode5: 'barcode5',
  sku_condition: 'skuCondition', sku_condition_name: 'skuConditionName', brand_id: 'brandCode', model: 'model',
  vendor_no: 'vendorNo', vendor_name: 'vendorName', dept_no: 'deptNo', dept_name: 'deptName',
  sdept_no: 'sdeptNo', sdept_name: 'sdeptName', class_no: 'classNo', class_name: 'className',
  sclass_no: 'sclassNo', sclass_name: 'sclassName', unit_code: 'unitCode', unit_name: 'unitName',
  sku_status_code: 'skuStatusCode', sku_status_name: 'skuStatusName', distrmcode: 'distrmcode',
} as const

/** Excel header → Commodity field (numeric price columns). */
export const PRICE_COLUMNS = {
  sku_price: 'skuPrice', sku_cost: 'skuCost', norprice: 'norprice', posprice: 'posprice',
} as const

type TextField = (typeof TEXT_COLUMNS)[keyof typeof TEXT_COLUMNS]
type PriceField = (typeof PRICE_COLUMNS)[keyof typeof PRICE_COLUMNS]

export type CommodityRecord = {
  sku: string
  barcode: string | null
  name: string
  brand: string
  productType: string
  active: boolean
} & Record<TextField, string | null> & Record<PriceField, number | null>

export type RawSkuRow = Record<string, unknown>

/** Normalise a cell: trims, treats '' / 'NULL' / null as missing. */
function cell(v: unknown): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s || s.toUpperCase() === 'NULL') return null
  return s
}

function num(v: unknown): number | null {
  const s = cell(v)
  if (s === null) return null
  const n = Number(s.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function parseSkuRow(row: RawSkuRow): CommodityRecord | null {
  const sku = cell(row.sku)
  const name = cell(row.sku_name)
  if (!sku || !name) return null

  const text = {} as Record<TextField, string | null>
  for (const [col, field] of Object.entries(TEXT_COLUMNS)) text[field] = cell(row[col])
  const prices = {} as Record<PriceField, number | null>
  for (const [col, field] of Object.entries(PRICE_COLUMNS)) prices[field] = num(row[col])

  return {
    sku,
    name,
    barcode: text.ibc ?? text.sbc ?? text.barcode2,
    brand: cell(row.brand) ?? '-',
    productType: text.className ?? text.deptName ?? '-',
    active: text.skuStatusCode?.toUpperCase() !== 'I',
    ...text,
    ...prices,
  }
}

/** Removes duplicate SKUs, keeping the last occurrence (required for ON CONFLICT batches). */
export function dedupeBySku(records: CommodityRecord[]): CommodityRecord[] {
  const map = new Map<string, CommodityRecord>()
  for (const r of records) map.set(r.sku, r)
  return Array.from(map.values())
}
