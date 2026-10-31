export interface SearchableBranchOption {
  id: string
  name: string
  code?: string | null
  stCode?: string | null
  nickname?: string | null
  nameEn?: string | null
  province?: string | null
  postalCode?: string | null
}

const BRANCH_PREFIX = 'สาขา'

export function normalizeBranchQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .replace(/[(),]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function stripBranchPrefix(text: string): string {
  return text.startsWith(BRANCH_PREFIX) && text.length > BRANCH_PREFIX.length
    ? text.slice(BRANCH_PREFIX.length).trim()
    : text
}

function scoreBranchMatch(opt: SearchableBranchOption, tokens: readonly string[]): number {
  const code = (opt.code ?? '').trim().toLowerCase()
  const stCode = (opt.stCode ?? '').trim().toLowerCase()
  const nickname = (opt.nickname ?? '').trim().toLowerCase()
  const name = opt.name.trim().toLowerCase()
  const coreName = stripBranchPrefix(name)
  const nameEn = (opt.nameEn ?? '').trim().toLowerCase()
  const province = (opt.province ?? '').trim().toLowerCase()
  const postalCode = (opt.postalCode ?? '').trim().toLowerCase()

  const primaryFields = [code, stCode, nickname, name, nameEn].filter(Boolean)
  const allFields = [...primaryFields, province, postalCode].filter(Boolean)

  for (const token of tokens) {
    const alt = stripBranchPrefix(token)
    const matched = allFields.some(f => f.includes(token) || (alt !== token && alt.length > 0 && f.includes(alt)))
    if (!matched) return -1
  }

  const full = tokens.join(' ')
  const cleanFull = stripBranchPrefix(full)

  if ((code && code === full) || (stCode && stCode === full) || (nickname && nickname === full)) return 100
  if ((code && code.startsWith(full)) || (stCode && stCode.startsWith(full)) || (nickname && nickname.startsWith(full))) return 80
  if (name === full || coreName === cleanFull || (nameEn && nameEn === full)) return 70
  if (
    coreName.startsWith(cleanFull) ||
    name.startsWith(full) ||
    (nameEn && nameEn.startsWith(full))
  ) {
    return 60
  }
  if (primaryFields.some(f => f.includes(tokens[0]) || f.includes(stripBranchPrefix(tokens[0])))) return 40
  return 20
}

export function filterBranchOptions<T extends SearchableBranchOption>(
  options: readonly T[],
  query: string,
): T[] {
  const tokens = normalizeBranchQuery(query)
  if (tokens.length === 0) return [...options]

  const scored: Array<{ item: T; score: number; index: number }> = []
  options.forEach((item, index) => {
    const score = scoreBranchMatch(item, tokens)
    if (score >= 0) scored.push({ item, score, index })
  })

  scored.sort((a, b) => b.score - a.score || a.index - b.index)
  return scored.map(s => s.item)
}

export function formatBranchLabel(branch: SearchableBranchOption, showCode = true): string {
  const code = branch.code?.trim()
  if (!showCode || !code) return branch.name
  if (branch.name.includes(`(${code})`)) return branch.name
  return `${branch.name} (${code})`
}
