'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useSave, SaveButton, Row, Loading } from './admin-helpers'

export function GeneralSection() {
  const [s, setS] = useState<Record<string, string> | null>(null)
  const { saving, save, justSaved } = useSave()

  useEffect(() => {
    api<Record<string, string>>('/api/admin/settings').then(setS)
  }, [])

  if (!s) return <Loading />

  const f = (k: string, label: string, hint?: string, type = 'number') => (
    <div className="field">
      <label>{label}</label>
      <input
        className="inp"
        type={type}
        value={s[k] ?? ''}
        onChange={e => setS({ ...s, [k]: e.target.value })}
      />
      {hint && <span className="sub-mute">{hint}</span>}
    </div>
  )

  const t = (k: string, label: string, hint: string) => (
    <div className="info-row" style={{ alignItems: 'center', padding: '10px 0' }}>
      <span>
        <b style={{ fontWeight: 500 }}>{label}</b>
        <div className="sub-mute">{hint}</div>
      </span>
      <button
        className={`toggle ${s[k] !== 'false' ? 'on' : ''}`}
        onClick={() => setS({ ...s, [k]: s[k] === 'false' ? 'true' : 'false' })}
      />
    </div>
  )

  return (
    <div className="pcard">
      <h3>ตั้งค่าทั่วไป</h3>
      <div className="grid3" style={{ marginTop: 10 }}>
        {f('VAT_RATE', 'อัตรา VAT', 'เช่น 0.07 = 7%')}
        {f('QUOTE_EXPIRY_DAYS', 'อายุลิงก์ใบเสนอราคา (วัน)')}
        {f('TRADEIN_COUPON_VALID_DAYS', 'อายุคูปอง Trade-in (วัน)')}
        {f('VENDOR_SLA_THRESHOLD', 'เกณฑ์ SLA VD (%)', 'ต่ำกว่านี้ 3 เดือนติด → แจ้งเตือนผู้บริหาร')}
        {f('PUBLIC_BASE_URL', 'URL หลักของระบบ (สำหรับลิงก์ลูกค้า)', 'เช่น https://svc.thaiwatsadu.com', 'text')}
      </div>
      <div className="divider" />
      {t('CHARGE_3PL_RETURN_FEE', 'คิดค่า 3PL ขากลับ', 'เพิ่มค่าขนส่งขากลับอีก 1 รายการสำหรับงานส่งด่วน (C3)')}
      {t('REQUIRE_PHOTOS', 'บังคับถ่ายภาพก่อนยืนยันส่งมอบ', 'GR / DC / VD ต้องแนบภาพตามขั้นตอนที่กำหนด')}
      {t('DEMO_MODE', 'โหมดทดสอบ (DEMO_MODE)', 'แสดงปุ่มจำลอง: ลูกค้ากดอนุมัติใน LON, 3PL แจ้งส่งสำเร็จ, ลูกค้าชำระเงินสำเร็จ — ปิดเมื่อเชื่อม integration จริงแล้ว')}
      <Row>
        <SaveButton
          label="บันทึกการตั้งค่า"
          saving={saving}
          justSaved={justSaved}
          onClick={() =>
            save(() =>
              api('/api/admin/settings', {
                method: 'PUT',
                body: Object.fromEntries(
                  [
                    'VAT_RATE',
                    'QUOTE_EXPIRY_DAYS',
                    'TRADEIN_COUPON_VALID_DAYS',
                    'VENDOR_SLA_THRESHOLD',
                    'PUBLIC_BASE_URL',
                    'CHARGE_3PL_RETURN_FEE',
                    'REQUIRE_PHOTOS',
                    'DEMO_MODE',
                  ].map(k => [k, s[k] ?? ''])
                ),
              })
            )
          }
        />
      </Row>
    </div>
  )
}
