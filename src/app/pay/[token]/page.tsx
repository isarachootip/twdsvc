'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, CreditCard, QrCode, Download,
  ArrowRight, ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react'
import QrImage from '@/components/ui/QrImage'
import { formatSatang } from '@/lib/fees'

interface PayData {
  jobNo: string
  productName: string
  brandName?: string
  branchName: string
  branchPhone?: string | null
  balance: number
  paid: boolean
  expired: boolean
  lines: Array<{ description: string; amount: number }>
  paidAmount: number
  lastPayment?: {
    amount: number
    method: string
    receivedAt?: string
    posReceiptNo?: string | null
  } | null
  trackingToken?: string
  trackingUrl?: string
  demoMode?: boolean
}

export default function CustomerPaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<PayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState<'PROMPTPAY' | 'CARD'>('PROMPTPAY')
  const [busy, setBusy] = useState(false)
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null)

  // Card form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardError, setCardError] = useState('')

  const loadData = useCallback(() => {
    fetch(`/api/public/pay/${token}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? 'ลิงก์ไม่ถูกต้องหรือหมดอายุ')
        return j
      })
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Polling for payment completion if pending
  useEffect(() => {
    if (!data || data.paid) return
    const interval = setInterval(loadData, 4000)
    return () => clearInterval(interval)
  }, [data, loadData])

  const handlePayConfirm = async (method: 'PROMPTPAY_QR' | 'CARD_LINK') => {
    setBusy(true)
    setCardError('')
    try {
      if (method === 'CARD_LINK') {
        const cleanNum = cardNumber.replace(/\s/g, '')
        if (!cleanNum || cleanNum.length < 15 || !cardExp || !cardCvv) {
          setCardError('กรุณากรอกข้อมูลบัตรเครดิตให้ครบถ้วน')
          setBusy(false)
          return
        }
      }

      // Call public confirm or q pay endpoint
      const res = await fetch(`/api/public/pay/${token}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: method === 'CARD_LINK' ? 'CARD' : 'PROMPTPAY',
          paymentMethod: method,
          amount: data?.balance,
          posReceiptNo: `PAY-${Date.now().toString(36).toUpperCase()}`,
        }),
      })

      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error ?? 'การชำระเงินไม่สำเร็จ')

      setPaySuccessMsg('ชำระเงินสำเร็จเรียบร้อยแล้ว')
      loadData()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการชำระเงิน')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#C8102E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#6B6459]">กำลังโหลดข้อมูลการชำระเงิน...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] font-sans p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E4DED2] max-w-sm w-full text-center space-y-3">
          <AlertCircle size={44} className="text-[#C8102E] mx-auto" />
          <h2 className="font-bold text-[#2B2723] text-base">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
          <p className="text-xs text-[#6B6459]">{error || 'กรุณาติดต่อศูนย์บริการไทวัสดุ'}</p>
        </div>
      </div>
    )
  }

  // Already Paid or Success View
  if (data.paid || paySuccessMsg) {
    const trackingUrl = data.trackingUrl || `/t/${data.trackingToken || token}`
    return (
      <div className="min-h-screen bg-[#F3EEE6] font-sans p-4 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#E4DED2] max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-[#E1F5EE] text-[#1D9E75] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h2 className="font-bold text-[#2B2723] text-lg">ชำระเงินสำเร็จ</h2>
            <p className="text-xs text-[#6B6459] mt-0.5">ขอบคุณที่ใช้บริการศูนย์บริการซ่อมไทวัสดุ</p>
          </div>

          {/* Receipt Details Card */}
          <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E4DED2] text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-[#E4DED2] pb-1.5">
              <span className="text-[#6B6459]">เลขที่ใบแจ้งซ่อม</span>
              <span className="font-mono font-bold text-[#2B2723]">{data.jobNo}</span>
            </div>
            <div className="flex justify-between border-b border-[#E4DED2] pb-1.5">
              <span className="text-[#6B6459]">สินค้า</span>
              <span className="font-medium text-[#2B2723]">{data.productName}</span>
            </div>
            <div className="flex justify-between border-b border-[#E4DED2] pb-1.5">
              <span className="text-[#6B6459]">สาขา</span>
              <span className="text-[#2B2723]">{data.branchName}</span>
            </div>
            <div className="flex justify-between border-b border-[#E4DED2] pb-1.5">
              <span className="text-[#6B6459]">ยอดเงินที่ชำระ</span>
              <span className="font-mono font-bold text-[#1D9E75]">
                {formatSatang(data.lastPayment?.amount || data.paidAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6459]">วิธีชำระ</span>
              <span className="text-[#2B2723]">
                {data.lastPayment?.method === 'CARD_LINK' ? 'บัตรเครดิต/เดบิต' : 'PromptPay QR'}
              </span>
            </div>
          </div>

          <Link
            href={trackingUrl}
            className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm shadow hover:bg-[#9C0C22] transition-colors flex items-center justify-center gap-2"
          >
            ติดตามสถานะงานซ่อม <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3EEE6] font-sans pb-12">
      <div className="max-w-[440px] mx-auto min-h-screen bg-[#FAF7F2] shadow-sm flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="bg-[#C8102E] text-white py-5 px-6 text-center shadow-md">
            <h1 className="text-base font-semibold tracking-wide">ศูนย์บริการซ่อมไทวัสดุ</h1>
            <p className="text-xs opacity-90 mt-0.5 font-light">Thaiwatsadu Service Center — ชำระเงินค่าบริการ</p>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Job summary card */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">เลขที่ใบแจ้งซ่อม</span>
                <span className="font-mono font-bold text-[#2B2723] text-sm">{data.jobNo}</span>
              </div>
              <div className="flex justify-between border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">สินค้า</span>
                <span className="font-medium text-[#2B2723]">{data.productName}</span>
              </div>
              <div className="flex justify-between border-b border-[#E4DED2] pb-2">
                <span className="text-[#6B6459]">สาขา</span>
                <span className="text-[#2B2723]">{data.branchName}</span>
              </div>
              {data.lines && data.lines.length > 0 && (
                <div className="pt-1 space-y-1">
                  {data.lines.map((line, idx) => (
                    <div key={idx} className="flex justify-between text-[#6B6459]">
                      <span>{line.description}</span>
                      <span className="font-mono">{formatSatang(line.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {data.paidAmount > 0 && (
                <div className="flex justify-between text-[#1D9E75] font-medium pt-1 border-t border-[#E4DED2]">
                  <span>ชำระแล้ว</span>
                  <span className="font-mono">-{formatSatang(data.paidAmount)}</span>
                </div>
              )}
            </div>

            {/* Total Balance Amount Box */}
            <div className="bg-[#FBE7E9] rounded-2xl p-4 text-center border border-[#E4DED2] shadow-sm">
              <p className="text-xs text-[#9C0C22] mb-0.5 font-medium">ยอดคงค้างที่ต้องชำระ</p>
              <p className="text-3xl font-bold text-[#9C0C22] font-mono">{formatSatang(data.balance)}</p>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-[#2B2723]">เลือกช่องทางชำระเงิน</h3>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('PROMPTPAY')}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 border-2 transition-all ${
                    payMethod === 'PROMPTPAY'
                      ? 'border-[#C8102E] bg-[#FBE7E9] text-[#9C0C22]'
                      : 'border-[#E4DED2] bg-white text-[#6B6459]'
                  }`}
                >
                  <QrCode size={20} />
                  <span>QR PromptPay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('CARD')}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 border-2 transition-all ${
                    payMethod === 'CARD'
                      ? 'border-[#C8102E] bg-[#FBE7E9] text-[#9C0C22]'
                      : 'border-[#E4DED2] bg-white text-[#6B6459]'
                  }`}
                >
                  <CreditCard size={20} />
                  <span>บัตรเครดิต / เดบิต</span>
                </button>
              </div>

              {/* Tab 1: PromptPay QR */}
              {payMethod === 'PROMPTPAY' && (
                <div className="pt-2 text-center space-y-3">
                  <div className="bg-white p-3 rounded-2xl border-2 border-[#D2C9B8] inline-block mx-auto shadow-sm">
                    <QrImage
                      value={typeof window !== 'undefined' ? `${window.location.origin}/pay/${token}` : token}
                      size={180}
                    />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-[#2B2723] font-mono">{formatSatang(data.balance)}</div>
                    <p className="text-[11px] text-[#6B6459] mt-0.5">
                      สแกนด้วยแอปพลิเคชันธนาคาร หรือ Wallet ที่รองรับ PromptPay
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePayConfirm('PROMPTPAY_QR')}
                    disabled={busy}
                    className="w-full py-3.5 rounded-xl bg-[#1D9E75] text-white font-bold text-sm shadow hover:opacity-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    {busy ? 'กำลังตรวจสอบ...' : 'ฉันชำระเงินแล้ว (จำลองสำเร็จ)'}
                  </button>
                </div>
              )}

              {/* Tab 2: Credit/Debit Card */}
              {payMethod === 'CARD' && (
                <div className="pt-2 space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#6B6459]">ชื่อบนบัตร</label>
                    <input
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="เช่น SOMCHAI JAIDEE"
                      className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-xs outline-none focus:border-[#C8102E]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#6B6459]">หมายเลขบัตรเครดิต / เดบิต</label>
                    <input
                      id="card-number"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 16)
                        const formatted = val.match(/.{1,4}/g)?.join(' ') || val
                        setCardNumber(formatted)
                      }}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-xs font-mono outline-none focus:border-[#C8102E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#6B6459]">วันหมดอายุ (MM/YY)</label>
                      <input
                        id="card-exp"
                        value={cardExp}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 4)
                          if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2)
                          setCardExp(val)
                        }}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-xs font-mono outline-none focus:border-[#C8102E]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-[#6B6459]">CVV</label>
                      <input
                        id="card-cvv"
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-xs font-mono outline-none focus:border-[#C8102E]"
                      />
                    </div>
                  </div>

                  {cardError && (
                    <p className="text-xs text-[#C8102E] font-medium">{cardError}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePayConfirm('CARD_LINK')}
                    disabled={busy}
                    className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm shadow hover:bg-[#9C0C22] transition-colors disabled:opacity-60"
                  >
                    {busy ? 'กำลังดำเนินการ...' : `ชำระเงิน ${formatSatang(data.balance)}`}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#9A9384] pt-1">
                    <ShieldCheck size={14} className="text-[#1D9E75]" />
                    <span>ระบบรักษาความปลอดภัยมาตรฐาน PCI-DSS</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-[#9A9384] py-4 border-t border-[#E4DED2] bg-[#FAF7F2]">
          หากมีข้อสงสัย ติดต่อศูนย์บริการสาขา {data.branchName}
          {data.branchPhone && ` โทร. ${data.branchPhone}`}
        </div>
      </div>
    </div>
  )
}
