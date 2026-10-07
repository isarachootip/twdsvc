// ค้นหางานจากเลขใบแจ้งซ่อม (สแกน QR / ?search=) ว่าอยู่แท็บไหนของคิว — pure function
export interface JobLocation { tab: string; jobId: string }

export function findJobTab(
  tabs: Record<string, ReadonlyArray<{ id: string; jobNo: string }> | undefined>,
  tabKeys: readonly string[],
  query: string,
): JobLocation | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  for (const tab of tabKeys) {
    const j = tabs[tab]?.find(x => x.jobNo.toLowerCase() === q)
    if (j) return { tab, jobId: j.id }
  }
  return null
}
