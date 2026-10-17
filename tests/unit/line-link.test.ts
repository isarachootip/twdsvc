import { prisma } from '../../src/lib/db'
import { issueLinkCode, consumeLinkCode, extractLinkCode, getLineLinkStatus } from '../../src/lib/services/line-link.service'
import { saveIntegrationConfig } from '../../src/lib/services/integration-config.service'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}
async function statusOf(fn: () => Promise<unknown>): Promise<number | null> {
  try { await fn() } catch (e) { return (e as { status?: number }).status ?? -1 }
  return null
}

async function run() {
  console.log('Running line-link tests...')
  const tag = Date.now().toString(36)
  const u1 = await prisma.user.create({ data: { username: `ll1_${tag}`, password: 'x', fullName: 'L1', role: 'CS' } })
  const u2 = await prisma.user.create({ data: { username: `ll2_${tag}`, password: 'x', fullName: 'L2', role: 'ADMIN' } })
  const lineA = `Utest_${tag}_A`
  const backupSettings = await prisma.systemSetting.findMany({ where: { key: { startsWith: 'INTEGRATION_' } } })
  try {
    assert(extractLinkCode('  ab23-cd45 ') === 'AB23CD45', 'extract normalises')
    assert(extractLinkCode('hello') === null, 'non-code text ignored')
    console.log('✔ 1. extractLinkCode')

    const { code } = await issueLinkCode(u1.id)
    assert(/^[A-HJ-NP-Z2-9]{8}$/.test(code), 'code format')
    const row = await prisma.lineLinkCode.findFirst({ where: { userId: u1.id } })
    assert(!!row && row.codeHash !== code, 'only hash stored')
    console.log('✔ 2. issue stores hash only')

    const r = await consumeLinkCode(code, lineA)
    assert(r.userId === u1.id, 'linked to u1')
    assert((await prisma.user.findUnique({ where: { id: u1.id } }))?.lineUserId === lineA, 'lineUserId saved')
    console.log('✔ 3. consume links user')

    assert((await statusOf(() => consumeLinkCode(code, lineA))) === 400, 'reuse rejected')
    console.log('✔ 4. single use')

    const { code: c2 } = await issueLinkCode(u2.id)
    assert((await statusOf(() => consumeLinkCode(c2, lineA))) === 409, 'LINE already linked to another user')
    console.log('✔ 5. 409 on duplicate LINE account')

    const { code: c3 } = await issueLinkCode(u2.id)
    await prisma.lineLinkCode.updateMany({ where: { userId: u2.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
    assert((await statusOf(() => consumeLinkCode(c3, `Utest_${tag}_B`))) === 400, 'expired rejected')
    console.log('✔ 6. expired code rejected')

    const { code: c4 } = await issueLinkCode(u2.id)
    const { code: c5 } = await issueLinkCode(u2.id)
    assert((await statusOf(() => consumeLinkCode(c4, `Utest_${tag}_B`))) === 400, 'older code invalidated by newer')
    assert((await consumeLinkCode(c5, `Utest_${tag}_B`)).userId === u2.id, 'newest works')
    console.log('✔ 7. issuing new code invalidates old')

    await saveIntegrationConfig({ LINE_OA_ID: 'twdservice', LINE_CHANNEL_SECRET: null, LINE_CHANNEL_ACCESS_TOKEN: null })
    const st1 = await getLineLinkStatus(u1.id)
    assert(st1.linked === true, 'u1 should be linked')
    assert(typeof st1.linkedAt === 'string' && st1.linkedAt.length > 0, 'linkedAt timestamp should be returned')
    assert(st1.lineOaId === '@twdservice', 'LINE_OA_ID normalised with @ prefix')
    assert(st1.lineAddFriendUrl === 'https://line.me/R/ti/p/@twdservice', 'Add friend URL generated')
    assert(st1.role === 'CS', 'role returned')
    console.log('✔ 8. getLineLinkStatus returns linkedAt, normalized @LINE_OA_ID, and add-friend URL')
  } finally {
    await prisma.systemSetting.deleteMany({ where: { key: { startsWith: 'INTEGRATION_' } } })
    if (backupSettings.length) {
      await prisma.systemSetting.createMany({ data: backupSettings.map(b => ({ key: b.key, value: b.value })) })
    }
    await prisma.user.deleteMany({ where: { id: { in: [u1.id, u2.id] } } })
    await prisma.$disconnect()
  }
  console.log('All line-link tests passed successfully!')
}
run().catch((e) => { console.error(e); process.exit(1) })

