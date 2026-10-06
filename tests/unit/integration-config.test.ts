import { prisma } from '../../src/lib/db'
import { getSettings } from '../../src/lib/settings'
import {
  getIntegrationConfig,
  getIntegrationConfigMasked,
  saveIntegrationConfig,
} from '../../src/lib/services/integration-config.service'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function rejects(fn: () => Promise<unknown>): Promise<boolean> {
  try { await fn() } catch { return true }
  return false
}

async function cleanup() {
  await prisma.systemSetting.deleteMany({ where: { key: { startsWith: 'INTEGRATION_' } } })
}

async function run() {
  console.log('Running integration-config tests...')
  const savedEnv = { ...process.env }
  const backup = await prisma.systemSetting.findMany({ where: { key: { startsWith: 'INTEGRATION_' } } })
  await cleanup()
  delete process.env.LINE_CHANNEL_SECRET
  delete process.env.SMTP_HOST
  process.env.LINE_CHANNEL_ID = '1111111111'

  try {
    // 1. Fallback to .env when nothing configured
    let cfg = await getIntegrationConfig()
    assert(cfg.LINE_CHANNEL_ID === '1111111111', 'env must be used when config is empty')
    let masked = await getIntegrationConfigMasked()
    assert(masked.LINE_CHANNEL_ID.source === 'env', 'source must be env')
    assert(masked.LINE_CHANNEL_SECRET.source === 'none' && !masked.LINE_CHANNEL_SECRET.set, 'unset secret reports none')
    console.log('✔ 1. Falls back to .env')

    // 2. Config wins over env; secrets are encrypted at rest
    await saveIntegrationConfig({ LINE_CHANNEL_ID: '2222222222', LINE_CHANNEL_SECRET: 'abcdef1234567890', SMTP_PORT: '587' })
    cfg = await getIntegrationConfig()
    assert(cfg.LINE_CHANNEL_ID === '2222222222', 'config must beat env')
    assert(cfg.LINE_CHANNEL_SECRET === 'abcdef1234567890', 'secret must decrypt back')
    const raw = await prisma.systemSetting.findUnique({ where: { key: 'INTEGRATION_LINE_CHANNEL_SECRET' } })
    assert(!!raw && raw.value.startsWith('enc:v1:') && !raw.value.includes('abcdef'), 'secret must be encrypted in DB')
    console.log('✔ 2. Config beats env, secret encrypted at rest')

    // 3. Masked view never returns secret values
    masked = await getIntegrationConfigMasked()
    assert(masked.LINE_CHANNEL_SECRET.set && masked.LINE_CHANNEL_SECRET.source === 'config', 'secret reported as set')
    assert(!JSON.stringify(masked).includes('abcdef1234567890'), 'masked view must not leak secret')
    assert(masked.SMTP_PORT.value === '587', 'non-secret value is returned')
    console.log('✔ 3. Masked view hides secrets')

    // 4. Empty secret = keep, null = delete
    await saveIntegrationConfig({ LINE_CHANNEL_SECRET: '' })
    assert((await getIntegrationConfig()).LINE_CHANNEL_SECRET === 'abcdef1234567890', 'empty secret must keep existing')
    await saveIntegrationConfig({ LINE_CHANNEL_SECRET: null })
    assert((await getIntegrationConfig()).LINE_CHANNEL_SECRET === '', 'null must delete secret')
    await saveIntegrationConfig({ LINE_CHANNEL_ID: '' })
    assert((await getIntegrationConfig()).LINE_CHANNEL_ID === '1111111111', 'empty non-secret removes override → env')
    console.log('✔ 4. Keep / delete semantics')

    // 5. Validation + normalisation
    assert(await rejects(() => saveIntegrationConfig({ SMTP_PORT: '99999' })), 'bad port must be rejected')
    assert(await rejects(() => saveIntegrationConfig({ APP_BASE_URL: 'ftp://x' })), 'bad URL must be rejected')
    await saveIntegrationConfig({ APP_BASE_URL: 'https://svc.example.com/' })
    assert((await getIntegrationConfig()).APP_BASE_URL === 'https://svc.example.com', 'trailing slash stripped')
    console.log('✔ 5. Validation and normalisation')

    // 6. Saving a secret without an encryption key is refused (no plaintext fallback)
    const key = process.env.CONFIG_ENCRYPTION_KEY
    delete process.env.CONFIG_ENCRYPTION_KEY
    assert(await rejects(() => saveIntegrationConfig({ SMTP_PASS: 'hunter2hunter2' })), 'must refuse without key')
    assert((await prisma.systemSetting.findUnique({ where: { key: 'INTEGRATION_SMTP_PASS' } })) === null, 'nothing stored without key')
    process.env.CONFIG_ENCRYPTION_KEY = key
    console.log('✔ 6. No plaintext fallback without key')

    // 7. Does not leak through the generic settings reader
    const all = await getSettings()
    assert(!Object.keys(all).some(k => k.startsWith('INTEGRATION_')), 'getSettings() must not expose INTEGRATION_*')
    console.log('✔ 7. getSettings() filters INTEGRATION_*')
  } finally {
    await cleanup()
    if (backup.length) await prisma.systemSetting.createMany({ data: backup.map(b => ({ key: b.key, value: b.value })) })
    process.env = savedEnv
  }
  console.log('All integration-config tests passed successfully!')
}

run().then(() => process.exit(0)).catch(e => { console.error('integration-config test failed:', e); process.exit(1) })
