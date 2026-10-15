import type { JobView } from '@/lib/job-view'
import { formatThaiNumericDate } from './thaiwasadu-builder'
import type { ReturnBoxLabelData } from './types'

/**
 * Derives a short 2–5 character branch sort code from nickname, jobNo prefix (e.g. RS4-14102026-0001 -> RS4),
 * or fallback to branch name.
 */
export function deriveBranchSortCode(
  jobNo: string,
  nickname?: string | null,
  branchName?: string | null
): string {
  if (nickname && nickname.trim().length > 0) {
    return nickname.trim().toUpperCase()
  }
  const prefix = jobNo.split('-')[0]?.trim().toUpperCase()
  if (prefix && prefix !== 'RP' && prefix !== 'JOB' && prefix.length >= 2 && prefix.length <= 6) {
    return prefix
  }
  const clean = (branchName ?? '').replace(/^สาขา\s*/, '').trim()
  return clean.slice(0, 3).toUpperCase() || 'TWD'
}

export interface BuildReturnBoxLabelOptions {
  source?: 'VD' | 'DC'
  trackingNo?: string | null
  box?: string
  now?: Date
}

export function buildReturnBoxLabel(
  job: JobView,
  options?: BuildReturnBoxLabelOptions
): ReturnBoxLabelData {
  const source = options?.source ?? 'VD'
  const box = options?.box ?? '1/1'
  const dateText = formatThaiNumericDate(options?.now ?? new Date())
  const rawTracking = options?.trackingNo ?? job.inboundShipment?.trackingNo ?? null
  const branchCode = deriveBranchSortCode(job.jobNo, job.branch.nickname, job.branch.name)

  const vendorCode = job.vendor?.code ?? job.vendor?.centerCode ?? ''
  const vendorName = job.vendor?.name ?? 'ศูนย์ซ่อมพันธมิตร'
  const vendorFull = [vendorCode, vendorName].filter(Boolean).join(' ').trim()

  const isRejected = job.decision === 'REJECTED'
  const repairOutcome = isRejected
    ? 'ลูกค้าไม่อนุมัติซ่อม (คืนสภาพเดิม)'
    : 'ซ่อมเสร็จพร้อมส่งคืน'

  const productDisplay = [
    job.productName,
    job.brandName ? `(${job.brandName})` : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (source === 'DC') {
    return {
      title: 'ใบปะหน้ากล่อง (ขาคืน)',
      subtitle: 'จากคลัง DC วังน้อย → ส่งคืนสาขาไทวัสดุ',
      jobNo: job.jobNo,
      headerBadge: 'ขาคืนสาขา • จากคลัง DC',
      channelLabel: 'รถขนส่งคลัง DC → สาขา',
      box,
      dateText,
      trackingNo: rawTracking,
      origin: {
        roleLabel: 'ต้นทาง (คลังสินค้า DC)',
        name: 'คลังสินค้า DC วังน้อย',
        phone: null,
        address: null,
      },
      destination: {
        roleLabel: 'สาขาปลายทาง (แผนก GR / ศูนย์บริการ CS)',
        name: job.branch.name,
        code: branchCode,
        address: job.branch.address ?? null,
      },
      product: {
        name: productDisplay || job.productName,
        sku: job.sku,
        serialNo: job.serialNo ? `S/N: ${job.serialNo}` : null,
        repairOutcome,
      },
      customer: {
        name: job.customerName ?? 'สต็อกสาขา (S2)',
        phone: job.customerPhone ?? null,
      },
      rows: [
        ['สาขาปลายทาง', job.branch.name],
        ['สินค้า', job.productName],
        ['สถานะงาน', repairOutcome],
      ],
    }
  }

  // Source === 'VD'
  const ch = job.channel
  const channelLabel =
    ch === 'TPL'
      ? '3PL Express'
      : ch === 'DC'
      ? 'DC (ส่งผ่านคลัง DC)'
      : 'สาขา (ส่งมอบ GR)'

  const headerBadge =
    ch === 'TPL'
      ? 'ขาส่งคืน • 3PL'
      : ch === 'DC'
      ? 'ขาส่งคืน • ผ่าน DC'
      : 'ขาส่งคืน • ส่งมอบ GR'

  const subtitle =
    ch === 'TPL' && rawTracking
      ? `จาก ${vendorFull} (Auto Book 3PL #${rawTracking})`
      : `จาก ${vendorFull}`

  return {
    title: 'ใบปะหน้ากล่อง (ขาส่งคืน)',
    subtitle,
    jobNo: job.jobNo,
    headerBadge,
    channelLabel,
    box,
    dateText,
    trackingNo: rawTracking,
    origin: {
      roleLabel: 'ต้นทาง (ศูนย์ซ่อม VD)',
      name: vendorFull,
      phone: job.vendor?.phone ?? null,
      address: job.vendor?.address ?? null,
    },
    destination: {
      roleLabel: ch === 'DC' ? 'ส่งผ่านคลัง DC ไปยังสาขาปลายทาง' : 'สาขาปลายทาง (แผนก GR / ศูนย์บริการ CS)',
      name: job.branch.name,
      code: branchCode,
      address: job.branch.address ?? null,
    },
    product: {
      name: productDisplay || job.productName,
      sku: job.sku,
      serialNo: job.serialNo ? `S/N: ${job.serialNo}` : null,
      repairOutcome,
    },
    customer: {
      name: job.customerName ?? 'สต็อกสาขา (S2)',
      phone: job.customerPhone ?? null,
    },
    rows: [
      ['สาขาปลายทาง', job.branch.name],
      ['ช่องทางส่งคืน', ch === 'TPL' ? '3PL' : ch === 'DC' ? 'DC' : 'สาขา (ส่งมอบ GR)'],
    ],
  }
}

/**
 * Normalizes any legacy LabelData into a rich ReturnBoxLabelData so that
 * PrintLabel always renders the full Thai Watsadu standardized box label.
 */
export function normalizeReturnLabelData(data: ReturnBoxLabelData): ReturnBoxLabelData {
  const rowMap = new Map(data.rows)
  const destBranch = data.destination?.name ?? rowMap.get('สาขาปลายทาง') ?? 'สาขาไทวัสดุ'
  const chFromRow = rowMap.get('ช่องทางส่งคืน')
  const prodFromRow = rowMap.get('สินค้า')
  const code = data.destination?.code ?? deriveBranchSortCode(data.jobNo, null, destBranch)

  const originText = data.origin?.name ?? (data.subtitle ? data.subtitle.replace(/^จาก\s*/, '') : 'ศูนย์ซ่อม / คลังสินค้า')
  const trackingMatch = data.subtitle?.match(/#([A-Za-z0-9-]+)/)
  const trackingNo = data.trackingNo ?? (trackingMatch ? trackingMatch[1] : null)

  return {
    ...data,
    headerBadge: data.headerBadge ?? (chFromRow ? `ขาส่งคืน • ${chFromRow}` : 'ขาส่งคืน (RETURN)'),
    channelLabel: data.channelLabel ?? chFromRow ?? 'ส่งคืนสาขาไทวัสดุ',
    box: data.box ?? '1/1',
    dateText: data.dateText ?? formatThaiNumericDate(new Date()),
    trackingNo,
    origin: data.origin ?? {
      roleLabel: 'ต้นทาง (ผู้ส่งคืน)',
      name: originText,
    },
    destination: data.destination ?? {
      roleLabel: 'สาขาปลายทาง (ไทวัสดุ)',
      name: destBranch,
      code,
    },
    product: data.product ?? (prodFromRow ? { name: prodFromRow } : undefined),
  }
}
