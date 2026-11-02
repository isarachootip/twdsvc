'use client'

import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { absUrl, api } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'
import { useToast } from '@/components/ui/Toast'
import type { LonStatus } from '@/lib/validations/lon.schema'

export interface SavedJobInfo {
  id: string
  jobNo: string
  trackingUrl?: string
  lonResult?: { ok: boolean; status: LonStatus; endpoint: string; error?: string } | null
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

const LON_STATUS_DISPLAY: Record<LonStatus, { textClass: string; dotClass: string; label: string }> = {
  SENT: { textClass: 'text-emerald-700', dotClass: 'bg-emerald-600', label: 'ส่งแจ้งเตือนทาง LON สำเร็จ' },
  SIMULATED: { textClass: 'text-sky-700', dotClass: 'bg-sky-600', label: 'บันทึกการส่ง LON (โหมดจำลอง)' },
  SKIPPED: { textClass: 'text-amber-700', dotClass: 'bg-amber-500', label: 'ข้ามการส่ง LON (ปิดสวิตช์หรือเบอร์ไม่รองรับ)' },
  FAILED: { textClass: 'text-rose-600', dotClass: 'bg-rose-600', label: 'ส่งแจ้งเตือนทาง LON ไม่สำเร็จ' },
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
  const [lonState, setLonState] = useState(saved?.lonResult ?? null)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    setLonState(saved?.lonResult ?? null)
  }, [saved?.lonResult])

  if (!open || !saved) return null

  const statusMeta = lonState ? LON_STATUS_DISPLAY[lonState.status] : null

  const handleResendLon = async () => {
    setResending(true)
    try {
      const res = await api<{
        result: { ok: boolean; status: LonStatus; endpoint: string; error?: string }
      }>(`/api/jobs/${saved.id}/lon`, {
        method: 'POST',
        body: { type: 'SEND_TO_REPAIR' },
      })
      setLonState(res.result)
      if (res.result.status === 'FAILED') {
        toast(res.result.error || 'ส่งแจ้งเตือนทาง LON ไม่สำเร็จ', 'error')
      } else {
        toast(LON_STATUS_DISPLAY[res.result.status].label, 'success')
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ส่งแจ้งเตือนทาง LON ไม่สำเร็จ', 'error')
    } finally {
      setResending(false)
    }
  }

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-mute)', margin: 0 }}>
              ข้อความแจ้งซ่อมที่ส่งให้ลูกค้าทาง LON
            </p>
            {statusMeta && (
              <span className={`inline-flex items-center gap-1.5 font-medium ${statusMeta.textClass}`} style={{ fontSize: 12 }}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                {statusMeta.label}
              </span>
            )}
          </div>
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
          {lonState?.error && (
            <p className="text-rose-600" style={{ marginTop: 8, fontSize: 12 }}>
              {lonState.error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={resending}
              onClick={handleResendLon}
            >
              {resending ? 'กำลังส่ง LON…' : 'ส่งข้อมูลแจ้งซ่อมทาง LON อีกครั้ง'}
            </button>
            {saved.trackingUrl && (
              <button
                type="button"
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
      </div>
    </Modal>
  )
}
