import type { JobStage } from '@prisma/client'

export type CsCancelPolicy = 'BEFORE_GR' | 'BEFORE_CARRIER'

export interface SlaTierConfig {
  enabled: boolean
  NORMAL: number
  EXPRESS: number
  VIP: number
}

export const DEFAULT_SLA_TIER_CONFIG: SlaTierConfig = {
  enabled: false,
  NORMAL: 1.0,
  EXPRESS: 0.5,
  VIP: 0.3,
}

const CLOSED_STAGES_SET: ReadonlySet<JobStage> = new Set([
  'CLOSED_REPAIRED',
  'CLOSED_NOT_REPAIRED',
  'CANCELLED',
])

/**
 * Checks whether a query string matches either:
 * - New standard job number format: `[BRANCH]-[DDMMYYYY]-[RRRR]` (e.g. `BNA-11102026-0001`, `60920-11102026-0001`)
 * - Legacy job number format: `JB-YYMM-NNNNN` or `STK-YYMM-NNNN` (e.g. `JB-2610-00001`)
 */
export function isJobNoFormat(query: string): boolean {
  const q = (query ?? '').trim()
  if (!q) return false
  if (/^(JB|STK)-\d{4,14}-\d{3,6}$/i.test(q)) return true
  if (/^[A-Z0-9]{2,6}-\d{8}-\d{4,6}$/i.test(q)) return true
  return false
}

export function normalizeCsCancelPolicy(raw?: string | null): CsCancelPolicy {
  return raw === 'BEFORE_CARRIER' ? 'BEFORE_CARRIER' : 'BEFORE_GR'
}

export function getCsCancelAllowedStages(policy: CsCancelPolicy): JobStage[] {
  if (policy === 'BEFORE_CARRIER') {
    return ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT', 'GR_RECEIVED', 'GR_PACKED']
  }
  return ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT']
}

export function canActorCancelJob(
  role: string,
  stage: JobStage,
  policyRaw?: string | null
): { allowed: boolean; message?: string } {
  if (CLOSED_STAGES_SET.has(stage)) {
    return { allowed: false, message: 'ไม่สามารถยกเลิกงานที่ปิดแล้ว' }
  }
  if (role === 'ADMIN') {
    return { allowed: true }
  }
  const policy = normalizeCsCancelPolicy(policyRaw)
  const allowedStages = getCsCancelAllowedStages(policy)
  if (!allowedStages.includes(stage)) {
    return {
      allowed: false,
      message:
        policy === 'BEFORE_CARRIER'
          ? 'CS ยกเลิกได้เฉพาะงานที่ยังไม่ส่งให้ขนส่ง'
          : 'CS ยกเลิกได้เฉพาะงานที่ยังไม่ส่งมอบ GR',
    }
  }
  return { allowed: true }
}

export function parseSlaTierConfig(raw?: string | null): SlaTierConfig {
  if (!raw) return DEFAULT_SLA_TIER_CONFIG
  try {
    const parsed = JSON.parse(raw) as Partial<SlaTierConfig>
    return {
      enabled: Boolean(parsed.enabled),
      NORMAL: Number.isFinite(Number(parsed.NORMAL)) && Number(parsed.NORMAL) > 0 ? Number(parsed.NORMAL) : 1.0,
      EXPRESS: Number.isFinite(Number(parsed.EXPRESS)) && Number(parsed.EXPRESS) > 0 ? Number(parsed.EXPRESS) : 0.5,
      VIP: Number.isFinite(Number(parsed.VIP)) && Number(parsed.VIP) > 0 ? Number(parsed.VIP) : 0.3,
    }
  } catch {
    return DEFAULT_SLA_TIER_CONFIG
  }
}

export function applySlaTierMultiplier(hours: number, tier: string | null | undefined, config: SlaTierConfig): number {
  if (!config.enabled) return hours
  const key = (tier ?? 'NORMAL').toUpperCase()
  const mult = key === 'VIP' ? config.VIP : key === 'EXPRESS' ? config.EXPRESS : config.NORMAL
  return Math.max(1, Math.ceil(hours * mult))
}
