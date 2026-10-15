'use client'

import QrImage from '@/components/ui/QrImage'
import { absUrl } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'
import { useBranding, type BrandingInfo } from '@/lib/hooks/useBranding'

import {
  type RepairReceiptBranchInfo,
  type RepairReceiptData,
  DEFAULT_RECEIPT_REMARKS,
} from './repair-receipt-types'

export type { RepairReceiptBranchInfo, RepairReceiptData }
export const REMARKS = DEFAULT_RECEIPT_REMARKS

function SingleReceiptHalf({
  data,
  copyLabel,
  branding,
}: {
  data: RepairReceiptData
  copyLabel: 'สำหรับลูกค้า' | 'สำหรับบริษัท'
  branding?: BrandingInfo
}) {
  const isReturn = data.docType === 'RETURN'
  const title = isReturn ? 'ใบส่งคืนสินค้าซ่อม' : 'ใบรับแจ้งซ่อมสินค้า'
  const b = data.branch
  const branchCodeDisplay = b.stCode || b.code || '-'
  const branchDisplayName = b.name.startsWith('สาขา') ? b.name : `สาขา${b.name}`
  const addressLine1 = [b.address, b.subdistrict ? `ต.${b.subdistrict}` : null].filter(Boolean).join(' ')
  const addressLine2 = [b.district ? `อ.${b.district}` : null, b.province ? `จ.${b.province}` : null, b.postalCode]
    .filter(Boolean)
    .join(' ')

  const logoSrc = data.logoUrl || branding?.logoUrl || '/images/thaiwatsadu-logo.png'
  const compName = data.companyName || branding?.companyName || b.legalName || 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด'
  const taxIdDisplay = data.taxId || branding?.taxId || '0105555021215'

  return (
    <div className="receipt-half" style={{ fontSize: 11.5, lineHeight: 1.38, color: '#111827', padding: '4mm 6mm' }}>
      {/* Header: Logo + Branch Info + Document No & QR */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 10, alignItems: 'start', marginBottom: 6 }}>
        <div style={{ paddingTop: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={compName}
            style={{ width: 132, height: 'auto', maxHeight: 44, objectFit: 'contain', display: 'block' }}
          />
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.35 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{title}</div>
          <div style={{ fontWeight: 600 }}>
            {compName} ({branchDisplayName})
          </div>
          <div>สาขาที่ {branchCodeDisplay} เลขประจำตัวผู้เสียภาษี {taxIdDisplay}</div>
          {(addressLine1 || addressLine2) && (
            <div>{[addressLine1, addressLine2].filter(Boolean).join(' ')}</div>
          )}
          {b.phone && <div>โทรศัพท์ {b.phone}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ fontSize: 11, textAlign: 'right', whiteSpace: 'nowrap' }}>
            <div><b>เลขที่ :</b> {data.jobNo}</div>
            <div><b>วันที่ :</b> {data.dateText}</div>
          </div>
          {data.trackingUrl && (
            <div style={{ textAlign: 'center' }}>
              <QrImage value={absUrl(data.trackingUrl)} size={56} />
              <div style={{ fontSize: 8.5, color: '#4b5563', marginTop: 1 }}>สแกนติดตามงาน</div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 4, marginBottom: 4 }}>
        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 2 }}>รายละเอียดลูกค้า</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><b>ชื่อ - นามสกุล :</b> {data.customerName || '-'}</div>
          <div><b>เบอร์โทรศัพท์ :</b> {data.customerPhone || '-'}</div>
        </div>
        <div><b>ที่อยู่ :</b> {data.customerAddress || '-'}</div>
      </div>

      {/* Product & Repair Details */}
      <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 4, marginBottom: 4 }}>
        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: 2 }}>รายละเอียดสินค้า</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.6fr 0.9fr 0.6fr', gap: 6, marginBottom: 3 }}>
          <div><b>SKU :</b> {data.sku || '-'}</div>
          <div><b>สินค้า :</b> {data.productName} ({data.brandName})</div>
          <div><b>S/N :</b> {data.serialNo || '-'}</div>
          <div><b>จำนวน :</b> 1 ชิ้น</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 10 }}>
          <div>
            <div><b>เงื่อนไข :</b> {data.hasWarranty ? 'อยู่ในประกัน' : 'ไม่อยู่ในประกัน'}</div>
            <div><b>อาการเสีย :</b> {data.symptom || '-'}</div>
            <div><b>ตำหนิ :</b> {data.defect || '-'}</div>
            {isReturn ? (
              <>
                <div><b>ระยะเวลาการซ่อมประมาณ :</b> {data.repairDays ? `${data.repairDays} วัน` : '-'}</div>
                <div><b>รายการที่ซ่อมเรียบร้อยแล้ว :</b> {data.repairedSummary || data.symptom || '-'}</div>
              </>
            ) : (
              <div>
                <b>ขนาด / การจัดส่ง :</b> {[data.sizeName, data.shippingMethodText].filter(Boolean).join(' · ') || '-'}
              </div>
            )}
          </div>
          <div>
            <div><b>เลขที่ใบแจ้งซ่อม/ส่งซ่อมสินค้า :</b> {data.jobNo}</div>
            {isReturn && <div><b>เลขที่ใบเสนอราคา :</b> {data.quoteNo || '-'}</div>}
            {data.posReceiptNo && <div><b>เลขที่ใบเสร็จ :</b> {data.posReceiptNo}</div>}
            <div>
              <b>{isReturn ? 'ราคาค่าซ่อมจริงที่ลูกค้าชำระ :' : 'ค่าดำเนินการ ณ วันเปิดงาน :'}</b>{' '}
              {fmtBaht(data.amountBaht)} บาท {data.amountBaht > 0 ? (data.paid ? '(ชำระแล้ว)' : '(รอชำระ)') : ''}
            </div>
            <div><b>ผู้รับผิดชอบงานซ่อม (Supplier) :</b> {data.vendorLabel || 'รอกำหนดศูนย์ซ่อม'}</div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 6, marginBottom: 4, textAlign: 'center' }}>
        <div>
          <div style={{ fontWeight: 600 }}>เจ้าหน้าที่บริการลูกค้า ({isReturn ? 'ส่งมอบสินค้าคืน' : 'ได้รับสินค้าเพื่อส่งซ่อม'})</div>
          <div style={{ marginTop: 10 }}>ลงชื่อ ____________________________ วันที่ ______________</div>
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>ลูกค้าลงนาม</div>
          <div style={{ marginTop: 10 }}>ลงชื่อ ____________________________ วันที่ ______________</div>
        </div>
      </div>

      {/* Remarks + Copy Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 3 }}>
        <div style={{ fontSize: 9.5, color: '#374151', lineHeight: 1.3 }}>
          <b>หมายเหตุ :</b>
          {((data.footerNotes && data.footerNotes.length > 0)
            ? data.footerNotes
            : (branding?.footerNotes && branding.footerNotes.length > 0)
              ? branding.footerNotes
              : REMARKS
          ).map((r, i) => (
            <div key={i}>* {r}</div>
          ))}
        </div>
        <div style={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', paddingLeft: 8 }}>
          {copyLabel}
        </div>
      </div>
    </div>
  )
}

export function RepairReceiptDocument({ data }: { data: RepairReceiptData }) {
  const { branding } = useBranding()
  return (
    <div className="repair-receipt-a4" style={{ background: '#ffffff', color: '#111827' }}>
      <SingleReceiptHalf data={data} copyLabel="สำหรับลูกค้า" branding={branding} />
      <div
        className="receipt-cut-line"
        style={{
          borderTop: '1px dashed #9ca3af',
          margin: '2mm 4mm',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <span style={{ background: '#ffffff', padding: '0 8px', fontSize: 9, color: '#6b7280', position: 'relative', top: -7 }}>
          ✂ รอยปรุสำหรับฉีกแบ่งครึ่ง (ส่วนบน: สำหรับลูกค้า / ส่วนล่าง: สำหรับบริษัท)
        </span>
      </div>
      <SingleReceiptHalf data={data} copyLabel="สำหรับบริษัท" branding={branding} />
    </div>
  )
}
