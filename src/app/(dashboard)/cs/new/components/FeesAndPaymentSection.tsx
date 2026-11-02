'use client'

import { fmtBaht, CHANNEL_LABELS } from '@/lib/constants'
import { type SavedRouting } from './PrintJobModal'

export interface FeesState {
  operationFee: number
  shippingFee: number
  total: number
}

export interface SavedState {
  id: string
  jobNo: string
  routing: SavedRouting | null
  trackingUrl?: string
  payUrl?: string
  lonResult?: { ok: boolean; status: string; endpoint: string; error?: string } | null
}

interface FeesAndPaymentSectionProps {
  fees: FeesState
  pay: 'PROMPTPAY_QR' | 'CARD_LINK' | 'POS_RECEIPT'
  setPay: (val: 'PROMPTPAY_QR' | 'CARD_LINK' | 'POS_RECEIPT') => void
  pos: string
  setPos: (val: string) => void
  saved: SavedState | null
  saving: boolean
  sendingLon?: boolean
  hasValidPhoto?: boolean
  canSendLon?: boolean
  readOnly: boolean
  paid: boolean
  onShowPayment: () => void
  onSaveAndSend: () => void
  onOpenLon: () => void
  onOpenPrint: () => void
  onOpenPayModal: () => void
  onReset: () => void
  onBackToCs: () => void
}

export function FeesAndPaymentSection({
  fees, pay, setPay, pos, setPos, saved, saving, sendingLon = false,
  hasValidPhoto = true, canSendLon = true, readOnly, paid,
  onShowPayment, onSaveAndSend, onOpenLon, onOpenPrint, onOpenPayModal, onReset, onBackToCs,
}: FeesAndPaymentSectionProps) {
  return (
    <div style={{ position: 'sticky', top: 0 }}>
      <div className="pcard">
        <h3>ค่าใช้จ่าย ณ วันที่เปิดงานซ่อม</h3>
        <div className="summary-row">
          <span>ค่าดำเนินการ</span>
          <span>{fmtBaht(fees.operationFee)}</span>
        </div>
        <div className="summary-row">
          <span>ค่าขนส่ง 3PL (ถ้าเลือก)</span>
          <span>{fmtBaht(fees.shippingFee)}</span>
        </div>
        <div className="summary-row total">
          <span>รวมค่าใช้จ่ายวันนี้</span>
          <span>{fmtBaht(fees.total)}</span>
        </div>
        <div className="note">กรณีลูกค้าอนุมัติซ่อม ค่าดำเนินการจะนำมาเป็นส่วนลดค่าซ่อมสินค้า</div>
      </div>

      {fees.total > 0 && (
        <div className="pcard">
          <h3>วิธีชำระค่าใช้จ่าย ณ วันที่เปิดงานซ่อม</h3>
          <div className="radio-row" style={{ marginTop: 8 }}>
            {(['PROMPTPAY_QR', 'CARD_LINK', 'POS_RECEIPT'] as const).map((methodKey) => (
              <button
                key={methodKey}
                type="button"
                disabled={!!saved}
                className={`radio-opt ${pay === methodKey ? 'checked' : ''}`}
                onClick={() => setPay(methodKey)}
              >
                {methodKey === 'PROMPTPAY_QR'
                  ? 'QR Payment'
                  : methodKey === 'CARD_LINK'
                  ? 'Link ตัดบัตรเครดิต'
                  : 'เลขที่ใบเสร็จ POS'}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            {pay === 'PROMPTPAY_QR' && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving || readOnly || paid}
                onClick={onShowPayment}
              >
                แสดง QR ให้ลูกค้าสแกน
              </button>
            )}
            {pay === 'CARD_LINK' && (
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving || readOnly || paid}
                onClick={onShowPayment}
              >
                Gen link ตัดบัตรเครดิต ↗
              </button>
            )}
            {pay === 'POS_RECEIPT' && (
              <input
                className="inp"
                style={{ width: '100%' }}
                placeholder="เลขที่ใบเสร็จ POS (Ref.)"
                value={pos}
                disabled={!!saved}
                onChange={e => setPos(e.target.value)}
              />
            )}
          </div>
          {saved && (
            <p style={{ marginTop: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>สถานะ:</span>
              {paid ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                  ชำระเงินสำเร็จ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                  รอชำระ {fmtBaht(fees.total)}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      <div className="pcard" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!saved ? (
          <button
            className="btn btn-primary btn-lg"
            disabled={saving || sendingLon || readOnly || !canSendLon}
            onClick={onSaveAndSend}
          >
            {saving || sendingLon ? 'กำลังบันทึกและส่ง LON…' : 'บันทึก + ส่งข้อมูลแจ้งซ่อมให้ลูกค้าทาง LON'}
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary btn-lg"
              disabled={sendingLon || readOnly || !canSendLon}
              onClick={onOpenLon}
            >
              {sendingLon ? 'กำลังส่งข้อมูลทาง LON…' : 'ส่งข้อมูลแจ้งซ่อมให้ลูกค้าทาง LON'}
            </button>
            <button type="button" className="btn" disabled onClick={onOpenPrint}>
              พิมพ์ใบแจ้งซ่อม
            </button>
            {!paid && fees.total > 0 && (
              <button className="btn btn-outline" onClick={onOpenPayModal}>
                รับชำระค่าดำเนินการ
              </button>
            )}
            <button type="button" className="btn" disabled onClick={onReset}>
              + เปิดใบแจ้งซ่อมใหม่
            </button>
            <button type="button" className="btn" disabled onClick={onBackToCs}>
              กลับคิว CS
            </button>
          </>
        )}
        {!canSendLon && !readOnly && (
          <p className="text-amber-700" style={{ margin: 0, fontSize: 12 }}>
            {!hasValidPhoto && fees.total > 0 && !paid
              ? 'กรุณาแนบรูปถ่ายสินค้าอย่างน้อย 1 รูป และกดรับชำระเงิน (จำลองชำระเงิน) ก่อน จึงจะเปิดใช้งานปุ่มส่ง LON'
              : !hasValidPhoto
              ? 'กรุณาแนบรูปถ่ายสินค้าอย่างน้อย 1 รูปก่อนส่งข้อมูลทาง LON'
              : 'กรุณารับชำระค่าดำเนินการ (กดแสดง QR แล้วกดปุ่มจำลองชำระเงิน หรือกรอกเลขใบเสร็จ POS) เพื่อเปิดใช้งานปุ่มส่ง LON'}
          </p>
        )}
        {readOnly && <p className="hint">โหมดดูอย่างเดียว (เปิดงานได้เฉพาะ CS หรือ Admin)</p>}
      </div>

      {saved && (
        <div className={`note ${saved.routing ? 'blue' : 'amber'}`}>
          {saved.routing ? (
            <>
              ศูนย์ซ่อม: <b>{saved.routing.centerCode} {saved.routing.vendorName}</b> · ช่องทาง{' '}
              {CHANNEL_LABELS[saved.routing.channel] ?? saved.routing.channel}
            </>
          ) : (
            <>⚠ ยังไม่พบศูนย์ซ่อมที่รองรับ — ส่งให้ Admin กำหนด</>
          )}
        </div>
      )}
    </div>
  )
}
