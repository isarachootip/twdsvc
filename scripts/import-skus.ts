import fs from 'fs'
import * as xlsx from 'xlsx'
import { PrismaClient } from '@prisma/client'
import {
  parseSkuRow, dedupeBySku, CommodityRecord, RawSkuRow, TEXT_COLUMNS, PRICE_COLUMNS,
} from '../src/lib/parsers/sku-parser'

const prisma = new PrismaClient()
const BATCH = 5000

/** Ordered list of [db column, pg array type] — single source for the INSERT. */
const COLUMNS: Array<[keyof CommodityRecord, 'text' | 'bool' | 'numeric']> = [
  ['sku', 'text'], ['barcode', 'text'], ['name', 'text'], ['brand', 'text'], ['productType', 'text'], ['active', 'bool'],
  ...Object.values(TEXT_COLUMNS).map(f => [f, 'text'] as [keyof CommodityRecord, 'text']),
  ...Object.values(PRICE_COLUMNS).map(f => [f, 'numeric'] as [keyof CommodityRecord, 'numeric']),
]

const colList = COLUMNS.map(([c]) => `"${String(c)}"`).join(', ')
const unnestArgs = COLUMNS.map(([, t], i) => `$${i + 1}::${t}[]`).join(', ')
const updateSet = COLUMNS.filter(([c]) => c !== 'sku').map(([c]) => `"${String(c)}" = EXCLUDED."${String(c)}"`).join(', ')
const SQL = `INSERT INTO commodities (${colList}) SELECT * FROM unnest(${unnestArgs})
  ON CONFLICT (sku) DO UPDATE SET ${updateSet}`

async function upsertBatch(rows: CommodityRecord[]) {
  const params = COLUMNS.map(([c]) => rows.map(r => r[c]))
  await prisma.$executeRawUnsafe(SQL, ...params)
}

async function main() {
  const file = process.argv[2] || 'C:\\Users\\isara\\Downloads\\MASTER_SKU_20260928.xlsx'
  if (!fs.existsSync(file)) throw new Error(`File not found: ${file}`)

  console.log(`📂 Reading ${file} ...`)
  const t0 = Date.now()
  const wb = xlsx.readFile(file, { dense: true })
  const raw = xlsx.utils.sheet_to_json<RawSkuRow>(wb.Sheets[wb.SheetNames[0]], { defval: null })
  console.log(`   ${raw.length.toLocaleString()} rows read in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  const parsed: CommodityRecord[] = []
  let skipped = 0
  for (const r of raw) {
    const rec = parseSkuRow(r)
    if (rec) parsed.push(rec)
    else skipped++
  }
  const records = dedupeBySku(parsed)
  const inactive = records.filter(r => !r.active).length
  console.log(`   valid: ${records.length.toLocaleString()} | skipped: ${skipped} | duplicates merged: ${parsed.length - records.length} | in-active: ${inactive.toLocaleString()}`)

  const before = await prisma.commodity.count()
  for (let i = 0; i < records.length; i += BATCH) {
    await upsertBatch(records.slice(i, i + BATCH))
    process.stdout.write(`\r   upserted ${Math.min(i + BATCH, records.length).toLocaleString()} / ${records.length.toLocaleString()}`)
  }
  const after = await prisma.commodity.count()
  console.log(`\n🎉 Done. commodities: ${before.toLocaleString()} → ${after.toLocaleString()} (new: ${(after - before).toLocaleString()})`)
}

main()
  .catch(err => { console.error('❌ Import failed:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
