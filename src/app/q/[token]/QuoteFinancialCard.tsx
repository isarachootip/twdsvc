'use client'

import { Clock, Printer } from 'lucide-react'
import { fmtBahtDecimal } from '@/lib/constants'
import { computeQuotationFinancials } from '@/lib/quotation-format'
import type { QuoteData } from './quote-types'

export default function QuoteFinancialCard({
  data,
  onOpenA4,
}: {
  data: QuoteData
  onOpenA4: () => void
}) {
  const { job, quote } = data
  const fin = computeQuotationFinancials({
    lines: quote.lines.map((l) => ({
      type: l.type,
      description: l.description,
      quantity: l.quantity,
      amount: l.unitPrice * l.quantity,
      partWaitDays: l.partWaitDays,
      partWarrantyDays: l.partWarrantyDays,
    })),
    subtotal: quote.subtotal,
    vatAmount: quote.vatAmount,
    total: quote.total,
    operationFeePaid: job.operationFeePaid,
    hasWarranty: job.hasWarranty,
  })

  return (
    <>
      <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#E4DED2] pb-2">
          <div>
            <h3 className="font-bold text-xs text-[#2B2723]">ใบเสนอราคา ({quote.quoteNo})</h3>
            <p className="text-[11px] text-[#6B6459]">จากการตรวจสอบพบอาการเสียและรายการซ่อมดังนี้</p>
          </div>
          <button
            type="button"
            onClick={onOpenA4}
            className="text-[11px] font-semibold text-[#C8102E] hover:underline flex items-center gap-1 shrink-0"
          >
            <Printer size={13} />
            ดูใบเสนอราคา (A4)
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {fin.displayLines.map((line) => (
            <div key={line.index} className="flex justify-between items-start border-b border-[#F3EEE6] pb-2">
              <div className="pr-2">
                <div className="font-medium text-[#2B2723]">
                  {line.index}. {line.description}
                  {line.quantity > 1 && <span className="text-[#6B6459] ml-1">× {line.quantity}</span>}
                </div>
                {line.partWaitDays ? (
                  <div className="text-[10px] text-[#BA7517] flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> รอสั่งอะไหล่ {line.partWaitDays} วัน
                  </div>
                ) : null}
              </div>
              <div className="font-mono font-semibold text-[#2B2723] whitespace-nowrap">
                {fmtBahtDecimal(line.amountBaht)}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 pt-1 text-xs border-t border-[#E4DED2]">
          <div className="flex justify-between text-[#6B6459]">
            <span>รวมก่อน VAT</span>
            <span className="font-mono">{fmtBahtDecimal(fin.subtotalBaht)}</span>
          </div>
          <div className="flex justify-between text-[#6B6459]">
            <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
            <span className="font-mono">{fmtBahtDecimal(fin.vatAmountBaht)}</span>
          </div>
          <div className="flex justify-between font-semibold text-[#2B2723] pt-0.5">
            <span>ค่าซ่อมสินค้า (รวมภาษี)</span>
            <span className="font-mono">{fmtBahtDecimal(fin.totalBaht)}</span>
          </div>
          {fin.operationFeeDiscountBaht > 0 && (
            <div className="flex justify-between font-medium text-emerald-700">
              <span>หัก: ส่วนลดค่าดำเนินการที่ชำระไว้</span>
              <span className="font-mono">-{fmtBahtDecimal(fin.operationFeeDiscountBaht)}</span>
            </div>
          )}
        </div>

        <div className="bg-[#C8102E] text-white rounded-xl p-3.5 text-center mt-2">
          <p className="text-xs opacity-90 mb-0.5 font-medium">ยอดที่ต้องชำระ (กรณีอนุมัติซ่อม)</p>
          <p className="text-2xl font-bold font-mono">{fmtBahtDecimal(fin.netPayableBaht)}</p>
          {fin.operationFeeDiscountBaht > 0 && (
            <p className="text-[10.5px] opacity-90 mt-0.5">
              ราคารวม VAT แล้ว · หักส่วนลด {fmtBahtDecimal(fin.operationFeeDiscountBaht)} แล้ว
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
        <div className="flex justify-between border-b border-[#E4DED2] pb-2">
          <span className="text-[#6B6459]">ระยะเวลาซ่อมโดยประมาณ</span>
          <span className="font-semibold text-[#2B2723]">{quote.repairDays} วันทำการ</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B6459]">การรับประกันงานซ่อม</span>
          <span className="font-semibold text-[#1D9E75]">{quote.repairWarrantyDays} วัน</span>
        </div>
        {quote.vendorNote && (
          <div className="mt-2 pt-2 border-t border-[#E4DED2] text-[11px] text-[#6B6459]">
            <span className="font-medium text-[#2B2723]">ผลการตรวจ / หมายเหตุจากช่าง:</span> {quote.vendorNote}
          </div>
        )}
      </div>
    </>
  )
}
