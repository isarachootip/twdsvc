'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface QuoteData {
  job: {
    jobNo: string
    productName: string
    brandName: string
    branchName: string
    customerName: string
    hasWarranty: boolean
  }
  quote: {
    quoteNo: string
    subtotal: number
    vatAmount: number
    total: number
    repairDays: number
    repairWarrantyDays: number
    vendorNote?: string
    lines: Array<{
      type: string
      description: string
      unitPrice: number
      quantity: number
      partWaitDays?: number
    }>
  }
  token: string
  expired: boolean
  decided: boolean
  decision?: string
}

type View = 'quote' | 'payment_method' | 'qr' | 'card' | 'result'

export default function CustomerQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [data, setData] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('quote')
  const [submitting, setSubmitting] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const [payMethod, setPayMethod] = useState<'qr' | 'card'>('qr')

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t)
      fetch(`/api/public/q/${t}`)
        .then(r => r.json())
        .then(d => setData(d))
        .catch(() => setError('ไม่พบข้อมูลหรือลิงก์หมดอายุ'))
        .finally(() => setLoading(false))
    })
  }, [params])

  const formatCurrency = (n: number) => `฿${n.toLocaleString()}`

  const handleDecision = async (action: 'approve' | 'reject') => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/q/${token}/${action}`, { method: 'POST' })
      if (!res.ok) throw new Error('เกิดข้อผิดพลาด')
      if (action === 'approve') {
        if (data?.quote.total && data.quote.total > 0) {
          setView('payment_method')
        } else {
          setResultMsg('อนุมัติการซ่อมเรียบร้อยแล้ว ทีมช่างจะเริ่มดำเนินการ')
          setView('result')
        }
      } else {
        setResultMsg('ขอบคุณที่แจ้ง — เราจะดำเนินการส่งสินค้าคืนให้ท่าน')
        setView('result')
      }
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm" style={{ color: 'var(--text-mute)' }}>กำลังโหลด...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center p-6">
          <XCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--coral)' }} />
          <p className="font-medium" style={{ color: 'var(--text)' }}>ลิงก์ไม่ถูกต้องหรือหมดอายุ</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-mute)' }}>กรุณาติดต่อศูนย์บริการ</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile-first max-width */}
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="px-4 py-4 text-white text-center" style={{ background: 'var(--red)' }}>
          <div className="font-bold text-sm">THAIWASADU SERVICE CENTER</div>
          <div className="text-xs opacity-80 mt-0.5">ใบเสนอราคาซ่อม</div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">

          {/* Job Info card */}
          <div className="card">
            <div className="text-xs font-mono" style={{ color: 'var(--text-mute)' }}>{data.quote.quoteNo}</div>
            <div className="font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
              {data.job.productName} — {data.job.brandName}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>สาขา {data.job.branchName}</div>
          </div>

          {/* Quote view */}
          {view === 'quote' && (
            <>
              {/* Line items */}
              <div className="card">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-mute)' }}>
                      <th className="text-left pb-2 font-medium text-xs">รายการ</th>
                      <th className="text-right pb-2 font-medium text-xs">จำนวน</th>
                      <th className="text-right pb-2 font-medium text-xs">ราคา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.quote.lines.map((line, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2">
                          <div style={{ color: 'var(--text)' }}>{line.description}</div>
                          <div className="text-xs" style={{ color: 'var(--text-mute)' }}>
                            {line.type === 'PART' && line.partWaitDays ? `รอชิ้นส่วน ${line.partWaitDays} วัน` : ''}
                          </div>
                        </td>
                        <td className="py-2 text-right" style={{ color: 'var(--text-2)' }}>{line.quantity}</td>
                        <td className="py-2 text-right font-medium" style={{ color: 'var(--text)' }}>
                          {formatCurrency(line.unitPrice * line.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* VAT breakdown */}
                <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between text-sm" style={{ color: 'var(--text-2)' }}>
                    <span>ราคาก่อน VAT</span><span>{formatCurrency(data.quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: 'var(--text-2)' }}>
                    <span>VAT 7%</span><span>{formatCurrency(data.quote.vatAmount)}</span>
                  </div>
                  <div
                    className="flex justify-between text-base font-bold mt-2 pt-2 rounded-lg px-3 py-2"
                    style={{ background: 'var(--red-tint)', color: 'var(--red-dark)' }}
                  >
                    <span>รวมทั้งสิ้น</span><span>{formatCurrency(data.quote.total)}</span>
                  </div>
                </div>
              </div>

              {/* Repair info */}
              <div className="card text-sm space-y-1">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-2)' }}>เวลาซ่อมโดยประมาณ</span>
                  <span className="font-medium">{data.quote.repairDays} วัน</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-2)' }}>รับประกันหลังซ่อม</span>
                  <span className="font-medium">{data.quote.repairWarrantyDays} วัน</span>
                </div>
              </div>

              {data.decided ? (
                <div className="card text-center" style={{ background: 'var(--amber-tint)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--amber)' }}>
                    {data.decision === 'APPROVED' ? '✅ ท่านได้อนุมัติการซ่อมแล้ว' : '❌ ท่านได้ปฏิเสธการซ่อมแล้ว'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleDecision('approve')}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
                    style={{ background: 'var(--green)' }}
                  >
                    {submitting ? 'กำลังส่ง...' : '✓ อนุมัติการซ่อม'}
                  </button>
                  <button
                    onClick={() => handleDecision('reject')}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-semibold text-sm border disabled:opacity-60"
                    style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}
                  >
                    ✕ ไม่อนุมัติ (รับสินค้าคืน)
                  </button>
                </div>
              )}
            </>
          )}

          {/* Result view */}
          {view === 'result' && (
            <div className="card text-center py-8">
              <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: 'var(--green)' }} />
              <p className="font-semibold" style={{ color: 'var(--text)' }}>ดำเนินการสำเร็จ</p>
              <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>{resultMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
