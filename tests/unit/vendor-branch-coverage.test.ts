import { describe, it, expect, setTier } from '../framework/core'
import {
  getSiteCoverageKey,
  isAllOnsiteSelected,
  isSomeOnsiteSelected,
  countOnsiteSelected,
  toggleSingleOnsiteCoverage,
  toggleAllOnsiteCoverage,
  setSiteResponsibleBranch,
  type BranchCoverageSite,
  type BranchCoverageMap,
} from '../../src/lib/vendor-branch-coverage'

setTier('Tier 1')

const MOCK_SITES: BranchCoverageSite[] = [
  { code: 'KCB', nickname: 'KCB' },
  { code: 'KSN', nickname: 'KSN' },
  { code: 'KPT', nickname: 'KPT' },
]

describe('Unit: Vendor Step 5 Branch Coverage Select-All / Deselect-All', () => {
  it('VBCV-01: Resolves site key preferring code and falling back to nickname', () => {
    expect(getSiteCoverageKey({ code: 'KCB', nickname: 'กาญจนบุรี' })).toBe('KCB')
    expect(getSiteCoverageKey({ code: '', nickname: 'KSN' })).toBe('KSN')
  })

  it('VBCV-02: Reports false for empty site list on select-all and indeterminate checks', () => {
    expect(isAllOnsiteSelected([], {})).toBe(false)
    expect(isSomeOnsiteSelected([], {})).toBe(false)
    expect(countOnsiteSelected([], {})).toBe(0)
  })

  it('VBCV-03: Selects all sites when none or some are currently checked', () => {
    const initial: BranchCoverageMap = {
      KCB: { onsite: true, respBranchIdx: 2 },
    }
    expect(isAllOnsiteSelected(MOCK_SITES, initial)).toBe(false)
    expect(isSomeOnsiteSelected(MOCK_SITES, initial)).toBe(true)
    expect(countOnsiteSelected(MOCK_SITES, initial)).toBe(1)

    const afterSelectAll = toggleAllOnsiteCoverage(MOCK_SITES, initial)
    expect(isAllOnsiteSelected(MOCK_SITES, afterSelectAll)).toBe(true)
    expect(isSomeOnsiteSelected(MOCK_SITES, afterSelectAll)).toBe(false)
    expect(countOnsiteSelected(MOCK_SITES, afterSelectAll)).toBe(3)
    // Must preserve previously assigned responsible service center branch index
    expect(afterSelectAll.KCB).toEqual({ onsite: true, respBranchIdx: 2 })
    expect(afterSelectAll.KSN).toEqual({ onsite: true, respBranchIdx: 0 })
    expect(afterSelectAll.KPT).toEqual({ onsite: true, respBranchIdx: 0 })
  })

  it('VBCV-04: Deselects all sites when all are currently checked while preserving respBranchIdx', () => {
    const allChecked: BranchCoverageMap = {
      KCB: { onsite: true, respBranchIdx: 1 },
      KSN: { onsite: true, respBranchIdx: 2 },
      KPT: { onsite: true, respBranchIdx: 0 },
    }
    expect(isAllOnsiteSelected(MOCK_SITES, allChecked)).toBe(true)

    const afterDeselectAll = toggleAllOnsiteCoverage(MOCK_SITES, allChecked)
    expect(isAllOnsiteSelected(MOCK_SITES, afterDeselectAll)).toBe(false)
    expect(isSomeOnsiteSelected(MOCK_SITES, afterDeselectAll)).toBe(false)
    expect(countOnsiteSelected(MOCK_SITES, afterDeselectAll)).toBe(0)
    expect(afterDeselectAll.KCB).toEqual({ onsite: false, respBranchIdx: 1 })
    expect(afterDeselectAll.KSN).toEqual({ onsite: false, respBranchIdx: 2 })
    expect(afterDeselectAll.KPT).toEqual({ onsite: false, respBranchIdx: 0 })
  })

  it('VBCV-05: Toggling filtered subset does not wipe coverage state of non-filtered sites', () => {
    const existing: BranchCoverageMap = {
      KCB: { onsite: true, respBranchIdx: 1 },
      KSN: { onsite: false, respBranchIdx: 0 },
      KPT: { onsite: true, respBranchIdx: 2 },
    }
    const subset: BranchCoverageSite[] = [{ code: 'KCB', nickname: 'KCB' }]

    // Subset is already all selected -> toggling subset unchecks KCB only, keeping KPT checked
    const next = toggleAllOnsiteCoverage(subset, existing)
    expect(next.KCB).toEqual({ onsite: false, respBranchIdx: 1 })
    expect(next.KPT).toEqual({ onsite: true, respBranchIdx: 2 })
    expect(next.KSN).toEqual({ onsite: false, respBranchIdx: 0 })
  })

  it('VBCV-06: Toggles single site onsite state cleanly while preserving respBranchIdx', () => {
    const start: BranchCoverageMap = {
      KCB: { onsite: true, respBranchIdx: 3 },
    }
    const unchecked = toggleSingleOnsiteCoverage('KCB', start)
    expect(unchecked.KCB).toEqual({ onsite: false, respBranchIdx: 3 })

    const checkedNew = toggleSingleOnsiteCoverage('KSN', unchecked)
    expect(checkedNew.KSN).toEqual({ onsite: true, respBranchIdx: 0 })
  })

  it('VBCV-07: Updates responsible service center branch index without losing onsite flag', () => {
    const start: BranchCoverageMap = {
      KCB: { onsite: true, respBranchIdx: 0 },
    }
    const updated = setSiteResponsibleBranch('KCB', 2, start)
    expect(updated.KCB).toEqual({ onsite: true, respBranchIdx: 2 })
  })
})
