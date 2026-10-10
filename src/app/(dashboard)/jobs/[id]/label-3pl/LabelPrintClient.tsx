'use client'

import Link from 'next/link'
import ShippingLabel3PL from '@/components/ui/ShippingLabel3PL'
import type { ThreePlLabelData } from '@/lib/threepl-label'

export default function LabelPrintClient({ data }: { data: ThreePlLabelData }) {
  return (
    <div style={{ maxWidth: 640, margin: '24px auto', padding: '0 16px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>ใบปะหน้าส่ง 3PL Express</h2>
          <p style={{ fontSize: 13, color: 'var(--text-mute)', margin: '4px 0 0' }}>เลขที่ {data.orderNo} | แทร็กกิ้ง {data.trackingNo}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/jobs`} className="btn">
            ย้อนกลับ
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            🖨️ พิมพ์ (Print)
          </button>
        </div>
      </div>

      <div className="print-area" style={{ display: 'flex', justifyContent: 'center' }}>
        <ShippingLabel3PL data={data} />
      </div>
    </div>
  )
}
