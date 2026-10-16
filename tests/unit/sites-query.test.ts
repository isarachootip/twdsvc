import { describe, it, expect, setTier } from '../framework/core'
import { NextRequest } from 'next/server'
import { prisma } from '../../src/lib/db'
import { signAccessToken, runWithAuthToken } from '../../src/lib/auth'
import { dedupeAndFilterSites, isEventOrTestSite, EVENT_SITE_CODES } from '../../src/lib/sites-query'
import { buildBranchCleanupPlan } from '../../scripts/lib/branch-cleanup'
import { GET as getSitesRoute } from '../../src/app/api/sites/route'
import { GET as getPublicSitesRoute } from '../../src/app/api/vendors/public-sites/route'

setTier('Tier 1')

describe('Phase 3.2 — Branch Deduplication, Event Branch Hiding, and Unified Site Source', () => {
  it('SQ-01: isEventOrTestSite flags HO-Expo, EVENT HO3, HO1 Event, and TEST_* branches', () => {
    expect(EVENT_SITE_CODES).toContain('60001')
    expect(EVENT_SITE_CODES).toContain('60003')
    expect(EVENT_SITE_CODES).toContain('60802')
    expect(isEventOrTestSite({ code: '60001', name: 'สาขาHO-Expo' })).toBe(true)
    expect(isEventOrTestSite({ code: '60003', name: 'สาขาEVENT HO3' })).toBe(true)
    expect(isEventOrTestSite({ code: '60802', name: 'สาขาHO1 Event' })).toBe(true)
    expect(isEventOrTestSite({ code: 'TEST_BNA_01', name: 'สาขาบางนา ทดสอบ' })).toBe(true)
    expect(isEventOrTestSite({ code: '60813', name: 'สาขาสำนักงานใหญ่' })).toBe(false)
    expect(isEventOrTestSite({ code: '60919', name: 'สาขาสุขาภิบาล 3' })).toBe(false)
  })

  it('SQ-02: dedupeAndFilterSites removes duplicate branch names ("สาขาสุขาภิบาล 3", "สาขาบางบัวทอง") keeping canonical 6xxxx code', () => {
    const raw = [
      { id: 'legacy_sk', code: 'SK3', name: 'สาขาสุขาภิบาล 3', type: 'BRANCH' as const },
      { id: 'canon_sk', code: '60919', name: 'สาขาสุขาภิบาล 3', type: 'BRANCH' as const },
      { id: 'canon_bbt', code: '60918', name: 'สาขาบางบัวทอง', type: 'BRANCH' as const },
      { id: 'legacy_bbt', code: 'BBT', name: 'สาขาบางบัวทอง', type: 'BRANCH' as const },
      { id: 'ev_1', code: '60001', name: 'สาขาHO-Expo', type: 'BRANCH' as const },
      { id: 'dc_1', code: 'DC01', name: 'คลัง DC กรุงเทพ', type: 'DC' as const },
    ]
    const clean = dedupeAndFilterSites(raw)
    const names = clean.map(s => s.name)
    expect(names.filter(n => n === 'สาขาสุขาภิบาล 3').length).toBe(1)
    expect(names.filter(n => n === 'สาขาบางบัวทอง').length).toBe(1)
    expect(clean.find(s => s.name === 'สาขาสุขาภิบาล 3')?.id).toBe('canon_sk')
    expect(clean.find(s => s.name === 'สาขาบางบัวทอง')?.id).toBe('canon_bbt')
    expect(clean.some(s => s.code === '60001')).toBe(false)
    expect(clean.some(s => s.code === 'DC01')).toBe(true)
  })

  it('SQ-03: buildBranchCleanupPlan plans deactivation of duplicate branch rows and event branches reversibly', () => {
    const plan = buildBranchCleanupPlan([
      { id: 's1', code: 'SK', name: 'สาขาสุขาภิบาล 3', type: 'BRANCH', active: true },
      { id: 's2', code: '60919', name: 'สาขาสุขาภิบาล 3', type: 'BRANCH', active: true },
      { id: 's3', code: '60001', name: 'สาขาHO-Expo', type: 'BRANCH', active: true },
      { id: 's4', code: '60920', name: 'สาขาบางนา', type: 'BRANCH', active: true },
    ])
    expect(plan.toDeactivateIds).toContain('s1')
    expect(plan.toDeactivateIds).toContain('s3')
    expect(plan.toDeactivateIds).not.toContain('s2')
    expect(plan.toDeactivateIds).not.toContain('s4')
  })

  it('SQ-04: /api/sites (BRANCH) and /api/vendors/public-sites return identical active branch list with no duplicates or event branches', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'test_am' } })
    const token = await signAccessToken({
      id: admin.id, username: admin.username, fullName: admin.fullName,
      role: admin.role, siteId: null, vendorCenterId: null,
    })

    await runWithAuthToken(token, async () => {
      const headers = { authorization: `Bearer ${token}` }
      const [sitesRes, pubRes] = await Promise.all([
        getSitesRoute(new NextRequest('http://localhost:3000/api/sites', { headers })),
        getPublicSitesRoute(),
      ])
      expect(sitesRes.status).toBe(200)
      expect(pubRes.status).toBe(200)

      const allSites = (await sitesRes.json()) as Array<{ id: string; code: string; name: string; type: string }>
      const pubSites = (await pubRes.json()) as Array<{ id: string; code: string; name: string }>
      const branchSites = allSites.filter(s => s.type === 'BRANCH')

      expect(branchSites.length).toBe(pubSites.length)
      const uniqueNames = new Set(branchSites.map(s => s.name))
      expect(uniqueNames.size).toBe(branchSites.length)
      expect(branchSites.some(s => ['สาขาHO-Expo', 'สาขาEVENT HO3', 'สาขาHO1 Event'].includes(s.name))).toBe(false)
    })
  })
})
