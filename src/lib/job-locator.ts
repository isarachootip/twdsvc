// ค้นหางานจากเลขใบแจ้งซ่อม หรือ เลขใบรับสินค้า (PU-...) ว่าอยู่แท็บไหนของคิว — pure function
export interface JobLocation { tab: string; jobId: string }
export interface MultiJobLocation { tab: string; jobIds: string[] }

interface ScannableShipment {
  pickupSlipNo?: string | null
  pickupSlip?: { pickupSlipNo?: string | null } | null
}

export interface ScannableJob {
  id: string
  jobNo: string
  outboundShipment?: ScannableShipment | null
  inboundShipment?: ScannableShipment | null
}

function matchesSlipOrJob(x: ScannableJob, q: string): boolean {
  if (x.jobNo.toLowerCase() === q) return true
  const outSlip = x.outboundShipment?.pickupSlipNo ?? x.outboundShipment?.pickupSlip?.pickupSlipNo
  if (outSlip && outSlip.toLowerCase() === q) return true
  const inSlip = x.inboundShipment?.pickupSlipNo ?? x.inboundShipment?.pickupSlip?.pickupSlipNo
  if (inSlip && inSlip.toLowerCase() === q) return true
  return false
}

export function findJobTab(
  tabs: Record<string, ReadonlyArray<ScannableJob> | undefined>,
  tabKeys: readonly string[],
  query: string,
): JobLocation | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  for (const tab of tabKeys) {
    const j = tabs[tab]?.find(x => matchesSlipOrJob(x, q))
    if (j) return { tab, jobId: j.id }
  }
  return null
}

export function findJobsByScan(
  tabs: Record<string, ReadonlyArray<ScannableJob> | undefined>,
  tabKeys: readonly string[],
  query: string,
): MultiJobLocation | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  for (const tab of tabKeys) {
    const matches = (tabs[tab] ?? []).filter(x => matchesSlipOrJob(x, q))
    if (matches.length > 0) return { tab, jobIds: matches.map(m => m.id) }
  }
  return null
}

