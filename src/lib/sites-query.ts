import { prisma } from './db'

/**
 * Event/temporary branch codes from stores.json that should be hidden from active branch dropdowns:
 * - 60001: สาขาHO-Expo
 * - 60003: สาขาEVENT HO3
 * - 60802: สาขาHO1 Event
 */
export const EVENT_SITE_CODES = ['60001', '60003', '60802'] as const

const EVENT_SITE_CODE_SET: ReadonlySet<string> = new Set(EVENT_SITE_CODES)

const EVENT_SITE_NAMES: ReadonlySet<string> = new Set([
  'สาขาho-expo',
  'สาขาevent ho3',
  'สาขาho1 event',
])

export interface SiteLike {
  code: string
  name: string
  type?: string
}

export function isCanonicalStoreCode(code: string): boolean {
  return /^6\d{4}$/.test(code.trim())
}

export function isEventOrTestSite(site: SiteLike): boolean {
  const code = (site.code ?? '').trim()
  const normName = (site.name ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (EVENT_SITE_CODE_SET.has(code)) return true
  if (EVENT_SITE_NAMES.has(normName)) return true
  if (/^TEST_/i.test(code)) return true
  if (/\b(event|expo)\b/i.test(normName)) return true
  return false
}

/**
 * Filters out event/test branches and deduplicates sites with the same normalized name.
 * When two rows share the same branch name (e.g. legacy "SK3" vs canonical "60919" for "สาขาสุขาภิบาล 3",
 * or legacy "BBT" vs canonical "60918" for "สาขาบางบัวทอง"), prefers the canonical 5-digit `6xxxx` store code.
 */
export function dedupeAndFilterSites<T extends SiteLike>(sites: readonly T[]): T[] {
  const byKey = new Map<string, T>()

  for (const s of sites) {
    if ((s.type ?? 'BRANCH') === 'BRANCH' && isEventOrTestSite(s)) {
      continue
    }
    const normName = s.name.trim().replace(/\s+/g, ' ')
    const key = `${s.type ?? 'BRANCH'}::${normName}`
    const existing = byKey.get(key)

    if (!existing) {
      byKey.set(key, s)
      continue
    }

    if (!isCanonicalStoreCode(existing.code) && isCanonicalStoreCode(s.code)) {
      byKey.set(key, s)
    }
  }

  return [...byKey.values()]
}

export async function queryActiveSitesForDropdown() {
  const rows = await prisma.site.findMany({
    where: { active: true },
    select: {
      id: true,
      code: true,
      nickname: true,
      name: true,
      type: true,
      province: true,
      region: true,
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  })
  return dedupeAndFilterSites(rows)
}

export async function queryActiveBranchSites() {
  const all = await queryActiveSitesForDropdown()
  return all
    .filter(s => s.type === 'BRANCH')
    .sort((a, b) => (a.region ?? '').localeCompare(b.region ?? '', 'th') || a.name.localeCompare(b.name, 'th'))
}
