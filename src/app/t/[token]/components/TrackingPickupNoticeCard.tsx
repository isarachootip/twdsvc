'use client'

import { Phone } from 'lucide-react'
import type { Stage } from '@/lib/constants'

interface TrackingPickupNoticeCardProps {
  stage: Stage
  decision?: string
  customerName: string | null
  branchName: string
  stageEnteredAt?: string
  operationFee?: number
  balance: number
}

function fmtThaiSlashDate(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function TrackingPickupNoticeCard({
  stage,
  decision,
  customerName,
  branchName,
  stageEnteredAt,
  operationFee = 0,
  balance,
}: TrackingPickupNoticeCardProps) {
  const isRejectedFlow =
    decision === 'REJECTED' &&
    ['RETURN_PACKING', 'INBOUND_TO_DC', 'AT_DC_INBOUND', 'INBOUND_TO_BRANCH', 'GR_RETURN_RECEIVED', 'READY_FOR_PICKUP'].includes(stage)
  const isReadyRepaired = stage === 'READY_FOR_PICKUP' && decision !== 'REJECTED'

  if (!isRejectedFlow && !isReadyRepaired) return null

  const displayName = customerName || 'ลูกค้าผู้มีอุปการคุณ'
  const actionDate = fmtThaiSlashDate(stageEnteredAt)

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E4DED2] shadow-sm space-y-2.5 text-xs">
      {isRejectedFlow ? (
        <>
          <div className="font-bold text-rose-700 text-sm">
            แจ้งขอส่งคืนสินค้าซ่อม (ปฏิเสธการซ่อม)
          </div>
          <p className="text-[#2B2723] leading-relaxed">
            แจ้งยืนยันขอส่งสินค้าคืนลูกค้า <b>{displayName}</b> เนื่องจากลูกค้าปฏิเสธการซ่อมสินค้า
          </p>
          <div className="flex justify-between text-[#6B6459] pt-1 border-t border-[#F3EEE6]">
            <span>วันที่แจ้งส่งคืน:</span>
            <span className="font-mono text-[#2B2723]">{actionDate}</span>
          </div>
        </>
      ) : (
        <>
          <div className="font-bold text-emerald-700 text-sm">
            สินค้าพร้อมรับคืนที่สาขาแล้ว
          </div>
          <p className="text-[#2B2723] leading-relaxed">
            แจ้งยืนยันขอรับสินค้า สำหรับ <b>{displayName}</b> เนื่องจากสินค้าได้ดำเนินการซ่อมเสร็จเป็นที่เรียบร้อย
          </p>
          <div className="flex justify-between text-[#6B6459] pt-1 border-t border-[#F3EEE6]">
            <span>วันที่พร้อมรับสินค้า:</span>
            <span className="font-mono text-[#2B2723]">{actionDate}</span>
          </div>
        </>
      )}

      <div className="flex justify-between text-[#6B6459]">
        <span>สาขาที่รับสินค้า:</span>
        <span className="font-medium text-[#2B2723]">{branchName}</span>
      </div>

      <div className="pt-2 border-t border-[#E4DED2] space-y-1 text-[11.5px] text-[#6B6459] leading-relaxed">
        <p className="font-semibold text-[#2B2723]">
          กรุณาติดต่อรับสินค้าคืนภายใน 7 วันทำการ นับจากวันที่ได้รับแจ้ง
        </p>
        <p>
          หากรับสินค้าเกินกำหนดที่ทางบริษัทฯ แจ้ง ทางบริษัทฯ ขอสงวนสิทธิ์ในการจัดเก็บค่าบริการเพิ่มเติม
        </p>
        {operationFee > 0 && balance > 0 && (
          <p className="text-amber-700 font-medium">
            หมายเหตุ: ทางบริษัทฯ ขอเรียกเก็บค่าดำเนินการ {operationFee.toLocaleString()} บาท
          </p>
        )}
      </div>

      <a
        href="tel:1308"
        className="mt-1 w-full py-2.5 rounded-xl bg-[#F3EEE6] text-[#2B2723] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E4DED2] transition-colors"
      >
        <Phone size={14} className="text-[#C8102E]" />
        ติดต่อเจ้าหน้าที่ 1308 (07:00 – 20:00 น.)
      </a>
    </div>
  )
}
