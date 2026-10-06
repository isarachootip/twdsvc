'use client'

import React from 'react'
import type { VendorSetupFormData } from '../types'
import { SignatureCanvas } from './SignatureCanvas'
import { FileCheck, ShieldCheck } from 'lucide-react'

interface Step5AgreementsProps {
  form: VendorSetupFormData
  onUpdateAgreements: (patch: Partial<VendorSetupFormData['agreements']>) => void
}

const AGREEMENT_ITEMS = [
  {
    key: 'sla' as const,
    title: '1. ยอมรับ SLA การซ่อมและมาตรฐานเวลา',
    desc: 'เข้าหน้างานตามนัดหมาย, อัปเดตรูปภาพ Before/After ครบถ้วน, ประกันงาน 90 วัน หากผิดนัดเกิน 2 ครั้ง ระบบพักจ่ายงานชั่วคราว 7 วัน',
  },
  {
    key: 'pdpa' as const,
    title: '2. ยินยอม PDPA และการคุ้มครองข้อมูลส่วนบุคคล',
    desc: 'ยินยอมให้ SVC จัดเก็บ ประมวลผล และเปิดเผยข้อมูลร้านค้าและข้อมูลลูกค้าเพื่องานซ่อม รับ-ส่งมอบ และการประกันตามมาตรฐานสากลเท่านั้น',
  },
  {
    key: 'standard' as const,
    title: '3. ยอมรับมาตรฐานราคาและอะไหล่แท้',
    desc: 'ยึดราคากลางมาตรฐานของ SVC และใช้อะไหล่แท้หรือเทียบเท่าเกรด OEM ที่ได้รับการอนุมัติจากระบบเท่านั้น',
  },
  {
    key: 'transportDamage' as const,
    title: '4. ยินยอมรับผิดชอบความเสียหายระหว่างขนส่งและซ่อม',
    desc: 'Vendor รับผิดชอบความปลอดภัยของสินค้าตั้งแต่รับเครื่องจนส่งมอบคืนสาขาต้นทาง ครอบคลุมทั้งกรณีขนส่งเอง, DC, หรือ 3PL',
  },
  {
    key: 'warrantyRepeat' as const,
    title: '5. การรับประกันงานซ่อมซ้ำ (Repeat Repair 90 วัน)',
    desc: 'กรณีมีอาการซ่อมซ้ำในอาการเดิมภายใน 90 วัน ยินดีเข้าตรวจสอบและแก้ไขโดยไม่มีการคิดค่าบริการเปิดเครื่องหรือค่าแรงเพิ่มเติม',
  },
]

export function Step5Agreements({ form, onUpdateAgreements }: Step5AgreementsProps) {
  const agreements = form.agreements.agreements

  const toggleAgreement = (key: keyof typeof agreements) => {
    onUpdateAgreements({
      agreements: {
        ...agreements,
        [key]: !agreements[key],
      },
    })
  }

  const selectedCoverageCount = Object.keys(form.coverage.coverage).length

  return (
    <div className="space-y-6">
      {/* สรุปข้อมูล Vendor */}
      <div className="p-4 rounded-xl border bg-slate-50 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs" style={{ borderColor: 'var(--border)' }}>
        <div>
          <span className="text-slate-500 block">ชื่อร้าน / บริษัท:</span>
          <span className="font-semibold text-slate-800">{form.store.name || '-'}</span>
        </div>
        <div>
          <span className="text-slate-500 block">สาขา / เบอร์โทร:</span>
          <span className="font-semibold text-slate-800">{form.store.branches.length} สาขา • {form.store.phone || '-'}</span>
        </div>
        <div>
          <span className="text-slate-500 block">พื้นที่บริการ SVC:</span>
          <span className="font-semibold text-slate-800">{selectedCoverageCount} สาขา</span>
        </div>
        <div>
          <span className="text-slate-500 block">บัญชีรับเงิน:</span>
          <span className="font-semibold text-slate-800">{form.finance.bank} ({form.finance.accNo || '-'})</span>
        </div>
      </div>

      {/* ข้อตกลง 5 ด้าน */}
      <div className="p-5 rounded-2xl border bg-white space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--red)' }} />
          <div>
            <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
              ข้อตกลงและเงื่อนไขการเป็นคู่ค้าบริการ SVC
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              กรุณาอ่านและทำเครื่องหมายยินยอมครบทุกข้อเพื่อส่งใบสมัคร
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {AGREEMENT_ITEMS.map(item => (
            <div
              key={item.key}
              onClick={() => toggleAgreement(item.key)}
              className="p-3 rounded-xl border bg-slate-50 hover:bg-slate-100 transition cursor-pointer select-none flex items-start gap-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <input
                type="checkbox"
                className="mt-1 rounded"
                checked={agreements[item.key]}
                onChange={() => {}} // handled by parent div
              />
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-slate-800">{item.title}</div>
                <div className="text-slate-600">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ลายเซ็นดิจิทัล */}
      <div className="p-5 rounded-2xl border bg-white space-y-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5" style={{ color: 'var(--red)' }} />
          <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
            ลงลายมือชื่อผู้มีอำนาจลงนาม / ตัวแทนร้านค้า <span className="text-red-500">*</span>
          </h4>
        </div>
        <SignatureCanvas
          value={form.agreements.signatureUrl}
          onChange={url => onUpdateAgreements({ signatureUrl: url })}
        />
      </div>
    </div>
  )
}
