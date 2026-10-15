import type { JobView } from '@/lib/job-view'
import { formatThaiNumericDate } from './thaiwasadu-builder'
import { buildReturnBoxLabel } from './return-label-builder'
import type { ReturnBoxLabelData } from './types'

export type LogisticsLabelLeg =
  | 'GR_TO_DC'
  | 'DC_TO_VD'
  | 'GR_TO_VD'
  | 'DC_TO_BRANCH'
  | 'VD_RETURN'

export interface BuildLogisticsBoxLabelOptions {
  trackingNo?: string | null
  box?: string
  now?: Date
}

/**
 * สร้างข้อมูลใบปะหน้ากล่องมาตรฐานไทวัสดุ (100×150 มม.) สำหรับทุกเส้นทางขนส่งในฝั่ง DC และ VD
 * รองรับทั้งขารับเข้าคลัง DC, ขาส่งซ่อม VD, และขาส่งคืนกลับสาขา
 */
export function buildLogisticsBoxLabel(
  job: JobView,
  leg: LogisticsLabelLeg,
  options?: BuildLogisticsBoxLabelOptions
): ReturnBoxLabelData {
  if (leg === 'DC_TO_BRANCH') {
    return buildReturnBoxLabel(job, {
      source: 'DC',
      trackingNo: options?.trackingNo,
      box: options?.box,
      now: options?.now,
    })
  }

  if (leg === 'VD_RETURN') {
    return buildReturnBoxLabel(job, {
      source: 'VD',
      trackingNo: options?.trackingNo,
      box: options?.box,
      now: options?.now,
    })
  }

  const box = options?.box ?? '1/1'
  const dateText = formatThaiNumericDate(options?.now ?? new Date())
  const rawTracking = options?.trackingNo ?? job.outboundShipment?.trackingNo ?? null

  const vendorCode = job.vendor?.code ?? job.vendor?.centerCode ?? 'VD'
  const vendorName = job.vendor?.name ?? 'ศูนย์ซ่อมพันธมิตร'
  const vendorFull = [vendorCode, vendorName].filter(Boolean).join(' ').trim()

  const productDisplay = [
    job.productName,
    job.brandName ? `(${job.brandName})` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const warrantyLabel =
    job.type === 'STOCK'
      ? 'งานซ่อมสต็อกสาขา (S2)'
      : job.hasWarranty
      ? 'งานซ่อมในประกัน'
      : 'งานซ่อมนอกประกัน'

  if (leg === 'GR_TO_DC') {
    return {
      title: 'ใบปะหน้ากล่อง (ขารับเข้าคลัง DC)',
      subtitle: `จาก ${job.branch.name} → คลังสินค้า DC วังน้อย`,
      jobNo: job.jobNo,
      headerBadge: 'ขารับเข้า • สาขา → คลัง DC',
      channelLabel: 'รถขนส่ง DC เข้ารับที่สาขา',
      box,
      dateText,
      trackingNo: rawTracking,
      origin: {
        roleLabel: 'ต้นทาง (สาขาไทวัสดุ / แผนก GR)',
        name: `ไทวัสดุ ${job.branch.name}`,
        phone: null,
        address: job.branch.address ?? null,
      },
      destination: {
        roleLabel: 'คลังสินค้าปลายทาง (จุดคัดแยก DC)',
        name: 'คลังสินค้า DC วังน้อย',
        code: 'DC',
        address: job.location ? `Location: ${job.location}` : 'ศูนย์กระจายสินค้าไทวัสดุ วังน้อย',
      },
      product: {
        name: productDisplay || job.productName,
        sku: job.sku,
        serialNo: job.serialNo ? `S/N: ${job.serialNo}` : null,
        repairOutcome: warrantyLabel,
      },
      customer: {
        name: job.customerName ?? 'สต็อกสาขา (S2)',
        phone: job.customerPhone ?? null,
      },
      rows: [
        ['สาขาต้นทาง', job.branch.name],
        ['ปลายทาง', 'คลังสินค้า DC วังน้อย'],
        ['สินค้า', job.productName],
      ],
    }
  }

  // leg === 'DC_TO_VD' || leg === 'GR_TO_VD'
  const isFromDc = leg === 'DC_TO_VD'
  return {
    title: 'ใบปะหน้ากล่อง (ขาส่งซ่อม VD)',
    subtitle: isFromDc
      ? `จากคลังสินค้า DC วังน้อย → ${vendorFull}`
      : `จาก ${job.branch.name} → ${vendorFull}`,
    jobNo: job.jobNo,
    headerBadge: isFromDc ? 'ขาส่งซ่อม • คลัง DC → VD' : 'ขาส่งซ่อม • สาขา → VD',
    channelLabel: isFromDc ? 'รถ VD เข้ารับที่คลัง DC' : 'รถ VD เข้ารับตรงที่สาขา (DSD)',
    box,
    dateText,
    trackingNo: rawTracking,
    origin: isFromDc
      ? {
          roleLabel: 'ต้นทาง (คลังสินค้า DC)',
          name: 'คลังสินค้า DC วังน้อย',
          phone: null,
          address: job.location ? `Location: ${job.location}` : null,
        }
      : {
          roleLabel: 'ต้นทาง (สาขาไทวัสดุ / แผนก GR)',
          name: `ไทวัสดุ ${job.branch.name}`,
          phone: null,
          address: job.branch.address ?? null,
        },
    destination: {
      roleLabel: 'ศูนย์ซ่อมปลายทาง (Vendor Service Center)',
      name: vendorFull,
      code: vendorCode,
      address: job.vendor?.address ?? null,
    },
    product: {
      name: productDisplay || job.productName,
      sku: job.sku,
      serialNo: job.serialNo ? `S/N: ${job.serialNo}` : null,
      repairOutcome: warrantyLabel,
    },
    customer: {
      name: job.customerName ?? 'สต็อกสาขา (S2)',
      phone: job.customerPhone ?? null,
    },
    rows: [
      ['ต้นทาง', isFromDc ? 'คลังสินค้า DC วังน้อย' : job.branch.name],
      ['ศูนย์ซ่อมปลายทาง', vendorFull],
      ['สินค้า', job.productName],
    ],
  }
}
