'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useSave, SaveButton, Row, Loading } from './admin-helpers'

interface PayoutConfig {
  cycleType: string
  dayOfMonth1: number | string
  dayOfMonth2: number | string
}

export function PayoutSection() {
  const [cfg, setCfg] = useState<PayoutConfig | null>(null)
  const { saving, save, justSaved } = useSave()

  useEffect(() => {
    api<PayoutConfig>('/api/admin/payout-config').then(setCfg)
  }, [])

  if (!cfg) return <Loading />

  return (
    <div className="pcard">
      <h3>รอบจ่ายเงิน Vendor</h3>
      <div className="grid3" style={{ marginTop: 10 }}>
        <div className="field">
          <label>รูปแบบรอบจ่าย</label>
          <select
            className="sel"
            value={cfg.cycleType}
            onChange={e => setCfg({ ...cfg, cycleType: e.target.value })}
          >
            <option value="BIMONTHLY">ทุกวันที่กำหนดของเดือน (2 รอบ)</option>
            <option value="MONTHLY">ทุกวันที่กำหนดของเดือน (1 รอบ)</option>
            <option value="EVERY_15_DAYS">ทุก 15 วัน (1 และ 16)</option>
            <option value="WEEKLY">ทุกสัปดาห์ (วันศุกร์)</option>
          </select>
        </div>
        <div className="field">
          <label>วันที่ในเดือน (รอบที่ 1)</label>
          <input
            className="inp"
            type="number"
            min={1}
            max={28}
            value={cfg.dayOfMonth1}
            onChange={e => setCfg({ ...cfg, dayOfMonth1: e.target.value })}
          />
        </div>
        <div className="field">
          <label>วันที่ในเดือน (รอบที่ 2)</label>
          <input
            className="inp"
            type="number"
            min={1}
            max={28}
            value={cfg.dayOfMonth2}
            disabled={cfg.cycleType !== 'BIMONTHLY'}
            onChange={e => setCfg({ ...cfg, dayOfMonth2: e.target.value })}
          />
        </div>
      </div>
      <div className="note">
        ยอดจ่ายคำนวณจากรายงานงานที่ VD ปิดงานสำเร็จ (ยอดใบเสนอราคาที่อนุมัติ ก่อน VAT) หัก GP% ตามที่ตั้งไว้ในหน้า Vendor Portal และหักเพิ่มกรณี VD ทำผิดพลาด (บันทึกที่หน้ารายงานจ่ายเงิน VD › + รายการหักเงิน VD)
      </div>
      <Row>
        <SaveButton
          label="บันทึกรอบจ่าย"
          saving={saving}
          justSaved={justSaved}
          onClick={() => save(() => api('/api/admin/payout-config', { method: 'PUT', body: cfg }))}
        />
      </Row>
    </div>
  )
}
