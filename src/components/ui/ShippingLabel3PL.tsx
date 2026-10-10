'use client'

import type { ThreePlLabelData } from '@/lib/threepl-label'
import BarcodeSvg from './BarcodeSvg'
import QrImage from './QrImage'

interface ShippingLabel3PLProps {
  data: ThreePlLabelData
}

export default function ShippingLabel3PL({ data }: ShippingLabel3PLProps) {
  return (
    <div
      className="shipping-label-3pl"
      style={{
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#000000',
        border: '2px solid #000000',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 12,
        lineHeight: 1.35,
        boxSizing: 'border-box',
      }}
    >
      {/* ─── 1. Header: Logo, Service, COD status ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', borderBottom: '2px solid #000', minHeight: 52 }}>
        <div style={{ padding: '8px 10px', borderRight: '1.5px solid #000', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>{data.carrierLogoText}</span>
        </div>
        <div style={{ padding: '6px 10px', borderRight: '1.5px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: '#333' }}>บริการ / Service</span>
          <span style={{ fontWeight: 800, fontSize: 15, textTransform: 'uppercase' }}>{data.serviceType}</span>
        </div>
        <div style={{ padding: '6px 8px', background: data.isCod ? '#000000' : '#f4f4f5', color: data.isCod ? '#ffffff' : '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: 0.5 }}>{data.isCod ? 'COD' : 'NON-COD'}</span>
          <span style={{ fontSize: 9 }}>{data.isCod ? 'เก็บเงินปลายทาง' : 'ไม่ต้องเก็บเงิน'}</span>
        </div>
      </div>

      {/* ─── 2. Sort Code & Pcs ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', borderBottom: '2px solid #000', padding: '6px 10px', alignItems: 'center' }}>
        <div style={{ borderRight: '1.5px solid #000', paddingRight: 8 }}>
          <div style={{ fontSize: 10, color: '#444' }}>รหัสคัดแยก / Sort code</div>
          <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: 1, lineHeight: 1.1 }}>{data.sortCode}</div>
        </div>
        <div style={{ textAlign: 'center', paddingLeft: 6 }}>
          <div style={{ fontSize: 10, color: '#444' }}>ชิ้น / Pcs</div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>{data.pieces}</div>
        </div>
      </div>

      {/* ─── 3. Barcode & Tracking Number ─── */}
      <div style={{ borderBottom: '2px solid #000', padding: '10px 14px 8px', textAlign: 'center' }}>
        <BarcodeSvg value={data.barcodeValue} height={56} />
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: 2.5, marginTop: 4, fontFamily: 'monospace' }}>
          {data.trackingNo}
        </div>
      </div>

      {/* ─── 4. Recipient (TO) & Zipcode ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', borderBottom: '2px solid #000' }}>
        <div style={{ padding: '8px 10px', borderRight: '1.5px solid #000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ background: '#000', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 2 }}>ผู้รับ TO</span>
            <span style={{ fontWeight: 700, fontSize: 12 }}>{data.recipient.phone}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>{data.recipient.name}</div>
          <div style={{ fontSize: 11.5, color: '#111', lineHeight: 1.35 }}>{data.recipient.address}</div>
          {data.recipient.remark && (
            <div style={{ fontSize: 10.5, color: '#444', marginTop: 4, fontStyle: 'italic' }}>
              หมายเหตุ: {data.recipient.remark}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#444' }}>รหัสไปรษณีย์</div>
          <div style={{ fontWeight: 900, fontSize: 24, lineHeight: 1.1, margin: '2px 0' }}>{data.recipient.postalCode}</div>
          <div style={{ fontWeight: 700, fontSize: 12 }}>{data.recipient.province}</div>
        </div>
      </div>

      {/* ─── 5. Sender (FROM) ─── */}
      <div style={{ borderBottom: '2px solid #000', padding: '8px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ border: '1px solid #000', fontSize: 9.5, fontWeight: 700, padding: '1px 4px', borderRadius: 2 }}>ผู้ส่ง FROM</span>
            <span style={{ fontWeight: 700, fontSize: 12 }}>{data.sender.name}</span>
          </div>
          <span style={{ fontSize: 11, color: '#333' }}>{data.sender.phone}</span>
        </div>
        <div style={{ fontSize: 11, color: '#222' }}>{data.sender.address}</div>
        <div style={{ fontSize: 9.5, color: '#555', marginTop: 3 }}>{data.sender.remark}</div>
      </div>

      {/* ─── 6 & 7. QR Code, Order Details, and COD Bar ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRight: '1.5px solid #000' }}>
          <QrImage value={data.qrValue} size={90} />
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', borderBottom: '1px solid #000', padding: '4px 6px', fontSize: 10.5 }}>
            <div>
              <div style={{ color: '#555', fontSize: 9 }}>ออเดอร์ / Order</div>
              <div style={{ fontWeight: 700 }}>{data.orderNo}</div>
            </div>
            <div>
              <div style={{ color: '#555', fontSize: 9 }}>วันที่ / Date</div>
              <div style={{ fontWeight: 700 }}>{data.date}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', borderBottom: '1px solid #000', padding: '4px 6px', fontSize: 10.5 }}>
            <div>
              <div style={{ color: '#555', fontSize: 9 }}>น้ำหนัก / Weight</div>
              <div style={{ fontWeight: 700 }}>{data.weightKg}</div>
            </div>
            <div>
              <div style={{ color: '#555', fontSize: 9 }}>ขนาด / Size (cm)</div>
              <div style={{ fontWeight: 700 }}>{data.dimensionsCm}</div>
            </div>
          </div>
          <div style={{ background: '#000000', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
            <div>
              <div style={{ fontSize: 9, lineHeight: 1 }}>ยอดเก็บเงิน</div>
              <div style={{ fontSize: 8.5, color: '#ccc' }}>COD amount</div>
            </div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {data.isCod ? `฿${data.codAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '฿0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
