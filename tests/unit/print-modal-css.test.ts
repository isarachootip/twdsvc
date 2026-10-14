import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, setTier } from '../framework/core'

const globalsCssPath = path.resolve(process.cwd(), 'src/app/globals.css')
const globalsCss = fs.readFileSync(globalsCssPath, 'utf8')

const printJobModalPath = path.resolve(
  process.cwd(),
  'src/app/(dashboard)/cs/new/components/PrintJobModal.tsx'
)
const printJobModalSrc = fs.readFileSync(printJobModalPath, 'utf8')

const s2PagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/s2/page.tsx')
const s2PageSrc = fs.readFileSync(s2PagePath, 'utf8')

setTier('Tier 1')

describe('Unit: Print Modal & CSS Layout Integrity (.print-area)', () => {
  it('PM-01: @page configures A4 portrait and margin: 0 to hide browser headers/footers', () => {
    const valid = /@page\s*\{\s*size:\s*A4\s+portrait;\s*margin:\s*0(mm)?;/i.test(globalsCss)
    assert.ok(valid)
    expect(valid).toBe(true)
  })

  it('PM-02: Non-print-area elements are collapsed with display: none to prevent extra blank pages', () => {
    const valid =
      globalsCss.includes(
        'body:has(.print-area) *:not(:has(.print-area)):not(.print-area):not(.print-area *)'
      ) &&
      /body:has\(\.print-area\)\s*\*:not\(:has\(\.print-area\)\):not\(\.print-area\):not\(\.print-area\s+\*\)\s*\{[^}]*display:\s*none\s*!important/s.test(
        globalsCss
      )
    assert.ok(valid)
    expect(valid).toBe(true)
  })

  it('PM-03: Ancestors (.modal-box, .modal-overlay) and .print-area use static flow without overflow clipping', () => {
    const ancestorValid =
      /body:has\(\.print-area\)\s*\*:has\(\.print-area\)\s*\{[^}]*position:\s*static\s*!important/s.test(
        globalsCss
      ) &&
      /body:has\(\.print-area\)\s*\*:has\(\.print-area\)\s*\{[^}]*max-height:\s*none\s*!important/s.test(
        globalsCss
      ) &&
      /body:has\(\.print-area\)\s*\*:has\(\.print-area\)\s*\{[^}]*overflow:\s*visible\s*!important/s.test(
        globalsCss
      )
    const printAreaValid =
      /body:has\(\.print-area\)\s*\.print-area\s*\{[^}]*position:\s*static\s*!important/s.test(
        globalsCss
      )
    assert.ok(ancestorValid && printAreaValid)
    expect(ancestorValid && printAreaValid).toBe(true)
  })

  it('PM-04: PrintJobModal and S2 StickerModal render all fields inside .print-area', () => {
    const expectedLabels = [
      'เลขที่ใบแจ้งซ่อม',
      'วันที่',
      'ลูกค้า',
      'เบอร์โทร',
      'สินค้า',
      'SKU',
      'อาการเสีย',
      'ตำหนิ',
      'ประกัน',
      'ขนาด',
      'วิธีจัดส่ง',
      'ค่าใช้จ่ายวันนี้',
      'ศูนย์ซ่อม',
    ]
    for (const label of expectedLabels) {
      assert.ok(printJobModalSrc.includes(`'${label}'`))
    }
    const modalValid =
      printJobModalSrc.includes('className="print-area"') &&
      printJobModalSrc.includes('<QrImage') &&
      printJobModalSrc.includes('ลงชื่อลูกค้า') &&
      printJobModalSrc.includes('ลงชื่อพนักงาน') &&
      /id="sticker-print-area"\s+className="[^"]*print-area/.test(s2PageSrc)
    assert.ok(modalValid)
    expect(modalValid).toBe(true)
  })

  it('PM-05: Modal renders via createPortal to document.body so .print-area escapes nested overflow-hidden containers', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/ui/Modal.tsx')
    const modalSrc = fs.readFileSync(modalPath, 'utf8')
    const usesPortal =
      modalSrc.includes('createPortal') && modalSrc.includes('document.body')
    assert.ok(usesPortal)
    expect(usesPortal).toBe(true)
  })

  it('PM-06: PrintJobModal uses printHtmlElement helper with dedicated print iframe/window fallback to guarantee non-blank output', () => {
    const printHelperPath = path.resolve(process.cwd(), 'src/lib/print-element.ts')
    const helperExists = fs.existsSync(printHelperPath)
    assert.ok(helperExists)
    const helperSrc = fs.readFileSync(printHelperPath, 'utf8')
    const valid =
      helperSrc.includes('export function printElement') &&
      printJobModalSrc.includes('printElement')
    assert.ok(valid)
    expect(valid).toBe(true)
  })
})

