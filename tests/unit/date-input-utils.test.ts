import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, setTier } from '../framework/core'
import { isoToDisplayDate, displayToIsoDate, formatDateMask } from '../../src/lib/date-input-utils'

setTier('Tier 1')

describe('Unit: Date Input Standard (dd/mm/yyyy)', () => {
  it('DATE-01: isoToDisplayDate converts yyyy-mm-dd and ISO timestamps to dd/mm/yyyy', () => {
    expect(isoToDisplayDate('2026-10-19')).toBe('19/10/2026')
    expect(isoToDisplayDate('2026-01-05')).toBe('05/01/2026')
    expect(isoToDisplayDate('2026-10-19T00:00:00.000Z')).toBe('19/10/2026')
    expect(isoToDisplayDate('')).toBe('')
    expect(isoToDisplayDate(null)).toBe('')
    expect(isoToDisplayDate(undefined)).toBe('')
    expect(isoToDisplayDate('invalid-date')).toBe('')
  })

  it('DATE-02: displayToIsoDate parses valid dd/mm/yyyy and rejects invalid calendar dates', () => {
    expect(displayToIsoDate('19/10/2026')).toBe('2026-10-19')
    expect(displayToIsoDate('05/01/2026')).toBe('2026-01-05')
    expect(displayToIsoDate('29/02/2024')).toBe('2024-02-29')
    expect(displayToIsoDate('29/02/2026')).toBe(null)
    expect(displayToIsoDate('31/04/2026')).toBe(null)
    expect(displayToIsoDate('32/01/2026')).toBe(null)
    expect(displayToIsoDate('00/01/2026')).toBe(null)
    expect(displayToIsoDate('15/13/2026')).toBe(null)
    expect(displayToIsoDate('15/00/2026')).toBe(null)
    expect(displayToIsoDate('19/10/26')).toBe(null)
    expect(displayToIsoDate('')).toBe('')
  })

  it('DATE-03: displayToIsoDate enforces optional min and max ISO bounds', () => {
    expect(displayToIsoDate('18/10/2026', { min: '2026-10-19' })).toBe(null)
    expect(displayToIsoDate('19/10/2026', { min: '2026-10-19' })).toBe('2026-10-19')
    expect(displayToIsoDate('21/10/2026', { max: '2026-10-20' })).toBe(null)
  })

  it('DATE-04: formatDateMask auto-inserts slashes for dd/mm/yyyy typing', () => {
    expect(formatDateMask('19')).toBe('19')
    expect(formatDateMask('1910')).toBe('19/10')
    expect(formatDateMask('19102026')).toBe('19/10/2026')
    expect(formatDateMask('19/10/202699')).toBe('19/10/2026')
    expect(formatDateMask('19a/10b/2026')).toBe('19/10/2026')
  })

  it('DATE-05: Enforces zero raw <input type="date"> outside DateInput.tsx across src/', () => {
    function collectTsxFiles(dir: string): string[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      const files: string[] = []
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          files.push(...collectTsxFiles(full))
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
          files.push(full)
        }
      }
      return files
    }

    const srcDir = path.resolve(process.cwd(), 'src')
    const allFiles = collectTsxFiles(srcDir)
    const rawDateInputFiles: string[] = []
    for (const file of allFiles) {
      const rel = path.relative(srcDir, file).replace(/\\/g, '/')
      if (rel === 'components/ui/DateInput.tsx') continue
      const content = fs.readFileSync(file, 'utf8')
      if (/type\s*=\s*["']date["']/.test(content)) {
        rawDateInputFiles.push(rel)
      }
    }

    expect(rawDateInputFiles.length).toBe(0)
  })
})
