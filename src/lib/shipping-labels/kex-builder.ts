import type { JobView } from '@/lib/job-view'
import { deriveSortCode, estimatePackageMetrics } from '@/lib/threepl-label'
import type { KexLabelData } from './types'

export function formatKexTracking(raw?: string | null): string {
  if (!raw) return 'KEX 100 150 586 451'
  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 12) {
    const p1 = digits.slice(0, 3)
    const p2 = digits.slice(3, 6)
    const p3 = digits.slice(6, 9)
    const p4 = digits.slice(9, 12)
    return `KEX ${p1} ${p2} ${p3} ${p4}`
  }
  return raw.toUpperCase().startsWith('KEX') ? raw.toUpperCase() : `KEX ${raw.toUpperCase()}`
}

export function buildKexLabel(
  job: JobView,
  options?: { trackingNo?: string | null; now?: Date }
): KexLabelData {
  const now = options?.now ?? new Date()
  const rawTracking = options?.trackingNo ?? job.outboundShipment?.trackingNo ?? 'KEX 100 150 586 451'
  const trackingNo = formatKexTracking(rawTracking)
  const barcodeValue = trackingNo.replace(/\s+/g, '')

  // Recipient is the Vendor Center
  const vendorName = job.vendor?.name ?? 'ศูนย์ซ่อมมาตรฐาน'
  const vendorPhone = job.vendor?.phone ?? '02-xxx-xxxx'
  const vendorAddress = job.vendor?.address ?? 'ถ.บางนา-ตราด'
  
  // Extract postal code if present in address, otherwise default
  const zipMatch = vendorAddress.match(/\b\d{5}\b/)
  const postalCode = zipMatch ? zipMatch[0] : '10260'

  // Derive sort codes
  const baseSort = deriveSortCode(postalCode, job.vendor?.code ?? 'KBB')
  // Format sort codes as in KEX layout: "B3*E1-N14", "KBB", "KBB002"
  const sortCodeTop = 'B3*E1-N14'
  const sortCodeHub = job.vendor?.code?.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase() || 'KBB'
  const sortCodeSub = `${sortCodeHub}002`

  const metrics = estimatePackageMetrics(job.sku)

  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  return {
    type: 'KEX',
    trackingNo,
    barcodeValue,
    sortCodeTop,
    sortCodeHub,
    sortCodeSub,
    pieces: '1 Of 1',
    recipient: {
      name: vendorName,
      phone: vendorPhone,
      address: vendorAddress,
      postalCode,
    },
    qrValue: barcodeValue,
    sortCodeMid: sortCodeTop,
    remarks: job.symptom ? `แจ้งซ่อม: ${job.symptom.slice(0, 30)}` : '',
    actWt: metrics.weight.replace(/[^0-9.]/g, '') || '1.25',
    dim: metrics.dimensions.replace(/×/g, '*'),
    portalCheckedText: `Customer Portal Checked 1st ${dateStr}`,
  }
}
