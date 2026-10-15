'use client'

import { useRef } from 'react'
import Modal from '@/components/ui/Modal'
import QuoteDoc from '@/components/jobs/QuoteDoc'
import { printElement } from '@/lib/print-element'
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
  const printRef = useRef<HTMLDivElement>(null)
  if (!quote) return null

  return (
    <Modal open={open} onClose={onClose} size="wide">
      <div ref={printRef}>
        <QuoteDoc
          q={{
            quoteNo: quote.quoteNo,
            jobNo: job.jobNo,
            customer: job.customerName ?? null,
            customerPhone: job.customerPhone,
            customerAddress: job.customerAddress,
            customerZip: job.customerZip,
            taxInvoiceName: job.taxInvoiceName,
            taxInvoiceId: job.taxInvoiceId,
            taxInvoiceAddr: job.taxInvoiceAddr,
            product: job.productName,
            brandName: job.brandName,
            serialNo: job.serialNo,
            hasWarranty: job.hasWarranty,
            shippingMethod: job.shippingMethod,
            symptom: job.symptom,
            branchName: job.branch?.name,
            branchAddress: job.branch?.address,
            storeManagerName: job.branch?.storeManagerName,
            sentAt: quote.sentAt,
            expiresAt: quote.expiresAt,
            openedAt: job.openedAt,
            operationFeePaid: job.money?.operationFee,
            quoteUrl: job.links?.QUOTE,
            lines: quote.lines.map(l => ({
              type: l.type,
              description: l.description,
              quantity: l.quantity,
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
            managerSignatureUrl: quote.managerSignatureUrl,
            managerSignerName: quote.managerSignerName,
            isManagerProxy: quote.isManagerProxy,
            managerSignedAt: quote.managerSignedAt,
            customerSignatureUrl: quote.customerSignatureUrl,
            customerSignedAt: quote.customerSignedAt,
          }}
        />
      </div>
      <div className="modal-actions no-print">
        <button
          type="button"
          className="btn"
          onClick={() => printElement(printRef.current, `ใบเสนอราคาซ่อม ${quote.quoteNo}`)}
        >
          🖨️ พิมพ์ใบเสนอราคา
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

