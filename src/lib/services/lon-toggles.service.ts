import { prisma } from '@/lib/db'
import { setSetting } from '@/lib/settings'
import {
  DEFAULT_LON_TOGGLES,
  LON_TOGGLES_SETTING_KEY,
  lonEndpointTogglesSchema,
  type LonEndpointToggles,
} from '@/lib/validations/lon.schema'

export async function getLonEndpointToggles(): Promise<LonEndpointToggles> {
  const row = await prisma.systemSetting.findUnique({ where: { key: LON_TOGGLES_SETTING_KEY } })
  if (!row?.value) return { ...DEFAULT_LON_TOGGLES }
  try {
    const parsed = lonEndpointTogglesSchema.safeParse(JSON.parse(row.value))
    return parsed.success ? parsed.data : { ...DEFAULT_LON_TOGGLES }
  } catch {
    return { ...DEFAULT_LON_TOGGLES }
  }
}

export async function saveLonEndpointToggles(input: unknown): Promise<LonEndpointToggles> {
  const validated = lonEndpointTogglesSchema.parse(input)
  await setSetting(LON_TOGGLES_SETTING_KEY, JSON.stringify(validated))
  return validated
}
