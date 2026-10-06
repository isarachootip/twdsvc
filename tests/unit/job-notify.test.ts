import { prisma } from '../../src/lib/db'
import { buildVendorJobMessage, shouldNotifyVendor } from '../../src/lib/services/job-notify-message'
import { findVendorLineRecipients } from '../../src/lib/services/job-notify.service'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function run() {
  console.log('Running job-notify tests...')

  assert(shouldNotifyVendor('GR_PACKED', 'OUTBOUND_TO_VD', 'vc1') === true, 'entering OUTBOUND_TO_VD notifies')
  assert(shouldNotifyVendor('OUTBOUND_TO_VD', 'OUTBOUND_TO_VD', 'vc1') === false, 'no stage change -> no notify')
  assert(shouldNotifyVendor('OUTBOUND_TO_VD', 'VD_INSPECTING', 'vc1') === false, 'other stages ignored')
  assert(shouldNotifyVendor('GR_PACKED', 'OUTBOUND_TO_VD', null) === false, 'no vendor center -> no notify')
  console.log('✔ 1. shouldNotifyVendor rules')

  const msg = buildVendorJobMessage({ jobNo: 'J-001', productName: 'ตู้เย็น', brandName: 'LG' }, 'https://x.test')
  assert(msg.includes('J-001') && msg.includes('ตู้เย็น') && msg.includes('LG'), 'message has job info')
  assert(msg.includes('https://x.test'), 'message has link')
  console.log('✔ 2. buildVendorJobMessage')

  const vc = await prisma.vendorCenter.findFirst({ select: { id: true } })
  if (!vc) { console.log('⚠ 3. skipped (no vendor center in DB)') } else {
    const tag = Date.now().toString(36)
    const mk = (n: string, extra: object) => prisma.user.create({
      data: { username: `jn_${n}_${tag}`, password: 'x', fullName: n, role: 'VD', vendorCenterId: vc.id, ...extra },
    })
    const a = await mk('linked', { lineUserId: `Utest_jn_${tag}_a` })
    const b = await mk('unlinked', {})
    const c = await mk('inactive', { lineUserId: `Utest_jn_${tag}_c`, active: false })
    try {
      const ids = (await findVendorLineRecipients(vc.id)).map((r) => r.id)
      assert(ids.includes(a.id), 'linked active VD included')
      assert(!ids.includes(b.id), 'unlinked excluded')
      assert(!ids.includes(c.id), 'inactive excluded')
      console.log('✔ 3. recipients: linked + active VD only')
    } finally {
      await prisma.user.deleteMany({ where: { id: { in: [a.id, b.id, c.id] } } })
    }
  }
  await prisma.$disconnect()
  console.log('All job-notify tests passed successfully!')
}
run().catch((e) => { console.error(e); process.exit(1) })
