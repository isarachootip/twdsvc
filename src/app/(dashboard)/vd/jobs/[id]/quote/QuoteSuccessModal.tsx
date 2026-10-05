'use client'

import Modal from '@/components/ui/Modal'
import QuoteDoc from '@/components/jobs/QuoteDoc'
import { QuoteDetail, QuoteJobInfo } from './types'

interface QuoteSuccessModalProps {
  open: boolean
  quote: QuoteDetail | null
  job: QuoteJobInfo
  onClose: () => void
  onSendLon: () => void
}

export default function QuoteSuccessModal({
  open,
  quote,
  job,
  onClose,
  onSendLon,
}: QuoteSuccessModalProps) {
  if (!quote) return null

  return (
    <Modal open={open} onClose={onClose}>
      <QuoteDoc
        q={{
          quoteNo: quote.quoteNo,
          jobNo: job.jobNo,
          customer: job.customerName ?? null,
          product: job.productName,
          branchName: job.branch?.name,
          branchAddress: job.branch?.address,
          lines: quote.lines.map(l => ({
            description: l.description,
            amount: l.unitPrice * l.quantity,
            partWaitDays: l.partWaitDays ?? undefined,
            partWarrantyDays: l.partWarrantyDays ?? undefined,
          })),
          subtotal: quote.subtotal,
          vatAmount: quote.vatAmount,
          total: quote.total,
          repairDays: quote.repairDays,
          repairWarrantyDays: quote.repairWarrantyDays,
          vendorNote: quote.vendorNote,
        }}
      />
      <div className="modal-actions no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          พิมพ์
        </button>
        {quote.total > 0 ? (
          <button type="button" className="btn btn-primary" onClick={onSendLon}>
            ส่งให้ลูกค้าทาง LON
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onClose}>
            กลับไปหน้าคิว
          </button>
        )}
      </div>
    </Modal>
  )
}
