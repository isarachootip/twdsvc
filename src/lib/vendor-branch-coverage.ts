/**
 * Pure domain helpers for Step 5.1 Branch Coverage selection (Select All / Deselect All)
 * Ensures toggling On-site coverage preserves previously assigned service center branch indices.
 */

export interface BranchCoverageSite {
  code: string
  nickname: string
}

export interface BranchCoverageEntry {
  onsite: boolean
  respBranchIdx: number
}

export type BranchCoverageMap = Record<string, BranchCoverageEntry>

export function getSiteCoverageKey(site: BranchCoverageSite): string {
  return site.code || site.nickname
}

export function countOnsiteSelected(
  sites: BranchCoverageSite[],
  coverage: BranchCoverageMap,
): number {
  let count = 0
  for (const s of sites) {
    if (coverage[getSiteCoverageKey(s)]?.onsite) count += 1
  }
  return count
}

export function isAllOnsiteSelected(
  sites: BranchCoverageSite[],
  coverage: BranchCoverageMap,
): boolean {
  if (sites.length === 0) return false
  return sites.every(s => coverage[getSiteCoverageKey(s)]?.onsite === true)
}

export function isSomeOnsiteSelected(
  sites: BranchCoverageSite[],
  coverage: BranchCoverageMap,
): boolean {
  if (sites.length === 0) return false
  const selected = countOnsiteSelected(sites, coverage)
  return selected > 0 && selected < sites.length
}

export function toggleSingleOnsiteCoverage(
  siteKey: string,
  currentCoverage: BranchCoverageMap,
): BranchCoverageMap {
  const cur = currentCoverage[siteKey] || { onsite: false, respBranchIdx: 0 }
  return {
    ...currentCoverage,
    [siteKey]: {
      ...cur,
      onsite: !cur.onsite,
    },
  }
}

export function toggleAllOnsiteCoverage(
  targetSites: BranchCoverageSite[],
  currentCoverage: BranchCoverageMap,
): BranchCoverageMap {
  if (targetSites.length === 0) return currentCoverage
  const nextOnsite = !isAllOnsiteSelected(targetSites, currentCoverage)
  const next: BranchCoverageMap = { ...currentCoverage }

  for (const s of targetSites) {
    const key = getSiteCoverageKey(s)
    const prev = currentCoverage[key]
    next[key] = {
      onsite: nextOnsite,
      respBranchIdx: prev?.respBranchIdx ?? 0,
    }
  }

  return next
}

export function setSiteResponsibleBranch(
  siteKey: string,
  branchIdx: number,
  currentCoverage: BranchCoverageMap,
): BranchCoverageMap {
  const cur = currentCoverage[siteKey] || { onsite: true, respBranchIdx: 0 }
  return {
    ...currentCoverage,
    [siteKey]: {
      ...cur,
      respBranchIdx: branchIdx,
    },
  }
}
