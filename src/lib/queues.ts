// คิวงานของแต่ละส่วนงาน (04 §4 "คิวที่เกิดจาก shipment")
import { NextResponse } from 'next/server'
import { requireUser, handleError } from './api'
import { refreshBreaches } from './sla-engine'
import { loadQueueTabs } from './queue-loader'
import { QUEUES } from './queue-defs'

export { QUEUES, type QueueTabDef } from './queue-defs'

export async function queueHandler(dept: keyof typeof QUEUES, req: Request) {
  try {
    const def = QUEUES[dept]
    const user = await requireUser(def.roles, req)
    await refreshBreaches()
    const sp = new URL(req.url).searchParams
    const { tabs, labels, overdue, kpis } = await loadQueueTabs(dept, user, {
      from: sp.get('from'),
      to: sp.get('to'),
      branchId: sp.get('branchId'),
      vendorCenterId: sp.get('vendorCenterId'),
    })
    return NextResponse.json({ tabs, labels, overdue, kpis, overdueJobs: overdue })
  } catch (e) {
    return handleError(e)
  }
}
