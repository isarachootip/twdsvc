'use client'

import { useRef } from 'react'
import Modal from './Modal'
import QrImage from './QrImage'
import BarcodeSvg from './BarcodeSvg'
import { useBranding } from '@/lib/hooks/useBranding'
import { printElement } from '@/lib/print-element'
import {
  normalizeReturnLabelData,
  type ReturnBoxLabelData,
} from '@/lib/shipping-labels'

export type LabelData = ReturnBoxLabelData

/**
 * ใบปะหน้ากล่องมาตรฐานไทวัสดุ (ขาส่งคืนจาก VD / คลัง DC กลับสาขาไทวัสดุ)
 * ติดป้ายโลโก้ไทวัสดุชัดเจน พร้อมรหัสคัดแยกสาขา (Branch Sort Code), QR Code และ 1D Barcode
 */
export default function PrintLabel({
  data,
  onClose,
}: {
  data: LabelData | null
  onClose: () => void
}) {
  const printRef = useRef<HTMLDivElement>(null)
  const { branding } = useBranding()

  if (!data) return null

  const norm = normalizeReturnLabelData(data)
  const logoSrc = branding.logoUrl || '/images/thaiwatsadu-logo.png'
  const barcodeText = norm.trackingNo || norm.jobNo

  return (
    <Modal open onClose={onClose} size="narrow" className="shipping-label-modal">
      <div className="no-print" style={{ marginBottom: 10, textAlign: 'center' }}>
        <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>{norm.title}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-mute)', margin: '3px 0 0' }}>
          ป้ายมาตรฐานศูนย์บริการไทวัสดุ (100×150 มม.) สำหรับติดหน้ากล่องพัสดุขาส่งคืน
        </p>
      </div>

      <div ref={printRef} className="print-area" style={{ display: 'flex', justifyContent: 'center' }}>
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
          {/* ─── 1. Brand Header: Thai Watsadu Logo & Return Badge ─── */}
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
                  alt={branding.companyName}
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

          {/* ─── 2. Document Title & Job Number Bar ─── */}
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

          {/* ─── 3. Origin (FROM: VD / DC) ─── */}
          <div style={{ borderBottom: '1.5px dashed #000000', padding: '6px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span
                  style={{
                    border: '1px solid #000000',
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                >
                  ต้นทาง FROM
                </span>
                <span style={{ fontSize: 10, color: '#374151' }}>{norm.origin?.roleLabel}</span>
              </div>
              {norm.trackingNo && (
                <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'monospace' }}>
                  3PL #{norm.trackingNo}
                </span>
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: 13, marginTop: 2 }}>{norm.origin?.name}</div>
            {norm.origin?.phone && (
              <div style={{ fontSize: 10, color: '#374151' }}>โทร: {norm.origin.phone}</div>
            )}
          </div>

          {/* ─── 4. Destination (TO: Thai Watsadu Branch + Sort Code) ─── */}
          <div style={{ padding: '8px 10px', borderBottom: '2px solid #000000' }}>
            <div
              style={{
                border: '2px solid #000000',
                borderRadius: 6,
                padding: '7px 9px',
                display: 'grid',
                gridTemplateColumns: '44px 1fr 68px',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 7.5, lineHeight: 1 }}>ปลายทาง</span>
                <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1.1, marginTop: 2 }}>TO</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 9.5, color: '#374151', fontWeight: 600 }}>
                  {norm.destination?.roleLabel}
                </div>
                <div style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2 }}>
                  ไทวัสดุ {norm.destination?.name}
                </div>
                <div style={{ fontSize: 10.5, color: '#111827', marginTop: 2 }}>
                  ช่องทางส่งคืน: <b>{norm.channelLabel}</b>
                </div>
                {norm.destination?.address && (
                  <div style={{ fontSize: 9.5, color: '#4b5563', marginTop: 1 }}>
                    {norm.destination.address}
                  </div>
                )}
              </div>
              <div
                style={{
                  borderLeft: '2px solid #000000',
                  paddingLeft: 6,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 8.5, color: '#4b5563', fontWeight: 700 }}>รหัสสาขา</div>
                <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 0.5, lineHeight: 1.1 }}>
                  {norm.destination?.code}
                </div>
              </div>
            </div>
          </div>

          {/* ─── 5. Product & Customer Reference ─── */}
          {(norm.product || norm.customer) && (
            <div style={{ borderBottom: '2px solid #000000', padding: '6px 10px', fontSize: 11 }}>
              {norm.product && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <span style={{ color: '#4b5563' }}>สินค้า: </span>
                    <b style={{ fontWeight: 800 }}>{norm.product.name}</b>
                  </div>
                  {norm.product.serialNo && (
                    <span style={{ fontSize: 10, color: '#374151', whiteSpace: 'nowrap' }}>
                      {norm.product.serialNo}
                    </span>
                  )}
                </div>
              )}
              {norm.customer && (
                <div style={{ fontSize: 10.5, color: '#1f2937', marginTop: 2 }}>
                  <span style={{ color: '#4b5563' }}>อ้างอิงลูกค้า: </span>
                  <b>{norm.customer.name}</b>
                  {norm.customer.phone ? ` • ${norm.customer.phone}` : ''}
                </div>
              )}
            </div>
          )}

          {/* ─── 6. Dual Scan Zone: QR Code + 1D Barcode ─── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '108px 1fr',
              padding: '8px 10px',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QrImage value={norm.jobNo} size={92} />
            </div>
            <div style={{ textAlign: 'center', overflow: 'hidden' }}>
              <BarcodeSvg value={barcodeText} height={44} />
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  marginTop: 2,
                }}
              >
                {barcodeText}
              </div>
              <div style={{ fontSize: 9.5, color: '#374151', marginTop: 4, fontWeight: 600 }}>
                ติดหน้ากล่องพัสดุขาส่งคืน • สแกนยืนยันรับที่สาขาปลายทาง
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-actions no-print" style={{ marginTop: 14 }}>
        <button type="button" className="btn" onClick={onClose}>
          ปิด
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => printElement(printRef.current, `${norm.title} ${norm.jobNo}`)}
        >
          🖨️ พิมพ์ใบปะหน้าส่งคืน (Print)
        </button>
      </div>
    </Modal>
  )
}
