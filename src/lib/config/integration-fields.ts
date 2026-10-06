import { z } from 'zod'

export const INTEGRATION_PREFIX = 'INTEGRATION_'

export const INTEGRATION_KEYS = [
  'LINE_CHANNEL_ID',
  'LINE_CHANNEL_SECRET',
  'LINE_CHANNEL_ACCESS_TOKEN',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'APP_BASE_URL',
] as const

export type IntegrationKey = (typeof INTEGRATION_KEYS)[number]
export type IntegrationGroup = 'line' | 'smtp' | 'general'

export interface IntegrationFieldDef {
  key: IntegrationKey
  label: string
  group: IntegrationGroup
  secret: boolean
  /** Validates (and normalises) a non-empty value. The .env fallback uses the same key name. */
  schema: z.ZodType<string, z.ZodTypeDef, string>
}

const noSpaces = z.string().trim().min(8, 'สั้นเกินไป').max(512).regex(/^\S+$/, 'ห้ามมีช่องว่าง')

export const INTEGRATION_FIELDS: IntegrationFieldDef[] = [
  { key: 'LINE_CHANNEL_ID', label: 'Channel ID', group: 'line', secret: false, schema: z.string().trim().regex(/^\d{6,20}$/, 'ต้องเป็นตัวเลข') },
  { key: 'LINE_CHANNEL_SECRET', label: 'Channel Secret', group: 'line', secret: true, schema: noSpaces },
  { key: 'LINE_CHANNEL_ACCESS_TOKEN', label: 'Channel Access Token', group: 'line', secret: true, schema: noSpaces },
  { key: 'SMTP_HOST', label: 'SMTP Host', group: 'smtp', secret: false, schema: z.string().trim().regex(/^[A-Za-z0-9.-]{1,253}$/, 'ชื่อโฮสต์ไม่ถูกต้อง') },
  {
    key: 'SMTP_PORT', label: 'SMTP Port', group: 'smtp', secret: false,
    schema: z.string().trim().regex(/^\d{1,5}$/, 'พอร์ตต้องเป็นตัวเลข').refine(v => Number(v) >= 1 && Number(v) <= 65535, 'พอร์ตต้องอยู่ระหว่าง 1–65535'),
  },
  { key: 'SMTP_USER', label: 'SMTP User', group: 'smtp', secret: false, schema: z.string().trim().min(1).max(254) },
  { key: 'SMTP_PASS', label: 'SMTP Password', group: 'smtp', secret: true, schema: z.string().min(1).max(512) },
  { key: 'SMTP_FROM', label: 'อีเมลผู้ส่ง (From)', group: 'smtp', secret: false, schema: z.string().trim().min(3).max(254) },
  {
    key: 'APP_BASE_URL', label: 'Base URL ของระบบ', group: 'general', secret: false,
    schema: z.string().trim().url('ต้องเป็น URL เช่น https://svc.example.com').refine(v => /^https?:\/\//.test(v), 'ต้องขึ้นต้นด้วย http:// หรือ https://').transform(v => v.replace(/\/+$/, '')),
  },
]

export const FIELD_BY_KEY: Record<IntegrationKey, IntegrationFieldDef> = Object.fromEntries(
  INTEGRATION_FIELDS.map(f => [f.key, f])
) as Record<IntegrationKey, IntegrationFieldDef>

export function isIntegrationKey(k: string): k is IntegrationKey {
  return (INTEGRATION_KEYS as readonly string[]).includes(k)
}
