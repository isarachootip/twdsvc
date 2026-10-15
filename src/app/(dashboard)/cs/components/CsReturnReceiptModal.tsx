'use client'

import { PrintJobModal } from '@/app/(dashboard)/cs/new/components/PrintJobModal'
import type { JobView } from '@/lib/job-view'

interface CsReturnReceiptModalProps {
  job: JobView | null
  onClose: () => void
}

export default function CsReturnReceiptModal({ job, onClose }: CsReturnReceiptModalProps) {
  if (!job) return null

  return (
    <PrintJobModal
      open={!!job}
      onClose={onClose}
      saved={{
        jobNo: job.jobNo,
        trackingUrl: `/t/${job.id}`,
        routing: job.vendor ? {
          centerCode: job.vendor.centerCode,
          vendorCode: job.vendor.code,
          vendorName: job.vendor.name,
          channel: job.channel ?? 'DC',
        } : null,
      }}
      activeBranchName={job.branch.name}
      branch={{
        name: job.branch.name,
        code: job.branch.nickname,
        address: job.branch.address ?? undefined,
      }}
      customerName={job.customerName ?? '-'}
      phone={job.customerPhone ?? '-'}
      customerAddress={job.customerAddress ?? '-'}
      product={job.productName}
      brandName={job.brandName}
      sku={job.sku ?? '-'}
      serialNo={job.serialNo ?? '-'}
      symptom={job.symptom ?? '-'}
      defect={'-'}
      warranty={job.hasWarranty ? 'yes' : 'no'}
      sizeName={'-'}
      method={job.shippingMethod === 'EXPRESS' ? 'EXPRESS' : 'STANDARD'}
      totalFee={job.money?.totalCharges ?? 0}
      paid={(job.money?.balance ?? 0) <= 0}
      posReceiptNo={job.money && (job.money.totalPaid > 0) ? 'POS-PAID' : undefined}
      docType="RETURN"
      quoteNo={job.quote?.quoteNo ?? null}
      repairDays={job.quote?.repairDays ?? null}
      repairedSummary={job.decision === 'REJECTED' ? 'ไม่อนุมัติซ่อม — ส่งคืนสภาพเดิม' : 'ซ่อมเสร็จสมบูรณ์'}
      customerSignatureUrl={job.pickupSignatureUrl ?? job.intakeSignatureUrl}
    />
  )
}
