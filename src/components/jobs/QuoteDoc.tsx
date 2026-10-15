'use client'

import { fmtPhone } from '@/lib/constants'
import { useBranding } from '@/lib/hooks/useBranding'
import {
  computeQuotationFinancials,
  resolveQuoteDates,
} from '@/lib/quotation-format'
import QuotePricingAndFooter from './QuotePricingAndFooter'

export interface QuoteDocData {
  quoteNo: string
  jobNo: string
  customer: string | null
  customerPhone?: string | null
  customerAddress?: string | null
  customerZip?: string | null
  taxInvoiceName?: string | null
  taxInvoiceId?: string | null
  taxInvoiceAddr?: string | null
  product: string
  brandName?: string | null
  serialNo?: string | null
  hasWarranty?: boolean
  shippingMethod?: string | null
  symptom?: string | null
  branchName?: string | null
  branchAddress?: string | null
  storeManagerName?: string | null
  vendorLabel?: string | null
  logoUrl?: string | null
  companyName?: string | null
  taxId?: string | null
  sentAt?: string | Date | null
  expiresAt?: string | Date | null
  openedAt?: string | Date | null
  inspectedAt?: string | Date | null
  operationFeePaid?: number | null
  quoteUrl?: string | null
  lines: Array<{
    description: string
    amount: number
    quantity?: number
    type?: string
    partWarrantyDays?: number
    partWaitDays?: number
  }>
  subtotal: number
  vatAmount: number
  total: number
  repairDays: number
  repairWarrantyDays: number
  vendorNote?: string | null
  status?: string
  managerSignatureUrl?: string | null
  managerSignerName?: string | null
  isManagerProxy?: boolean
  managerSignedAt?: string | Date | null
  customerSignatureUrl?: string | null
  customerSignedAt?: string | Date | null
}

/**
 * เอกสารใบเสนอราคาซ่อมมาตรฐานไทวัสดุ (REPAIR QUOTATION)
 */
