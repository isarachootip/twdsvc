'use client'

import Link from 'next/link'
import type { QuoteActionDone, QuoteData } from './quote-types'

export function QuoteStatusBanners({
  data,
  actionDone,
}: {
  data: QuoteData
  actionDone: QuoteActionDone | null
}) {
  const isApproved = data.decided && data.decision === 'APPROVED'
  const isRejected = data.decided && data.decision === 'REJECTED'
  const isManagerSigned = Boolean(data.quote.managerSignedAt)

  return (
    <>
      {actionDone && (
        <div className="py-1.5 space-y-1.5 text-xs">
          <div
            className={`inline-flex items-center gap-2 font-bold text-sm ${
              actionDone.type === 'APPROVED' ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                actionDone.type === 'APPROVED' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
            {actionDone.type === 'APPROVED' ? 'อนุมัติการซ่อมสำเร็จ' : 'บันทึกไม่อนุมัติการซ่อมแล้ว'}
          </div>
          <p className="text-[#6B6459] leading-relaxed">{actionDone.message}</p>
          {actionDone.payUrl && (
            <Link
              href={actionDone.payUrl}
              className="inline-block mt-1 w-full py-2.5 rounded-xl bg-[#C8102E] text-white font-bold text-xs text-center shadow hover:opacity-95"
            >
              Link การชำระเงิน ↗
            </Link>
          )}
        </div>
      )}

      {!actionDone && isApproved && (
        <div className="py-1 text-xs space-y-0.5">
          <div className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            ท่านได้อนุมัติการซ่อมแล้ว
          </div>
          <p className="text-[#6B6459]">งานซ่อมกำลังดำเนินการ หรืออยู่ระหว่างรอชำระค่าบริการ</p>
        </div>
      )}

      {!actionDone && isRejected && (
        <div className="py-1 text-xs space-y-0.5">
          <div className="inline-flex items-center gap-1.5 font-bold text-rose-600">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            ท่านได้ปฏิเสธการซ่อมแล้ว
          </div>
          <p className="text-[#6B6459]">สินค้าอยู่ระหว่างเตรียมจัดส่งคืนสาขาต้นทาง</p>
        </div>
      )}

      {!actionDone && !data.decided && !isManagerSigned && (
        <div className="py-1 text-xs space-y-0.5">
          <div className="inline-flex items-center gap-1.5 font-bold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            อยู่ระหว่างการตรวจสอบโดยผู้จัดการสาขา
          </div>
          <p className="text-[#6B6459] leading-relaxed">
            ใบเสนอราคานี้อยู่ระหว่างลงนามโดยผู้จัดการสาขา {data.job.branchName} เมื่อลงนามอนุมัติแล้ว ระบบจะเปิดให้ท่านยืนยันการซ่อม
          </p>
        </div>
      )}
    </>
  )
}

export function ManagerApprovalSignatureCard({ data }: { data: QuoteData }) {
  const { job, quote } = data
  const isManagerSigned = Boolean(quote.managerSignedAt)

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2 text-xs">
      <div className="flex justify-between items-center border-b border-[#E4DED2] pb-2">
        <span className="font-bold text-[#2B2723]">การลงนามตรวจสอบโดยผู้จัดการสาขา</span>
        {isManagerSigned ? (
          <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> อนุมัติแล้ว
          </span>
        ) : (
          <span className="text-amber-700 font-medium inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> รอลงนาม
          </span>
        )}
      </div>
      {isManagerSigned ? (
        <div className="pt-1 flex items-center justify-between">
          <div>
            <div className="font-medium text-[#2B2723]">{quote.managerSignerName || job.storeManagerName}</div>
            <div className="text-[11px] text-[#6B6459]">{quote.isManagerProxy ? 'Manager on duty' : 'ผู้จัดการสาขา'}</div>
          </div>
          {quote.managerSignatureUrl && (
            <div className="border border-slate-200 rounded-lg p-1 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={quote.managerSignatureUrl} alt="Manager Signature" className="h-9 max-w-[120px] object-contain" />
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-[#6B6459] pt-0.5">
          สาขา: {job.branchName} · ผู้จัดการสาขา: {job.storeManagerName || 'ประจำสาขา'}
        </p>
      )}
    </div>
  )
}
