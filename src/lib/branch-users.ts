import bcrypt from 'bcryptjs'
import { PrismaClient, Role, SiteType } from '@prisma/client'

export const DEFAULT_BRANCH_USER_PASSWORD = '1234'

export interface BranchSiteRef {
  id: string
  code: string
  nickname: string | null
  name: string
}

export interface BranchUserAccountSpec {
  username: string
  fullName: string
  role: Role
  siteId: string
}

/**
 * Normalizes a branch's nickname (or code fallback) into an uppercase alphanumeric prefix
 * suitable for constructing `<SHORTCODE>CS` and `<SHORTCODE>GR` usernames.
 */
export function normalizeBranchShortCode(nickname?: string | null, fallbackCode?: string | null): string {
  const raw = (nickname || fallbackCode || '').trim()
  return raw.toUpperCase().replace(/\s+/g, '')
}

/**
 * Builds the standard CS and GR user account definitions for a single branch site.
 * Example: Bangna (`nickname: "BNA"`, `name: "สาขาบางนา"`) -> `BNACS` and `BNAGR`.
 */
export function buildBranchUserAccounts(branch: BranchSiteRef): BranchUserAccountSpec[] {
  const shortCode = normalizeBranchShortCode(branch.nickname, branch.code)
  if (!shortCode) return []

  const cleanName = branch.name.trim() || shortCode
  return [
    {
      username: `${shortCode}CS`,
      fullName: `CS ${cleanName}`,
      role: Role.CS,
      siteId: branch.id,
    },
    {
      username: `${shortCode}GR`,
      fullName: `GR ${cleanName}`,
      role: Role.GR,
      siteId: branch.id,
    },
  ]
}

/**
 * Ensures `<SHORTCODE>CS` and `<SHORTCODE>GR` users exist for a single branch site.
 */
export async function ensureBranchUsersForSite(
  db: PrismaClient,
  branch: BranchSiteRef & { type?: SiteType | string },
  plainPassword: string = DEFAULT_BRANCH_USER_PASSWORD,
  precomputedHash?: string
): Promise<number> {
  if (branch.type && branch.type !== SiteType.BRANCH) return 0
  if (branch.code.startsWith('TEST_')) return 0

  const specs = buildBranchUserAccounts(branch)
  if (specs.length === 0) return 0

  const passwordHash = precomputedHash ?? (await bcrypt.hash(plainPassword, 12))

  for (const spec of specs) {
    await db.user.upsert({
      where: { username: spec.username },
      update: {
        password: passwordHash,
        fullName: spec.fullName,
        role: spec.role,
        siteId: spec.siteId,
        active: true,
        mustChangePassword: false,
        failedLoginCount: 0,
        lockedUntil: null,
      },
      create: {
        username: spec.username,
        password: passwordHash,
        fullName: spec.fullName,
        role: spec.role,
        siteId: spec.siteId,
        active: true,
        mustChangePassword: false,
      },
    })
  }

  return specs.length
}

/**
 * Syncs `<SHORTCODE>CS` and `<SHORTCODE>GR` users across all active real branches in the database.
 */
export async function syncAllBranchUsers(
  db: PrismaClient,
  plainPassword: string = DEFAULT_BRANCH_USER_PASSWORD
): Promise<{ branchCount: number; userCount: number }> {
  const branches = await db.site.findMany({
    where: {
      type: SiteType.BRANCH,
      NOT: { code: { startsWith: 'TEST_' } },
    },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, nickname: true, name: true, type: true },
  })

  const passwordHash = await bcrypt.hash(plainPassword, 12)
  let userCount = 0

  const chunkSize = 20
  for (let i = 0; i < branches.length; i += chunkSize) {
    const chunk = branches.slice(i, i + chunkSize)
    const counts = await Promise.all(
      chunk.map(branch => ensureBranchUsersForSite(db, branch, plainPassword, passwordHash))
    )
    userCount += counts.reduce((sum, c) => sum + c, 0)
  }

  return { branchCount: branches.length, userCount }
}
