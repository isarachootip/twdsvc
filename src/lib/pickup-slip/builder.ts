import type { JobView } from '@/lib/job-view'
import {
  type PickupRouteType,
  type PickupSlipData,
  type PickupSlipItem,
  type PickupSlipMeta,
  pickupSlipMetaSchema,
} from './types'

export function extractBranchCode(job?: Pick<JobView, 'jobNo' | 'branch'>): string {
  if (!job) return 'BNA'
  const b = job.branch as { code?: string; nickname?: string }
  if (b.nickname && /^[A-Z][A-Z0-9]{1,5}$/i.test(b.nickname)) return b.nickname.toUpperCase()
  if (b.code && /^[A-Z][A-Z0-9]{1,5}$/i.test(b.code)) return b.code.toUpperCase()
  const prefix = job.jobNo.split('-')[0] ?? ''
  if (/^[A-Z]{2,5}$/i.test(prefix) && prefix.toUpperCase() !== 'RP' && prefix.toUpperCase() !== 'JB') {
    return prefix.toUpperCase()
  }
  if (b.code && /^[A-Z0-9]{2,6}$/i.test(b.code)) return b.code.toUpperCase()
  return 'BNA'
}

export function generatePickupSlipNo(
  route: PickupRouteType,
  branchCode: string,
  dateStr?: string,
  seq = 1,
): string {
  const cleanDate = (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr))
    ? dateStr
    : new Date().toISOString().slice(0, 10)
  const [yyyy, mm, dd] = cleanDate.split('-')
  const yymmdd = `${yyyy.slice(-2)}${mm}${dd}`
  const code = (branchCode || 'BNA').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'BNA'
  const nn = String(Math.max(1, seq)).padStart(2, '0')

  if (route === 'GR_TO_DC') return `PU-${yymmdd}-${code}-DC${nn}`
  if (route === 'GR_TO_VD') return `PU-${yymmdd}-${code}-VD${nn}`
  if (route === 'DC_TO_VD') return `PU-${yymmdd}-DC-VD${nn}`
  return `PU-${yymmdd}-DC-${code}${nn}`
}

export function extractPickupSlipMeta(
  events: ReadonlyArray<{ type: string; payload: unknown; createdAt?: Date | string }>,
  legType?: string,
): PickupSlipMeta | null {
  for (const e of events) {
    if (e.type !== 'SHIPMENT_DISPATCHED') continue
    const p = e.payload as Record<string, unknown> | null
    if (!p) continue
    if (legType && typeof p.legType === 'string' && p.legType !== legType) continue
    const raw = p.pickupSlip ?? p
    const parsed = pickupSlipMetaSchema.safeParse(raw)
    if (parsed.success && (parsed.data.pickupSlipNo || parsed.data.driverName || parsed.data.vehiclePlate)) {
      return parsed.data
    }
  }
  return null
}

export function formatPickupItemsText(items: ReadonlyArray<PickupSlipItem>): string {
  return items
    .map(it =>
      [
        it.jobNo,
        it.productName,
        it.serialNo || '-',
        it.customerName || 'สต็อกสาขา',
        it.symptom || '-',
        String(it.boxCount || 1),
        it.branchName || '-',
        it.dcLocation || '-',
      ].join(' | '),
    )
    .join('\n')
}

export function parsePickupItemsText(
  text: string,
  fallbackItems: ReadonlyArray<PickupSlipItem> = [],
): PickupSlipItem[] {
  const byJobNo = new Map(fallbackItems.map(it => [it.jobNo.trim().toLowerCase(), it]))
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|').map(s => s.trim())
      const jobNo = parts[0] || '-'
      const prev = byJobNo.get(jobNo.toLowerCase())
      const boxNum = parseInt(parts[5] ?? '1', 10)
      return {
        jobId: prev?.jobId,
        jobNo,
        productName: parts[1] || prev?.productName || '-',
        serialNo: parts[2] || prev?.serialNo || '-',
        customerName: parts[3] || prev?.customerName || 'สต็อกสาขา',
        symptom: parts[4] || prev?.symptom || '-',
        boxCount: Number.isFinite(boxNum) && boxNum > 0 ? boxNum : prev?.boxCount ?? 1,
        branchName: parts[6] || prev?.branchName || '-',
        dcLocation: parts[7] || prev?.dcLocation || '-',
      }
    })
}

export function formatThaiScheduledDate(dateStr: string, timeStr: string): string {
  if (!dateStr) return timeStr || '-'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const yearNum = parseInt(parts[0], 10)
    const thaiYear = yearNum > 2400 ? yearNum : yearNum + 543
    return `${parts[2]}/${parts[1]}/${thaiYear}${timeStr ? ` ${timeStr} น.` : ''}`
  }
  return `${dateStr}${timeStr ? ` ${timeStr} น.` : ''}`
}

