'use client'

import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/client'
import { calcQuoteTotalsBaht } from '@/lib/quotation-format'
import { LineType, QuoteDetail, QuoteJobInfo, QuoteLineItem, QuoteTotals, VendorCenterOption } from './types'

let seq = 1
export const createBlankLine = (type: LineType = 'PART'): QuoteLineItem => ({
  key: seq++,
  type,
  description: '',
  unitPrice: '',
  partWaitDays: '',
  partWarrantyDays: '',
})

interface UseQuoteFormProps {
  jobId: string
  role: string
  revise: boolean
}

export function useQuoteForm({ jobId, role, revise }: UseQuoteFormProps) {
  const { toast } = useToast()
  const [job, setJob] = useState<QuoteJobInfo | null>(null)
  const [lines, setLines] = useState<QuoteLineItem[]>([createBlankLine()])
  const [repairDays, setRepairDays] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentQuote, setSentQuote] = useState<QuoteDetail | null>(null)
  const [vendorCenters, setVendorCenters] = useState<VendorCenterOption[]>([])
  const [selectedCenterId, setSelectedCenterId] = useState<string>('')

  useEffect(() => {
    if (role === 'ADMIN') {
      fetch('/api/vendor-centers')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setVendorCenters(d) })
        .catch(() => {})
    }
  }, [role])

  useEffect(() => {
    api<QuoteJobInfo>(`/api/jobs/${jobId}`).then(d => {
      setJob(d)
      if (d.vendorCenterId) setSelectedCenterId(d.vendorCenterId)
      const q = d.quotes?.find(x => x.status === 'SENT') ?? d.quotes?.[0]
      if (revise && q) {
        const ls: QuoteLineItem[] = q.lines
          .filter(l => l.type !== 'INSPECTION_FEE')
          .map(l => {
            const rawLineAmount = l.unitPrice * l.quantity
            const bahtAmount = rawLineAmount >= 1000 && rawLineAmount % 100 === 0 ? rawLineAmount / 100 : rawLineAmount
            return {
              key: seq++,
              type: (['PART', 'LABOR', 'OTHER'].includes(l.type) ? l.type : 'PART') as LineType,
              description: l.description,
              unitPrice: String(bahtAmount),
              partWaitDays: l.partWaitDays ? String(l.partWaitDays) : '',
              partWarrantyDays: l.partWarrantyDays ? String(l.partWarrantyDays) : '',
            }
          })
        setLines(ls.length ? ls : [createBlankLine()])
        setRepairDays(String(q.repairDays || ''))
        setNote(q.vendorNote ?? '')
      }
    }).catch(e => toast(e.message, 'error'))
  }, [jobId, revise, toast])

  const currentCenter = useMemo(() => {
    if (selectedCenterId && vendorCenters.length > 0) {
      return vendorCenters.find(c => c.id === selectedCenterId) ?? job?.vendorCenter
    }
    return job?.vendorCenter
  }, [selectedCenterId, vendorCenters, job])

  const openFee = useMemo(() => {
    if (!job || job.hasWarranty) return 0
    const raw =
      typeof job.money?.operationFee === 'number'
        ? job.money.operationFee
        : job.vendor?.inspectionFee ??
          (currentCenter?.vendorParent ? currentCenter.vendorParent.inspectionFeeNotCovered : 0)
    const n = Number(raw) || 0
    return n >= 1000 && n % 100 === 0 ? n / 100 : n
  }, [job, currentCenter])

  const warrantyDays = currentCenter?.vendorParent?.repairWarrantyDays ?? job?.vendor?.repairWarrantyDays ?? job?.vendorCenter?.vendorParent?.repairWarrantyDays ?? 30

  const totals: QuoteTotals = useMemo(
    () => calcQuoteTotalsBaht(lines, openFee),
    [lines, openFee],
  )


  const handleUpdateLine = (key: number, patch: Partial<QuoteLineItem>) => {
    setLines(ls => ls.map(l => (l.key === key ? { ...l, ...patch } : l)))
  }

  const handleRemoveLine = (key: number) => {
    setLines(ls => ls.filter(x => x.key !== key))
  }

  const handleAddLine = (type: LineType) => {
    setLines(ls => [...ls, createBlankLine(type)])
  }

  const submit = async () => {
    if (!(Number(repairDays) >= 1)) {
      toast('กรุณาระบุระยะเวลาซ่อมโดยประมาณ (วัน)', 'error')
      return
    }
    if (lines.some(l => Number(l.unitPrice) < 0)) {
      toast('ราคาต้องไม่ติดลบ', 'error')
      return
    }
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        action: revise ? 'vd_revise_quote' : 'vd_submit_quote',
        version: job?.version,
        repairDays: Number(repairDays),
        vendorNote: note,
        lines: lines
          .filter(l => l.description.trim() || Number(l.unitPrice) > 0)
          .map(l => ({
            type: l.type,
            description: l.description,
            unitPrice: Number(l.unitPrice) || 0,
            quantity: 1,
            partWaitDays: Number(l.partWaitDays) || 0,
            partWarrantyDays: Number(l.partWarrantyDays) || 0,
          })),
      }
      if (role === 'ADMIN' && (selectedCenterId || job?.vendorCenterId)) {
        payload.vendorCenterId = selectedCenterId || job?.vendorCenterId
      }

      const r = await api<{ extra?: { quoteTotal?: number } }>(`/api/jobs/${jobId}/action`, { body: payload })
      const d = await api<QuoteJobInfo>(`/api/jobs/${jobId}`)
      setJob(d)
      const latest = d.quotes?.[0] ?? null
      setSentQuote(latest)
      toast('บันทึกใบเสนอราคาแล้ว — อยู่ในขั้นตอนรอ ผจก. อนุมัติ', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ส่งใบเสนอราคาไม่สำเร็จ', 'error')
    } finally {
      setBusy(false)
    }
  }

  return {
    job,
    lines,
    repairDays,
    setRepairDays,
    note,
    setNote,
    busy,
    sentQuote,
    vendorCenters,
    selectedCenterId,
    setSelectedCenterId,
    openFee,
    warrantyDays,
    totals,
    handleUpdateLine,
    handleRemoveLine,
    handleAddLine,
    submit,
  }
}
