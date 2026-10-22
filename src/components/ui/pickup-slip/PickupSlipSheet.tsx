'use client'

import BarcodeSvg from '@/components/ui/BarcodeSvg'
import { formatThaiScheduledDate, type PickupSlipData } from '@/lib/pickup-slip'

export interface PickupSlipSheetProps {
  data: PickupSlipData
  copyLabel?: string
  pageBreakAfter?: boolean
}

export default function PickupSlipSheet({
  data,
  copyLabel = 'ฉบับคนรถ (ถือไปตลอดเส้นทาง)',
  pageBreakAfter = false,
}: PickupSlipSheetProps) {
  const scheduledText = formatThaiScheduledDate(data.scheduledDate, data.scheduledTime)

  return (
    <div
      className="pickup-slip-a4"
      style={{
        width: '100%',
        maxWidth: 760,
        minHeight: 980,
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: '#111827',
        padding: '18px 22px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-sarabun), "Sarabun", "TH Sarabun New", "TH Sarabun PSK", sans-serif',
        fontSize: 12,
        lineHeight: 1.35,
        pageBreakAfter: pageBreakAfter ? 'always' : undefined,
        breakAfter: pageBreakAfter ? 'page' : undefined,
      }}
    >
      <div>
        <div style={{ textAlign: 'right', fontSize: 10.5, color: '#4b5563', marginBottom: 4 }}>
          {copyLabel}
        </div>

        {/* 1. Header Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 125px 1.05fr', border: '1.5px solid #000' }}>
          <div style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: '#374151' }}>
              THAIWASADU SERVICE CENTER
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15, marginTop: 2 }}>
              {data.headerTitle}
            </div>
            <div style={{ fontSize: 10.5, color: '#4b5563', marginTop: 3 }}>
              {data.headerSub}
            </div>
          </div>

          <div style={{ backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{data.badgeCode}</div>
            <div style={{ fontSize: 9.5, marginTop: 3, opacity: 0.92 }}>{data.badgeSub}</div>
          </div>

          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 9.5, color: '#4b5563' }}>เลขที่เอกสาร</div>
            <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', marginBottom: 2 }}>
              {data.docNo}
            </div>
            <BarcodeSvg value={data.docNo} height={34} />
          </div>
        </div>

        {/* 2. Origin -> Destination */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 38px 1fr', borderLeft: '1.5px solid #000', borderRight: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
          <div style={{ padding: '8px 12px' }}>
            <span style={{ display: 'inline-block', border: '1px solid #000', fontSize: 9.5, fontWeight: 700, padding: '0 6px', borderRadius: 2, marginBottom: 3 }}>
              {data.originTag}
            </span>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{data.originName}</div>
            <div style={{ fontSize: 10.5, color: '#374151', marginTop: 2 }}>
              ผู้ส่งมอบ: <b>{data.originContact}</b> · โทร <b>{data.originPhone}</b>
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #000', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
            →
          </div>

          <div style={{ padding: '8px 12px', backgroundColor: '#f5f5f4' }}>
            <span style={{ display: 'inline-block', border: '1px solid #000', backgroundColor: '#fff', fontSize: 9.5, fontWeight: 700, padding: '0 6px', borderRadius: 2, marginBottom: 3 }}>
              {data.destTag}
            </span>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{data.destName}</div>
            <div style={{ fontSize: 10.5, color: '#374151', marginTop: 2 }}>
              ผู้รับ: <b>{data.destContact}</b> · โทร <b>{data.destPhone}</b>
            </div>
          </div>
        </div>

        {/* 3. Driver Info Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.1fr 1.1fr', borderLeft: '1.5px solid #000', borderRight: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
          <div style={{ padding: '6px 10px', borderRight: '1px solid #000' }}>
            <div style={{ fontSize: 9.5, color: '#6b7280' }}>คนรถ</div>
            <div style={{ fontWeight: 800, fontSize: 12.5 }}>{data.driverName || '-'}</div>
          </div>
          <div style={{ padding: '6px 10px', borderRight: '1px solid #000' }}>
            <div style={{ fontSize: 9.5, color: '#6b7280' }}>เบอร์โทร</div>
            <div style={{ fontWeight: 800, fontSize: 12.5 }}>{data.driverPhone || '-'}</div>
          </div>
          <div style={{ padding: '6px 10px', borderRight: '1px solid #000' }}>
            <div style={{ fontSize: 9.5, color: '#6b7280' }}>ทะเบียน / ขนส่ง</div>
            <div style={{ fontWeight: 800, fontSize: 12.5 }}>
              {[data.vehiclePlate, data.carrierLabel].filter(Boolean).join(' · ') || '-'}
            </div>
          </div>
          <div style={{ padding: '6px 10px' }}>
            <div style={{ fontSize: 9.5, color: '#6b7280' }}>นัดรับ</div>
            <div style={{ fontWeight: 800, fontSize: 12.5 }}>{scheduledText}</div>
          </div>
        </div>

        {/* 4. Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, border: '1.5px solid #000', fontSize: 11.5 }}>
          <thead>
            <tr style={{ backgroundColor: '#000', color: '#fff' }}>
              <th style={{ padding: '5px 6px', width: 28, textAlign: 'center' }}>#</th>
              <th style={{ padding: '5px 8px', width: 130, textAlign: 'left' }}>เลขใบแจ้งซ่อม</th>
              <th style={{ padding: '5px 8px', textAlign: 'left' }}>สินค้า / S/N</th>
              <th style={{ padding: '5px 8px', textAlign: 'left' }}>ลูกค้า / อาการเสีย</th>
              <th style={{ padding: '5px 6px', width: 42, textAlign: 'center' }}>กล่อง</th>
              <th style={{ padding: '5px 6px', width: 70, textAlign: 'center' }}>สภาพ</th>
              <th style={{ padding: '5px 6px', width: 48, textAlign: 'center' }}>รับแล้ว</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, idx) => (
              <tr key={`${it.jobNo}-${idx}`} style={{ borderBottom: '1px solid #000' }}>
                <td style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #000' }}>{idx + 1}</td>
                <td style={{ padding: '6px 8px', fontWeight: 800, fontFamily: 'monospace', borderRight: '1px solid #000' }}>{it.jobNo}</td>
                <td style={{ padding: '6px 8px', borderRight: '1px solid #000' }}>
                  <div style={{ fontWeight: 700 }}>{it.productName}</div>
                  <div style={{ fontSize: 10, color: '#4b5563' }}>S/N: {it.serialNo || '-'}</div>
                </td>
                <td style={{ padding: '6px 8px', borderRight: '1px solid #000' }}>
                  <div style={{ fontWeight: 700 }}>{it.customerName}</div>
                  <div style={{ fontSize: 10, color: '#4b5563' }}>{it.symptom || '-'}</div>
                </td>
                <td style={{ padding: '6px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #000' }}>{it.boxCount}</td>
                <td style={{ padding: '4px 6px', fontSize: 10, borderRight: '1px solid #000' }}>
                  <div>☐ ครบ</div>
                  <div>☐ มีรอย</div>
                </td>
                <td style={{ padding: '6px', textAlign: 'center', fontSize: 15 }}>☐</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 5. Summary & Checklist */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 11.5, fontWeight: 700 }}>
          <span style={{ border: '1.2px solid #000', borderRadius: 4, padding: '3px 10px' }}>รวม <b>{data.totalJobs}</b> งาน</span>
          <span style={{ border: '1.2px solid #000', borderRadius: 4, padding: '3px 10px' }}>รวม <b>{data.totalBoxes}</b> กล่อง</span>
          <span style={{ border: '1.2px solid #000', borderRadius: 4, padding: '3px 10px' }}>ปะหน้า 4×4 ติดครบ ☐</span>
        </div>

        <div style={{ border: '1.2px solid #000', padding: '8px 12px', marginTop: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 11.5, marginBottom: 4 }}>{data.checklistTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', fontSize: 11 }}>
            <div>☐ จำนวนกล่องตรงกับรายการ</div>
            <div>☐ ติดปะหน้า 4×4 นิ้ว ครบทุกกล่อง</div>
            <div>☐ ถ่ายรูปสภาพสินค้าก่อนส่งมอบ</div>
            <div>☐ อุปกรณ์เสริมครบ (สายไฟ/รีโมท/แบต)</div>
            <div>☐ ตรวจบัตรประชาชน/บัตรพนักงานคนรถ</div>
            <div>☐ แพ็คกันกระแทกเรียบร้อย</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#f3f4f6', borderLeft: '3px solid #374151', padding: '6px 10px', marginTop: 8, fontSize: 10, color: '#374151' }}>
          เงื่อนไข: คนรถรับผิดชอบสินค้าตั้งแต่ลงนามรับจนส่งมอบถึงปลายทาง · หากพบความเสียหายหรือจำนวนไม่ตรง ให้แจ้งผู้ส่งมอบ/ผู้รับทันทีและบันทึกในช่องหมายเหตุ · ห้ามเปิดกล่องระหว่างทาง
        </div>
      </div>

      {/* 6. Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '1.5px solid #000', marginTop: 18 }}>
        {[
          { no: '➊', title: data.sign1Title, sub: data.sign1Sub },
          { no: '➋', title: 'คนรถ (ผู้รับสินค้า)', sub: `${data.driverName || '-'} · ${data.vehiclePlate || '-'}` },
          { no: '➌', title: data.sign3Title, sub: data.sign3Sub },
        ].map((sig, i) => (
          <div key={sig.no} style={{ padding: '8px 10px', borderRight: i < 2 ? '1px solid #000' : undefined, minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 11 }}>{sig.no} {sig.title}</div>
              <div style={{ fontSize: 10, color: '#4b5563' }}>{sig.sub}</div>
              <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2 }}>วันที่ ___/___/___ เวลา ___:___</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#374151', marginTop: 28 }}>
              <div>........................................................</div>
              <div>ลงชื่อ</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
