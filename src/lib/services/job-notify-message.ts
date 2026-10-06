/** Stage that hands a job over to the vendor center (see vd_receive in actions-vendor.ts). */
const VENDOR_HANDOVER_STAGE = 'OUTBOUND_TO_VD'

/** Notify only when a job newly enters the vendor handover stage and has a vendor center. */
export function shouldNotifyVendor(
  prevStage: string,
  nextStage: string,
  vendorCenterId: string | null | undefined,
): boolean {
  return Boolean(vendorCenterId) && prevStage !== nextStage && nextStage === VENDOR_HANDOVER_STAGE
}

export function buildVendorJobMessage(
  job: { jobNo: string; productName: string; brandName: string },
  baseUrl: string,
): string {
  return [
    '📦 มีงานซ่อมใหม่ส่งถึงศูนย์ของคุณ',
    `เลขที่งาน: ${job.jobNo}`,
    `สินค้า: ${job.productName} (${job.brandName})`,
    `เปิดดูงาน: ${baseUrl.replace(/\/$/, '')}/vd`,
  ].join('\n')
}
