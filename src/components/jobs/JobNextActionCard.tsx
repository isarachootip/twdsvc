'use client'

import Link from 'next/link'
import { fmtBaht } from '@/lib/constants'

interface JobNextActionCardProps {
  job: {
    id: string
    jobNo: string
    stage: string
    type: string
    intakeUnpaid?: boolean
    money?: { intakeBalance?: number; balance?: number }
  }
  role: string
  onPayClick: () => void
}

export function JobNextActionCard({ job, onPayClick }: JobNextActionCardProps) {
  const isIntakeUnpaid = Boolean(job.intakeUnpaid && (job.money?.intakeBalance ?? 0) > 0)

  // 1. รอชำระค่าดำเนินการ
  if (isIntakeUnpaid && ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'].includes(job.stage)) {
    return (
      <div
        style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#92400e' }}>
            📌 ขั้นตอนถัดไป: รอชำระค่าดำเนินการ
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 6 }}>
            ยอดค้าง: {fmtBaht(job.money?.intakeBalance ?? 0)}
          </span>
        </div>
        <p style={{ margin: '6px 0 10px', fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>
          งานนี้มีค่าใช้จ่ายวันเปิดงานที่ยังค้างชำระ ลูกค้าต้องชำระเงินก่อน แผนก GR จึงจะสามารถกดทำรับสินค้าเข้าคลังได้
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onPayClick}
          style={{ fontSize: 12.5, padding: '6px 14px', background: '#b45309', borderColor: '#b45309' }}
        >
          💳 รับชำระเงิน (QR / POS)
        </button>
      </div>
    )
  }

  // 2. ชำระแล้ว รอส่งมอบ GR
  if (job.stage === 'CS_OPENED') {
    return (
      <div
        style={{
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#166534' }}>
          📌 ขั้นตอนถัดไป: ส่งมอบสินค้าให้ฝ่ายรับสินค้า (GR)
        </div>
        <p style={{ margin: '6px 0 10px', fontSize: 12, color: '#14532d', lineHeight: 1.5 }}>
          ชำระเงินเรียบร้อยแล้ว นำสินค้าส่งมอบให้แผนก GR เพื่อตรวจสอบสภาพ ถ่ายภาพ และระบุ Location จัดเก็บในคลัง
        </p>
        <Link
          href={`/gr?search=${encodeURIComponent(job.jobNo)}`}
          className="btn btn-primary"
          style={{ fontSize: 12.5, padding: '6px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          📦 ไปที่คิวทำรับ GR ↗
        </Link>
      </div>
    )
  }

  // 3. สินค้าอยู่ในคลัง GR รอแพ็ค
  if (job.stage === 'GR_RECEIVED') {
    return (
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1e293b' }}>
          📌 ขั้นตอนถัดไป: Pack สินค้าและเตรียมส่งออก
        </div>
        <p style={{ margin: '6px 0 10px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
          สินค้าทำรับเข้าคลัง GR เรียบร้อยแล้ว เจ้าหน้าที่ GR กำลังเตรียมแพ็คสินค้าและส่งมอบให้ขนส่ง
        </p>
        <Link
          href={`/gr?tab=pack&search=${encodeURIComponent(job.jobNo)}`}
          className="btn"
          style={{ fontSize: 12, textDecoration: 'none', display: 'inline-block' }}
        >
          📦 ไปที่คิว Pack ของ GR ↗
        </Link>
      </div>
    )
  }

  // 4. พร้อมส่งมอบลูกค้าที่สาขา
  if (job.stage === 'READY_FOR_PICKUP') {
    return (
      <div
        style={{
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#166534' }}>
          📌 ขั้นตอนถัดไป: ส่งมอบสินค้าให้ลูกค้าที่เคาน์เตอร์ CS
        </div>
        <p style={{ margin: '6px 0 10px', fontSize: 12, color: '#14532d', lineHeight: 1.5 }}>
          สินค้าซ่อมเสร็จและอยู่ที่สาขาแล้ว แจ้งลูกค้ามารับสินค้าและดำเนินการส่งมอบปิดงาน
        </p>
        <Link
          href={`/cs?tab=pickup&search=${encodeURIComponent(job.jobNo)}`}
          className="btn btn-primary"
          style={{ fontSize: 12.5, padding: '6px 14px', textDecoration: 'none', display: 'inline-block' }}
        >
          🏪 ไปที่คิวส่งมอบ CS ↗
        </Link>
      </div>
    )
  }

  return null
}
