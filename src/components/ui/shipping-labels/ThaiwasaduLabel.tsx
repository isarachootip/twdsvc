'use client'

import type { ThaiwasaduLabelData } from '@/lib/shipping-labels/types'
import BarcodeSvg from '@/components/ui/BarcodeSvg'
import QrImage from '@/components/ui/QrImage'
import { useBranding } from '@/lib/hooks/useBranding'

export interface ThaiwasaduLabelProps {
  data: ThaiwasaduLabelData
}

export default function ThaiwasaduLabel({ data }: ThaiwasaduLabelProps) {
  const isDc = data.type === 'DC'
  const { branding } = useBranding()
  const logoSrc = branding.logoUrl || '/images/thaiwatsadu-logo.png'

  return (
    <div
      className="thaiwasadu-shipping-label"
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
      {/* ─── 1. Header: Logo & Channel Badge ─── */}
      <div style={{ backgroundColor: '#000000', color: '#ffffff', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt={branding.companyName}
              style={{ height: 22, width: 'auto', maxWidth: 92, objectFit: 'contain', display: 'block' }}
            />
          </div>
          <span style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.4 }}>THAIWASADU SERVICE CENTER</span>
        </div>
        <span style={{ backgroundColor: '#ffffff', color: '#000000', fontWeight: 800, fontSize: 11.5, padding: '2px 9px', borderRadius: 4, whiteSpace: 'nowrap' }}>
          {data.headerBadge}
        </span>
      </div>


      {/* ─── 2. Job Number, Top QR Code & Box ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 70px', borderBottom: '2px solid #000', padding: '6px 10px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9.5, color: '#444' }}>เลขที่ใบแจ้งซ่อม / JOB NO.</div>
          <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.2 }}>{data.jobNo}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <QrImage value={data.qrValue} size={54} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9.5, color: '#444' }}>กล่องที่ / BOX</div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{data.box}</div>
        </div>
      </div>

      {/* ─── 3. Origin (FROM) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', borderBottom: '1.5px dashed #000', padding: '6px 10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ border: '1px solid #000', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>
            ต้นทาง FROM
          </span>
          <span style={{ fontWeight: 800, fontSize: 14 }}>{data.origin.name}</span>
        </div>
        <div style={{ borderLeft: '1.5px solid #000', textAlign: 'center', fontWeight: 900, fontSize: 18, letterSpacing: 0.5 }}>
          {data.origin.code}
        </div>
      </div>

      {/* ─── 4. Customer Info, Symptom & Open Date ─── */}
      <div style={{ borderBottom: '2px solid #000', padding: '6px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>
            ลูกค้า <span style={{ fontWeight: 800 }}>{data.customer.name}</span> • {data.customer.phone}
          </div>
          <div style={{ fontSize: 10.5, color: '#333' }}>แจ้งซ่อม: {data.openDate}</div>
        </div>
        <div style={{ fontSize: 10.5, color: '#111' }}>
          <span style={{ color: '#555' }}>อาการเสีย</span> {data.symptom}
        </div>
      </div>

      {/* ─── 5. Destinations ─── */}
      <div style={{ padding: '8px 10px', borderBottom: '2px solid #000' }}>
        {isDc ? (
          <>
            {/* Step 1: DC */}
            <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr 20px', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: 7.5, lineHeight: 1 }}>ปลายทาง</span>
                <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>1</span>
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: '#444' }}>{data.destinations[0]?.stepType}</div>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{data.destinations[0]?.name}</div>
                <div style={{ fontSize: 10.5, color: '#222' }}>
                  ผู้รับ: {data.destinations[0]?.contactPerson} • โทร {data.destinations[0]?.phone}
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700 }}>↓</div>
            </div>

            {/* Step 2: Vendor Center (Bordered Active) */}
            <div style={{ border: '2px solid #000', borderRadius: 6, padding: '6px 8px', display: 'grid', gridTemplateColumns: '46px 1fr', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: 7.5, lineHeight: 1 }}>ปลายทาง</span>
                <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>2</span>
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: '#444' }}>{data.destinations[1]?.stepType}</div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>{data.destinations[1]?.name}</div>
                <div style={{ fontSize: 10.5, color: '#222' }}>
                  ผู้รับ: {data.destinations[1]?.contactPerson} • โทร {data.destinations[1]?.phone}
                </div>
                {data.destinations[1]?.address && (
                  <div style={{ fontSize: 9.5, color: '#555' }}>{data.destinations[1]?.address}</div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Single Destination: Direct VD (Image 3) */
          <div style={{ border: '2px solid #000', borderRadius: 6, padding: '10px 10px', minHeight: 92, display: 'grid', gridTemplateColumns: '48px 1fr', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: 7.5, lineHeight: 1 }}>ปลายทาง</span>
              <span style={{ fontSize: 12, lineHeight: 1, marginTop: 2 }}>▶</span>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: '#444' }}>{data.destinations[0]?.stepType}</div>
              <div style={{ fontWeight: 900, fontSize: 15 }}>{data.destinations[0]?.name}</div>
              <div style={{ fontSize: 11, color: '#222' }}>
                ผู้รับ: {data.destinations[0]?.contactPerson} • โทร {data.destinations[0]?.phone}
              </div>
              {data.destinations[0]?.address && (
                <div style={{ fontSize: 10, color: '#555' }}>{data.destinations[0]?.address}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── 6. Footer: Product details & Barcode ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', padding: '6px 10px', alignItems: 'center', gap: 6 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 12 }}>{data.product.name}</div>
          <div style={{ fontSize: 10, color: '#333' }}>{data.product.serialNo}</div>
          <div style={{ fontSize: 10, color: '#555' }}>วันที่ส่ง: {data.product.sendDate}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <BarcodeSvg value={data.barcodeValue} height={42} />
          <div style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: 0.5, marginTop: 2 }}>
            {data.barcodeValue}
          </div>
        </div>
      </div>
    </div>
  )
}