export default function QuoteDoc({ q }: { q: QuoteDocData }) {
  const { branding } = useBranding()
  const logoSrc = q.logoUrl || branding.logoUrl || '/images/thaiwatsadu-logo.png'
  const company = q.companyName || branding.companyName

  const dates = resolveQuoteDates({
    sentAt: q.sentAt,
    expiresAt: q.expiresAt,
    openedAt: q.openedAt,
    inspectedAt: q.inspectedAt,
  })

  const fin = computeQuotationFinancials({
    lines: q.lines,
    subtotal: q.subtotal,
    vatAmount: q.vatAmount,
    total: q.total,
    operationFeePaid: q.operationFeePaid,
    hasWarranty: q.hasWarranty,
  })

  const branchDisplay = q.branchName
    ? q.branchName.startsWith('ไทวัสดุ')
      ? q.branchName
      : `ไทวัสดุ ${q.branchName}`
    : 'ไทวัสดุ ศูนย์บริการ'

  const customerAddrFull = [q.customerAddress, q.customerZip].filter(Boolean).join(' ').trim() || '-'
  const productDisplay = [q.product, q.brandName && !q.product.includes(q.brandName) ? q.brandName : null]
    .filter(Boolean)
    .join(' ')

  const taxName = q.taxInvoiceName || q.customer || '-'
  const taxIdText = q.taxInvoiceId || '-'
  const taxAddrText = q.taxInvoiceAddr || (q.customerAddress ? 'ตามที่อยู่ลูกค้าด้านบน' : '-')
  const methodLabel =
    q.shippingMethod === 'EXPRESS'
      ? '🚚 Express · จัดส่งด่วนพิเศษ'
      : '🏬 Carry In · นำสินค้าเข้าซ่อม'

  return (
    <div
      className="print-area quote-doc-a4"
      style={{
        color: '#111827',
        fontSize: 12,
        lineHeight: 1.4,
        backgroundColor: '#ffffff',
      }}
    >
      {/* ─── 1. Header: Logo, Service Center & Title ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '3px solid #dc2626',
          paddingBottom: 10,
          marginBottom: 10,
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={company}
            style={{ width: 118, height: 'auto', maxHeight: 42, objectFit: 'contain', display: 'block' }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15.5, color: '#111827' }}>ไทวัสดุ Service Center</div>
            <div style={{ fontSize: 11.5, color: '#475569' }}>ศูนย์บริการซ่อมไทวัสดุ · โทร 1308</div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#111827', lineHeight: 1.15 }}>
            ใบเสนอราคาซ่อม
          </div>
          <div style={{ fontSize: 10.5, letterSpacing: 0.8, color: '#64748b', fontWeight: 600 }}>
            REPAIR QUOTATION
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', marginTop: 3 }}>
            {methodLabel}
          </div>
        </div>
      </div>

      {/* ─── 2. 6-Cell Metadata Grid (3 cols × 2 rows) ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          rowGap: 6,
          columnGap: 16,
          marginBottom: 10,
          fontSize: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>เลขที่ใบเสนอราคา</div>
          <div style={{ fontWeight: 700 }}>{q.quoteNo}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>เลขที่ใบแจ้งซ่อม</div>
          <div style={{ fontWeight: 700 }}>{q.jobNo}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>สาขาที่รับเรื่อง</div>
          <div style={{ fontWeight: 700 }}>{branchDisplay}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>วันที่เสนอราคา</div>
          <div>{dates.quoteDateText}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>ใช้ได้ถึงวันที่</div>
          <div style={{ fontWeight: 700 }}>{dates.validUntilText}</div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: '#64748b' }}>วันที่ตรวจสินค้า</div>
          <div>{dates.inspectedDateText}</div>
        </div>
      </div>

      {/* ─── 3. Customer Info & Product Info (2 Columns) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 11.5, color: '#b91c1c', marginBottom: 4 }}>ข้อมูลลูกค้า</div>
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', rowGap: 2, fontSize: 11.5 }}>
            <span style={{ color: '#64748b' }}>ชื่อ</span>
            <span style={{ fontWeight: 700 }}>{q.customer || '-'}</span>
            <span style={{ color: '#64748b' }}>โทร</span>
            <span>{q.customerPhone ? fmtPhone(q.customerPhone) : '-'}</span>
            <span style={{ color: '#64748b' }}>ที่อยู่</span>
            <span>{customerAddrFull}</span>
          </div>
        </div>

        <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 11.5, color: '#b91c1c', marginBottom: 4 }}>ข้อมูลสินค้า</div>
          <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', rowGap: 2, fontSize: 11.5 }}>
            <span style={{ color: '#64748b' }}>สินค้า</span>
            <span style={{ fontWeight: 700 }}>{productDisplay}</span>
            <span style={{ color: '#64748b' }}>S/N</span>
            <span>{q.serialNo || '-'}</span>
            <span style={{ color: '#64748b' }}>การรับประกัน</span>
            <span>{q.hasWarranty ? 'อยู่ในประกัน' : 'ไม่มีประกัน'}</span>
          </div>
        </div>
      </div>

      {/* ─── 4. Tax Invoice Info ─── */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 11.5, color: '#b91c1c', marginBottom: 4 }}>
          ข้อมูลสำหรับออกใบกำกับภาษี
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 2, fontSize: 11.5 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr' }}>
            <span style={{ color: '#64748b' }}>ชื่อ</span>
            <span style={{ fontWeight: 700 }}>{taxName}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr' }}>
            <span style={{ color: '#64748b' }}>เลขผู้เสียภาษี</span>
            <span>{taxIdText}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gridColumn: '1 / -1' }}>
            <span style={{ color: '#64748b' }}>ที่อยู่</span>
            <span>{taxAddrText}</span>
          </div>
        </div>
      </div>

      {/* ─── 5. Symptom & Inspection Result ─── */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 11.5, color: '#b91c1c', marginBottom: 4 }}>
          อาการและผลการตรวจ
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 2, fontSize: 11.5 }}>
          <span style={{ color: '#64748b' }}>อาการที่แจ้ง</span>
          <span>{q.symptom || '-'}</span>
          <span style={{ color: '#64748b' }}>ผลการตรวจ</span>
          <span>{q.vendorNote || 'ตรวจสอบตามรายการอะไหล่และบริการด้านล่าง'}</span>
          <span style={{ color: '#64748b' }}>ระยะเวลาซ่อม</span>
          <span>
            ประมาณ {q.repairDays} วัน นับจากอนุมัติ · รับประกันงานซ่อม {q.repairWarrantyDays} วัน
          </span>
        </div>
      </div>

      <QuotePricingAndFooter
        jobNo={q.jobNo}
        fin={fin}
        validUntilText={dates.validUntilText}
        repairWarrantyDays={q.repairWarrantyDays}
        quoteUrl={q.quoteUrl}
        signatures={q}
      />
    </div>
  )
}
