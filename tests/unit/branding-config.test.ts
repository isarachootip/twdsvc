import assert from 'node:assert'
import { describe, it, expect, setTier } from '../framework/core'
import { SETTING_DEFAULTS, getBrandingSettings, setSetting, getSetting } from '../../src/lib/settings'
import { resolveBrandLogoUrl, DEFAULT_BRANDING } from '../../src/lib/hooks/useBranding'

setTier('Tier 1')

describe('Unit: Branding & Document Configuration', () => {
  it('BC-01: SETTING_DEFAULTS contains fallback branding keys', () => {
    expect(SETTING_DEFAULTS.COMPANY_LOGO_URL).toBe('/images/thaiwatsadu-logo.png')
    expect(SETTING_DEFAULTS.COMPANY_NAME).toBe('บริษัท ซีอาร์ซี ไทวัสดุ จำกัด')
    expect(SETTING_DEFAULTS.COMPANY_TAX_ID).toBe('0105555021215')
    assert.ok(SETTING_DEFAULTS.DOCUMENT_FOOTER_NOTE, 'Footer notes should be configured in defaults')
  })

  it('BC-02: getBrandingSettings returns full branding configuration object', async () => {
    const branding = await getBrandingSettings()
    assert.ok(branding.logoUrl, 'logoUrl must be present')
    assert.ok(branding.companyName, 'companyName must be present')
    assert.ok(branding.taxId, 'taxId must be present')
    assert.ok(Array.isArray(branding.footerNotes), 'footerNotes must be an array')
    assert.ok(branding.footerNotes.length > 0, 'footerNotes should not be empty')
  })

  it('BC-03: Custom branding updates can be saved and retrieved', async () => {
    const originalLogo = await getSetting('COMPANY_LOGO_URL')
    const testLogoUrl = '/api/files/test-logo-sample.png'

    await setSetting('COMPANY_LOGO_URL', testLogoUrl)
    const updated = await getBrandingSettings()
    expect(updated.logoUrl).toBe(testLogoUrl)

    // Restore original setting
    await setSetting('COMPANY_LOGO_URL', originalLogo || SETTING_DEFAULTS.COMPANY_LOGO_URL)
    const restored = await getBrandingSettings()
    expect(restored.logoUrl).toBe(originalLogo || SETTING_DEFAULTS.COMPANY_LOGO_URL)
  })

  it('BC-04: Parsing footer notes handles custom JSON array gracefully', async () => {
    const originalNotes = await getSetting('DOCUMENT_FOOTER_NOTE')
    const customNotes = ['เงื่อนไขพิเศษข้อ 1', 'เงื่อนไขพิเศษข้อ 2']

    await setSetting('DOCUMENT_FOOTER_NOTE', JSON.stringify(customNotes))
    const updated = await getBrandingSettings()
    expect(updated.footerNotes.length).toBe(2)
    expect(updated.footerNotes[0]).toBe('เงื่อนไขพิเศษข้อ 1')

    // Restore original setting
    await setSetting('DOCUMENT_FOOTER_NOTE', originalNotes || SETTING_DEFAULTS.DOCUMENT_FOOTER_NOTE)
  })

  it('BC-05: resolveBrandLogoUrl resolves custom logo URL and falls back to default logo on empty/whitespace', () => {
    expect(resolveBrandLogoUrl('/uploads/custom-logo.png')).toBe('/uploads/custom-logo.png')
    expect(resolveBrandLogoUrl('  /uploads/trimmed.png  ')).toBe('/uploads/trimmed.png')
    expect(resolveBrandLogoUrl('')).toBe(DEFAULT_BRANDING.logoUrl)
    expect(resolveBrandLogoUrl('   ')).toBe(DEFAULT_BRANDING.logoUrl)
    expect(resolveBrandLogoUrl(null)).toBe(DEFAULT_BRANDING.logoUrl)
    expect(resolveBrandLogoUrl(undefined)).toBe(DEFAULT_BRANDING.logoUrl)
  })
})

