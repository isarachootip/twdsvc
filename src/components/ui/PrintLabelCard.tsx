'use client'

import QrImage from './QrImage'
import BarcodeSvg from './BarcodeSvg'
import type { ReturnBoxLabelData } from '@/lib/shipping-labels'

export default function PrintLabelCard({
  norm,
  logoSrc,
  companyName,
  barcodeText,
}: {
  norm: ReturnBoxLabelData
  logoSrc: string
  companyName: string
  barcodeText: string
}) {
  const destName = norm.destination?.name ?? ''
  const destHeading = destName.startsWith('สาขา') ? `ไทวัสดุ ${destName}` : destName
  const isBranchDest = destName.startsWith('สาขา')
  const codeHeading = isBranchDest ? 'รหัสสาขา' : 'รหัสปลายทาง'

  return (
    <div
      className="thaiwasadu-shipping-label thaiwasadu-return-label"
      style={{
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#000000',
        border: '2px solid #000000',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontSize: 12,
        lineHeight: 1.35,
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Brand Header: Thai Watsadu Logo & Route Badge */}
      <div
        style={{
          backgroundColor: '#111827',
          color: '#ffffff',
          padding: '7px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          borderBottom: '2px solid #000000',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '2px 6px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={companyName}
              style={{ height: 24, width: 'auto', maxWidth: 96, objectFit: 'contain', display: 'block' }}
            />
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontWeight: 800, fontSize: 11.5, letterSpacing: 0.3 }}>THAIWASADU</div>
            <div style={{ fontSize: 9.5, color: '#e5e7eb' }}>ศูนย์บริการซ่อมไทวัสดุ</div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            fontWeight: 900,
            fontSize: 11.5,
            padding: '3px 9px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
          }}
        >
          ↩ {norm.headerBadge}
        </div>
      </div>

      {/* 2. Document Title & Job Number Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 74px',
          borderBottom: '2px solid #000000',
          padding: '6px 10px',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: '#374151', fontWeight: 700 }}>
            {norm.title} • เลขที่ใบแจ้งซ่อม / JOB NO.
          </div>
          <div style={{ fontWeight: 900, fontSize: 19, letterSpacing: -0.2 }}>{norm.jobNo}</div>
          {norm.product?.repairOutcome && (
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#111827', marginTop: 1 }}>
              สถานะงาน: {norm.product.repairOutcome}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', borderLeft: '1.5px solid #000000', paddingLeft: 8 }}>
          <div style={{ fontSize: 9.5, color: '#4b5563' }}>กล่องที่ / BOX</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{norm.box}</div>
          <div style={{ fontSize: 9, color: '#4b5563' }}>{norm.dateText}</div>
        </div>
      </div>

      {/* 3. Origin (FROM) */}
      <div style={{ borderBottom: '1.5px dashed #000000', padding: '6px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ border: '1px solid #000000', fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>
              ต้นทาง FROM
            </span>
            <span style={{ fontSize: 10, color: '#374151' }}>{norm.origin?.roleLabel}</span>
          </div>
          {norm.trackingNo && (
            <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'monospace' }}>3PL #{norm.trackingNo}</span>
          )}
        </div>
        <div style={{ fontWeight: 800, fontSize: 13, marginTop: 2 }}>{norm.origin?.name}</div>
        {norm.origin?.phone && <div style={{ fontSize: 10, color: '#374151' }}>โทร: {norm.origin.phone}</div>}
      </div>

      {/* 4. Destination (TO + Sort Code) */}
      <div style={{ padding: '8px 10px', borderBottom: '2px solid #000000' }}>
        <div style={{ border: '2px solid #000000', borderRadius: 6, padding: '7px 9px', display: 'grid', gridTemplateColumns: '44px 1fr 72px', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: 7.5, lineHeight: 1 }}>ปลายทาง</span>
            <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1.1, marginTop: 2 }}>TO</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9.5, color: '#374151', fontWeight: 600 }}>{norm.destination?.roleLabel}</div>
            <div style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>{destHeading}</div>
            <div style={{ fontSize: 10.5, color: '#111827', marginTop: 2 }}>
              ช่องทางขนส่ง: <b>{norm.channelLabel}</b>
            </div>
            {norm.destination?.address && <div style={{ fontSize: 9.5, color: '#4b5563', marginTop: 1 }}>{norm.destination.address}</div>}
          </div>
          <div style={{ borderLeft: '2px solid #000000', paddingLeft: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 8.5, color: '#4b5563', fontWeight: 700 }}>{codeHeading}</div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.3, lineHeight: 1.15, wordBreak: 'break-word' }}>{norm.destination?.code}</div>
          </div>
        </div>
      </div>

      {/* 5. Product & Customer Reference */}
      {(norm.product || norm.customer) && (
        <div style={{ borderBottom: '2px solid #000000', padding: '6px 10px', fontSize: 11 }}>
          {norm.product && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div><span style={{ color: '#4b5563' }}>สินค้า: </span><b style={{ fontWeight: 800 }}>{norm.product.name}</b></div>
              {norm.product.serialNo && <span style={{ fontSize: 10, color: '#374151', whiteSpace: 'nowrap' }}>{norm.product.serialNo}</span>}
            </div>
          )}
          {norm.customer && (
            <div style={{ fontSize: 10.5, color: '#1f2937', marginTop: 2 }}>
              <span style={{ color: '#4b5563' }}>อ้างอิงลูกค้า: </span><b>{norm.customer.name}</b>
              {norm.customer.phone ? ` • ${norm.customer.phone}` : ''}
            </div>
          )}
        </div>
      )}

      {/* 6. Dual Scan Zone: QR Code + 1D Barcode */}
      <div style={{ display: 'grid', gridTemplateColumns: '108px 1fr', padding: '8px 10px', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <QrImage value={norm.jobNo} size={92} />
        </div>
        <div style={{ textAlign: 'center', overflow: 'hidden' }}>
          <BarcodeSvg value={barcodeText} height={44} />
          <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{barcodeText}</div>
          <div style={{ fontSize: 9.5, color: '#374151', marginTop: 4, fontWeight: 600 }}>
            ติดหน้ากล่องพัสดุ • สแกนยืนยันรับที่จุดหมายปลายทาง
          </div>
        </div>
      </div>
    </div>
  )
}
