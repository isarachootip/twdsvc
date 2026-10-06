import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import { encryptSecret, decryptSecret } from '@/lib/config/config-crypto'
import {
  INTEGRATION_FIELDS,
  INTEGRATION_PREFIX,
  FIELD_BY_KEY,
  type IntegrationKey,
} from '@/lib/config/integration-fields'

export type IntegrationValues = Record<IntegrationKey, string>
export type ConfigSource = 'config' | 'env' | 'none'

export interface MaskedField {
  secret: boolean
  set: boolean
  source: ConfigSource
  /** Only present for non-secret fields. */
  value?: string
}

export type IntegrationPatch = Partial<Record<IntegrationKey, string | null>>

const dbKey = (k: IntegrationKey) => `${INTEGRATION_PREFIX}${k}`

async function loadStored(): Promise<Map<IntegrationKey, string>> {
  const rows = await prisma.systemSetting.findMany({ where: { key: { startsWith: INTEGRATION_PREFIX } } })
  const out = new Map<IntegrationKey, string>()
  for (const f of INTEGRATION_FIELDS) {
    const row = rows.find(r => r.key === dbKey(f.key))
    if (!row) continue
    // An undecryptable secret (key changed/tampered) is treated as not set → falls back to .env
    const value = f.secret ? decryptSecret(row.value) : row.value
    if (value) out.set(f.key, value)
  }
  return out
}

/** Effective values for server-side use: saved config first, then .env, else ''. */
export async function getIntegrationConfig(): Promise<IntegrationValues> {
  const stored = await loadStored()
  const out = {} as IntegrationValues
  for (const f of INTEGRATION_FIELDS) out[f.key] = stored.get(f.key) ?? process.env[f.key] ?? ''
  return out
}

/** For the admin UI: secret values are never returned, only whether/where they are set. */
export async function getIntegrationConfigMasked(): Promise<Record<IntegrationKey, MaskedField>> {
  const stored = await loadStored()
  const out = {} as Record<IntegrationKey, MaskedField>
  for (const f of INTEGRATION_FIELDS) {
    const fromConfig = stored.get(f.key)
    const fromEnv = process.env[f.key]
    const source: ConfigSource = fromConfig ? 'config' : fromEnv ? 'env' : 'none'
    const field: MaskedField = { secret: f.secret, set: source !== 'none', source }
    if (!f.secret) field.value = fromConfig ?? fromEnv ?? ''
    out[f.key] = field
  }
  return out
}

/**
 * Patch semantics: secret + '' → keep existing; null → delete (falls back to .env);
 * non-secret + '' → delete override; otherwise validate and store (secrets encrypted).
 * Everything is validated/encrypted first so a bad field cannot cause a partial save.
 */
export async function saveIntegrationConfig(patch: IntegrationPatch): Promise<void> {
  const upserts: Array<{ key: string; value: string }> = []
  const deletes: string[] = []

  for (const [k, raw] of Object.entries(patch)) {
    const def = FIELD_BY_KEY[k as IntegrationKey]
    if (!def) throw new HttpError(400, `ไม่รู้จักค่าตั้ง ${k}`)
    if (raw === undefined) continue
    if (raw === null || (raw === '' && !def.secret)) { deletes.push(dbKey(def.key)); continue }
    if (raw === '') continue // secret left blank = keep existing

    const parsed = def.schema.safeParse(raw)
    if (!parsed.success) throw new HttpError(400, `${def.label}: ${parsed.error.issues[0]?.message ?? 'ค่าไม่ถูกต้อง'}`)
    if (def.secret) {
      try {
        upserts.push({ key: dbKey(def.key), value: encryptSecret(parsed.data) })
      } catch (e) {
        throw new HttpError(400, e instanceof Error ? e.message : 'เข้ารหัสค่าลับไม่สำเร็จ')
      }
    } else {
      upserts.push({ key: dbKey(def.key), value: parsed.data })
    }
  }

  await prisma.$transaction([
    ...deletes.map(key => prisma.systemSetting.deleteMany({ where: { key } })),
    ...upserts.map(u => prisma.systemSetting.upsert({ where: { key: u.key }, update: { value: u.value }, create: u })),
  ])
}
