'use client'

import Modal from '@/components/ui/Modal'
import { absUrl } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'
import { useToast } from '@/components/ui/Toast'

export interface SavedJobInfo {
  id: string
  jobNo: string
  trackingUrl?: string
}

interface LinePreviewModalProps {
  open: boolean
  onClose: () => void
  saved: SavedJobInfo | null
  product: string
  brandName: string
  activeBranchName: string
  totalFee: number
  paid: boolean
}

export function LinePreviewModal({
  open,
  onClose,
  saved,
  product,
  brandName,
  activeBranchName,
  totalFee,
  paid,
}: LinePreviewModalProps) {
  const { toast } = useToast()
  if (!open || !saved) return null

  return (
    <Modal open={open} onClose={onClose} size="narrow">
      <div style={{ margin: '-22px -24px' }}>
        <div
          style={{
            background: 'var(--red)',
            color: '#fff',
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: '14px 14px 0 0',
          }}
        >
          Line — Thaiwasadu Service Center
        </div>
        <div style={{ padding: 16, background: 'var(--surface-2)' }}>
          <p style={{ fontSize: 11, color: 'var(--text-mute)', margin: '0 0 6px' }}>
            ข้อความแจ้งซ่อมที่ส่งให้ลูกค้าทาง LON
          </p>
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: '14px 16px',
              fontSize: 13,
            }}
          >
            <p style={{ margin: '0 0 6px' }}>
              รับเรื่องแจ้งซ่อมเรียบร้อย — <b>{saved.jobNo}</b>
            </p>
            <p style={{ margin: '0 0 4px' }}>
              สินค้า: {product} ({brandName})
            </p>
            <p style={{ margin: '0 0 4px' }}>
              สาขา: {activeBranchName}
            </p>
            <p style={{ margin: '0 0 10px' }}>
              ค่าใช้จ่ายวันนี้: {fmtBaht(totalFee)}{' '}
              {totalFee > 0 && (paid ? '(ชำระแล้ว)' : '(รอชำระ)')}
            </p>
            {saved.trackingUrl && (
              <a
                href={absUrl(saved.trackingUrl)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'var(--blue-tint)',
                  color: 'var(--blue)',
                  borderRadius: 8,
                  padding: 10,
                  fontWeight: 500,
                }}
              >
                ติดตามสถานะงานซ่อม ↗
              </a>
            )}
          </div>
          <p className="sub-mute" style={{ marginTop: 8 }}>
            * ระบบ LON (LINE OA) จะเชื่อมต่อใน STEP-29 — ปัจจุบันคัดลอกลิงก์ส่งให้ลูกค้าได้
          </p>
          {saved.trackingUrl && (
            <button
              className="btn"
              onClick={() => {
                navigator.clipboard?.writeText(absUrl(saved.trackingUrl!))
                toast('คัดลอกลิงก์ติดตามสถานะแล้ว', 'success')
              }}
            >
              คัดลอกลิงก์ติดตามสถานะ
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