export function buildPickupSlipData(
  jobs: ReadonlyArray<JobView>,
  route: PickupRouteType,
  overrides: Partial<PickupSlipMeta & { printTwoCopies?: boolean; docNo?: string; items?: PickupSlipItem[] }> = {},
): PickupSlipData {
  const first = jobs[0]
  const branchCode = extractBranchCode(first)
  const branchLabel = first ? `${first.branch.name.replace(/^สาขา/, 'สาขา')} (${branchCode})` : 'สาขาบางนา (BNA)'
  const vdName = first?.vendor ? `${first.vendor.name} (${first.vendor.centerCode})` : 'ศูนย์ซ่อม VD'
  const vdPhone = first?.vendor?.phone || '02-xxx-xxxx'
  const saved = (first?.outboundShipment as { pickupSlip?: PickupSlipMeta | null } | null)?.pickupSlip
    ?? (first?.inboundShipment as { pickupSlip?: PickupSlipMeta | null } | null)?.pickupSlip
    ?? null

  const scheduledDate = overrides.scheduledDate ?? saved?.scheduledDate ?? new Date().toISOString().slice(0, 10)
  const scheduledTime = overrides.scheduledTime ?? saved?.scheduledTime ?? '10:00'
  const docNo = overrides.docNo ?? overrides.pickupSlipNo ?? saved?.pickupSlipNo ?? generatePickupSlipNo(route, branchCode, scheduledDate, 1)

  const items: PickupSlipItem[] = overrides.items ?? jobs.map(j => ({
    jobId: j.id,
    jobNo: j.jobNo,
    productName: j.productName,
    serialNo: j.serialNo || '-',
    customerName: j.customerName || 'สต็อกสาขา',
    symptom: j.symptom || '-',
    boxCount: 1,
    branchName: j.branch.name,
    dcLocation: j.location || '-',
  }))

  const totalJobs = items.length
  const totalBoxes = items.reduce((s, it) => s + (it.boxCount || 1), 0)
  const isFromDc = route === 'DC_TO_VD' || route === 'DC_TO_GR'
  const isToVd = route === 'GR_TO_VD' || route === 'DC_TO_VD'

  return {
    route,
    docNo,
    badgeCode: isToVd ? 'VD' : 'DC',
    badgeSub: route === 'GR_TO_DC' ? 'ส่งเข้าคลังกระจายสินค้า' : route === 'GR_TO_VD' ? 'ส่งเข้าศูนย์ซ่อมโดยตรง' : route === 'DC_TO_VD' ? 'รับจากคลังกระจายสินค้า' : 'ส่งคืนสาขาปลายทาง',
    headerTitle: isFromDc ? 'ใบรับสินค้าที่คลัง DC' : 'ใบรับสินค้าที่ GR สาขา',
    headerSub: isFromDc ? 'Pickup Slip — แสดงเอกสารนี้ต่อเจ้าหน้าที่คลัง DC ก่อนรับสินค้า' : 'Pickup Slip — แสดงเอกสารนี้ต่อเจ้าหน้าที่ GR ก่อนรับสินค้า',
    originTag: isFromDc ? 'ต้นทาง · คลัง DC' : 'ต้นทาง · GR สาขา',
    originName: isFromDc ? 'คลังสินค้า DC วังน้อย' : branchLabel,
    originContact: overrides.senderName ?? saved?.senderName ?? (isFromDc ? 'หัวหน้าคลัง DC' : 'เจ้าหน้าที่ GR สาขา'),
    originPhone: overrides.senderPhone ?? saved?.senderPhone ?? '0x-xxx-xxxx',
    destTag: route === 'GR_TO_DC' ? 'ปลายทาง · DC' : isToVd ? 'ปลายทาง · ศูนย์ซ่อม VD' : 'ปลายทาง · GR สาขา',
    destName: route === 'GR_TO_DC' ? 'คลังสินค้า DC วังน้อย' : isToVd ? vdName : branchLabel,
    destContact: overrides.receiverName ?? saved?.receiverName ?? (route === 'GR_TO_DC' ? 'หัวหน้าคลัง DC' : isToVd ? 'เจ้าหน้าที่ศูนย์ซ่อม VD' : 'เจ้าหน้าที่ GR สาขา'),
    destPhone: overrides.receiverPhone ?? saved?.receiverPhone ?? (isToVd ? vdPhone : '0x-xxx-xxxx'),
    driverName: overrides.driverName ?? saved?.driverName ?? 'นายสมศักดิ์ ขับดี',
    driverPhone: overrides.driverPhone ?? saved?.driverPhone ?? '08x-xxx-xxxx',
    vehiclePlate: overrides.vehiclePlate ?? saved?.vehiclePlate ?? '1กข 1234',
    carrierLabel: overrides.carrierLabel ?? saved?.carrierLabel ?? (isToVd ? 'ขนส่ง VD' : 'รถ DC'),
    scheduledDate,
    scheduledTime,
    items,
    totalJobs,
    totalBoxes,
    printTwoCopies: overrides.printTwoCopies ?? true,
    checklistTitle: isFromDc ? 'เช็กลิสต์ ณ จุดส่งมอบ (DC ติ๊กก่อนปล่อยรถ)' : 'เช็กลิสต์ ณ จุดส่งมอบ (GR ติ๊กก่อนปล่อยรถ)',
    sign1Title: isFromDc ? 'ผู้ส่งมอบ (คลัง DC)' : 'ผู้ส่งมอบ (GR สาขา)',
    sign1Sub: isFromDc ? 'เจ้าหน้าที่คลัง DC' : 'เจ้าหน้าที่ GR สาขา',
    sign3Title: route === 'GR_TO_DC' ? 'ผู้รับปลายทาง (DC)' : isToVd ? 'ผู้รับปลายทาง (VD)' : 'ผู้รับปลายทาง (GR สาขา)',
    sign3Sub: route === 'GR_TO_DC' ? 'หัวหน้าคลัง DC' : isToVd ? 'เจ้าหน้าที่ศูนย์ซ่อม VD' : 'เจ้าหน้าที่ GR สาขา',
  }
}
