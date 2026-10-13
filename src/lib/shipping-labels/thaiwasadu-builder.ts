import type { JobView } from '@/lib/job-view'
import type { ThaiwasaduLabelData, ThaiwasaduDestination } from './types'

export function formatThaiNumericDate(d: string | Date | null | undefined): string {
  if (!d) return '-'
  const x = new Date(d)
  return x.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  })
}

export function buildThaiwasaduLabel(
  job: JobView,
  options?: { box?: string; now?: Date }
): ThaiwasaduLabelData {
  const isDc = job.channel === 'DC'
  const box = options?.box ?? '1/1'
  const sendDate = formatThaiNumericDate(options?.now ?? new Date())
  const openDate = formatThaiNumericDate(job.openedAt)

  // Branch origin
  const branchName = job.branch.name
  const branchCode = job.branch.nickname || job.branch.name.slice(0, 3).toUpperCase()

  // Vendor destination
  const vendorCode = job.vendor?.centerCode ?? job.vendor?.code ?? 'VD-0001'
  const vendorName = job.vendor?.name ?? 'ศูนย์ซ่อมช่างพันธมิตร'
  const vendorPhone = job.vendor?.phone ?? '02-xxx-xxxx'
  const vendorAddress = job.vendor?.address ?? 'ถ.บางนา-ตราด'

  const destinations: ThaiwasaduDestination[] = []

  if (isDc) {
    // Step 1: DC Warehouse
    destinations.push({
      stepNumber: 1,
      stepType: 'คลังสินค้า DC',
      name: 'คลังสินค้า DC วังน้อย',
      contactPerson: 'หัวหน้าคลัง DC',
      phone: '0x-xxx-xxxx',
      isHighlighted: false,
    })
    // Step 2: Vendor Repair Center (Bordered / Final destination)
    destinations.push({
      stepNumber: 2,
      stepType: `ศูนย์ซ่อม VD - ${vendorCode}`,
      name: vendorName,
      contactPerson: '—',
      phone: vendorPhone,
      address: vendorAddress,
      isHighlighted: true,
    })
  } else {
    // Direct VD (DSD route)
    destinations.push({
      stepType: `ศูนย์ซ่อม VD - ${vendorCode}`,
      name: vendorName,
      contactPerson: '—',
      phone: vendorPhone,
      address: vendorAddress,
      isHighlighted: true,
    })
  }

  return {
    type: isDc ? 'DC' : 'VD',
    headerBadge: isDc ? 'ผ่าน DC' : 'ส่งตรง VD',
    jobNo: job.jobNo,
    qrValue: job.jobNo,
    box,
    origin: {
      name: branchName,
      code: branchCode,
    },
    customer: {
      name: job.customerName ?? 'คุณลูกค้า',
      phone: job.customerPhone ?? '08x-xxx-xxxx',
    },
    symptom: job.symptom ?? 'ไม่มีข้อมูลอาการเสีย',
    openDate,
    destinations,
    product: {
      name: [job.productName, job.brandName ? `(${job.brandName})` : ''].filter(Boolean).join(' ') || job.productName,
      serialNo: job.serialNo ? `S/N: ${job.serialNo}` : 'S/N: -',
      sendDate,
    },
    barcodeValue: job.jobNo,
  }
}
