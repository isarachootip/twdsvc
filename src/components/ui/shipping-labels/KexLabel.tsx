'use client'

import type { KexLabelData } from '@/lib/shipping-labels/types'
import BarcodeSvg from '@/components/ui/BarcodeSvg'
import QrImage from '@/components/ui/QrImage'

export interface KexLabelProps {
  data: KexLabelData
}

export default function KexLabel({ data }: KexLabelProps) {
  return (
    <div
      className="kex-shipping-label"
      style={{
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#000000',
        border: '2px solid #000000',
        fontFamily: 'var(--font-sarabun), "Sarabun", "TH Sarabun New", "TH Sarabun PSK", sans-serif',
        fontSize: 12,
        lineHeight: 1.3,
        boxSizing: 'border-box',
      }}
    >
      {/* ─── 1. Header: KEX logo & INTL ND ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '2px solid #000' }}>
        <div style={{ border: '2px solid #000', borderRadius: 4, padding: '1px 8px', fontWeight: 900, fontSize: 18, letterSpacing: 0.5 }}>
          KEX
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>INTL</span>
          <span style={{ border: '2px solid #000', padding: '0 6px', fontWeight: 900, fontSize: 14 }}>
            ND
          </span>
        </div>
      </div>

      {/* ─── 2. Top Barcode & Tracking Number ─── */}
      <div style={{ padding: '8px 12px 6px', textAlign: 'center', borderBottom: '2px solid #000' }}>
        <BarcodeSvg value={data.barcodeValue} height={52} />
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1.5, marginTop: 4, fontFamily: 'monospace' }}>
          {data.trackingNo}
        </div>
      </div>

      {/* ─── 3. Sort Code Bar ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.4fr 1fr', borderBottom: '2px solid #000', textAlign: 'center', alignItems: 'center' }}>
        <div style={{ borderRight: '1.5px solid #000', padding: '4px 2px', fontWeight: 900, fontSize: 13 }}>
          {data.sortCodeTop}
        </div>
        <div style={{ borderRight: '1.5px solid #000', padding: '4px 2px', fontWeight: 900, fontSize: 16 }}>
          {data.sortCodeHub}
        </div>
        <div style={{ borderRight: '1.5px solid #000', padding: '4px 2px', fontWeight: 900, fontSize: 16 }}>
          {data.sortCodeSub}
        </div>
        <div style={{ padding: '4px 2px', fontWeight: 800, fontSize: 13 }}>
          {data.pieces}
        </div>
      </div>

      {/* ─── 4. Recipient & QR Code ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr 120px 16px', borderBottom: '2px solid #000', minHeight: 140 }}>
        {/* Left vertical text */}
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 8.5, color: '#333', textAlign: 'center', padding: '4px 0' }}>
          เคอรี่เปลี่ยนเป็นเคอรี่เอ็กซ์
        </div>

        {/* Recipient Details */}
        <div style={{ padding: '8px 10px', borderRight: '1.5px solid #000', fontSize: 11 }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 2 }}>ผู้รับ: {data.recipient.name}</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>โทร: {data.recipient.phone}</div>
          <div style={{ color: '#222', lineHeight: 1.35 }}>ที่อยู่: {data.recipient.address}</div>
          <div style={{ fontWeight: 800, marginTop: 4 }}>[{data.recipient.postalCode}]</div>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
          <QrImage value={data.qrValue} size={106} />
        </div>

        {/* Right vertical text */}
        <div style={{ writingMode: 'vertical-rl', fontSize: 8.5, color: '#333', textAlign: 'center', padding: '4px 0' }}>
          เคอรี่เปลี่ยนเป็นเคอรี่เอ็กซ์
        </div>
      </div>

      {/* ─── 5. Mid Sort Code ─── */}
      <div style={{ padding: '6px 12px', borderBottom: '2px solid #000', fontWeight: 900, fontSize: 28, letterSpacing: 1 }}>
        {data.sortCodeMid}
      </div>

      {/* ─── 6. Footer, Priority Stamp & Metrics ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr 16px', minHeight: 90 }}>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 8.5, color: '#333', textAlign: 'center', padding: '4px 0' }}>
          {data.trackingNo}
        </div>

        <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#222' }}>
            <span>หมายเหตุ: {data.remarks || '-'}</span>
            <span>Act. Wt: {data.actWt || '-'}</span>
            <span>Dim: {data.dim || '-'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>P</span>
              <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1, marginTop: 1 }}>PRIORITY</span>
            </div>
          </div>

          <div style={{ fontSize: 9.5, color: '#444' }}>
            {data.portalCheckedText}
          </div>
        </div>

        <div style={{ writingMode: 'vertical-rl', fontSize: 8.5, color: '#333', textAlign: 'center', padding: '4px 0' }}>
          {data.trackingNo}
        </div>
      </div>
    </div>
  )
}
