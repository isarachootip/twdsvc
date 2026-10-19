'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

export type ReviewMode = 'sign' | 'request_revision' | 'reject'

interface UseManagerReviewModalProps {
  open: boolean
  jobId: string
  defaultManagerName?: string | null
  onSigned: (updatedQuote: unknown) => void
  onClose: () => void
}

export function useManagerReviewModal({
  open,
  jobId,
  defaultManagerName,
  onSigned,
  onClose,
}: UseManagerReviewModalProps) {
  const [mode, setMode] = useState<ReviewMode>('sign')
  const [isProxy, setIsProxy] = useState(false)
  const [signerName, setSignerName] = useState(defaultManagerName || '')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setMode('sign')
      setIsProxy(false)
      setSignerName(defaultManagerName || '')
      setSignatureUrl('')
      setReason('')
    }
  }, [open, defaultManagerName])

  const handleProxyToggle = (checked: boolean) => {
    setIsProxy(checked)
    if (!checked) {
      setSignerName(defaultManagerName || '')
    } else if (signerName === defaultManagerName) {
      setSignerName('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { action: mode }
      if (mode === 'sign') {
        const trimmedName = signerName.trim()
        if (!trimmedName) throw new Error('กรุณาระบุชื่อ-นามสกุลผู้ลงนาม')
        if (!signatureUrl) throw new Error('กรุณาจรดลายมือชื่อบนกระดานก่อนกดยืนยัน')
        payload.signatureUrl = signatureUrl
        payload.signerName = trimmedName
        payload.isProxy = isProxy
      } else {
        const trimmedReason = reason.trim()
        if (!trimmedReason) throw new Error('กรุณาระบุเหตุผล')
        payload.reason = trimmedReason
      }

      const res = await fetch(`/api/jobs/${jobId}/quote/manager-sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'บันทึกรายการไม่สำเร็จ')

      const successMsgs = {
        sign: 'ลงนามอนุมัติใบเสนอราคาเรียบร้อยแล้ว',
        request_revision: 'ส่งกลับให้ช่างประเมินราคาใหม่เรียบร้อยแล้ว',
        reject: 'บันทึกไม่อนุมัติการซ่อมเรียบร้อยแล้ว',
      }
      toast(successMsgs[mode], 'success')
      onSigned(data.quote)
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดำเนินการ', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    mode,
    setMode,
    isProxy,
    handleProxyToggle,
    signerName,
    setSignerName,
    signatureUrl,
    setSignatureUrl,
    reason,
    setReason,
    submitting,
    handleSubmit,
  }
}
