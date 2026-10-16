import { z } from 'zod'
import { isCanonicalStoreCode, isEventOrTestSite } from '../../src/lib/sites-query'

export interface SiteCleanupCandidate {
  id: string
  code: string
  name: string
  type: string
  active: boolean
}

export interface SiteCleanupAction {
  id: string
  code: string
  name: string
  reason: string
  canonicalId?: string
  canonicalCode?: string
}

export interface BranchCleanupSnapshot {
  createdAt: string
  entries: Array<{
    id: string
    code: string
    name: string
    activeBefore: boolean
    reason: string
  }>
}

export const branchCleanupSnapshotSchema = z.object({
  createdAt: z.string(),
  entries: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      activeBefore: z.boolean(),
      reason: z.string(),
    })
  ),
})

export function buildBranchCleanupPlan(
  sites: readonly SiteCleanupCandidate[],
  now = new Date()
): {
  actions: SiteCleanupAction[]
  toDeactivateIds: string[]
  snapshot: BranchCleanupSnapshot
} {
  const actions: SiteCleanupAction[] = []
  const byName = new Map<string, SiteCleanupCandidate[]>()

  for (const s of sites) {
    if (s.type !== 'BRANCH') continue
    if (isEventOrTestSite(s)) {
      if (s.active) {
        actions.push({
          id: s.id,
          code: s.code,
          name: s.name,
          reason: 'สาขาอีเวนต์/ทดสอบ (Event/Test Branch)',
        })
      }
      continue
    }
    const norm = s.name.trim().replace(/\s+/g, ' ')
    const group = byName.get(norm) ?? []
    group.push(s)
    byName.set(norm, group)
  }

  for (const [normName, group] of byName.entries()) {
    if (group.length <= 1) continue
    const sorted = [...group].sort((a, b) => {
      const aCanon = isCanonicalStoreCode(a.code) ? 1 : 0
      const bCanon = isCanonicalStoreCode(b.code) ? 1 : 0
      if (aCanon !== bCanon) return bCanon - aCanon
      return a.code.localeCompare(b.code)
    })
    const canonical = sorted[0]
    for (const dup of sorted.slice(1)) {
      if (dup.active) {
        actions.push({
          id: dup.id,
          code: dup.code,
          name: dup.name,
          reason: `ชื่อสาขาซ้ำกับรหัสมาตรฐาน ${canonical.code} (${normName})`,
          canonicalId: canonical.id,
          canonicalCode: canonical.code,
        })
      }
    }
  }

  const toDeactivateIds = actions.map(a => a.id)
  const snapshot: BranchCleanupSnapshot = {
    createdAt: now.toISOString(),
    entries: actions.map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      activeBefore: true,
      reason: a.reason,
    })),
  }

  return { actions, toDeactivateIds, snapshot }
}
