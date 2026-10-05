'use client'

interface QuoteTermsSectionProps {
  repairDays: string
  warrantyDays: string | number
  note: string
  onRepairDaysChange: (days: string) => void
  onNoteChange: (note: string) => void
}

export default function QuoteTermsSection({
  repairDays,
  warrantyDays,
  note,
  onRepairDaysChange,
  onNoteChange,
}: QuoteTermsSectionProps) {
  return (
    <div className="pcard" style={{ marginBottom: 0, padding: '18px 20px' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
        ระยะเวลาและเงื่อนไขการส่งมอบ
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="field">
          <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>ระยะเวลาซ่อมรวมโดยประมาณ</span>
            <span style={{ color: 'var(--red)', fontWeight: 700 }}>*</span>
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              className="inp"
              type="number"
              min={1}
              placeholder="เช่น 3"
              style={{ width: '100%', height: 38, fontSize: 13, paddingRight: 45 }}
              value={repairDays}
              onChange={e => onRepairDaysChange(e.target.value)}
            />
            <span style={{ position: 'absolute', right: 12, fontSize: 12.5, color: 'var(--text-mute)', pointerEvents: 'none' }}>
              วัน
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 4, display: 'block' }}>
            นับจากวันที่ลูกค้ากดอนุมัติการซ่อม
          </span>
        </div>

        <div className="field">
          <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
            รับประกันงานซ่อม (วัน)
          </label>
          <div
            style={{
              height: 38,
              padding: '0 12px',
              borderRadius: 6,
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--text)',
            }}
          >
            <span style={{ fontWeight: 600 }}>{warrantyDays}</span>
            <span style={{ fontSize: 12, color: 'var(--text-mute)' }}>วัน (ตามนโยบายศูนย์)</span>
          </div>
          <span style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 4, display: 'block' }}>
            เงื่อนไขตามที่ศูนย์บริการลงทะเบียนไว้
          </span>
        </div>
      </div>

      <div className="field" style={{ marginTop: 16 }}>
        <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
          หมายเหตุถึงลูกค้า (แสดงในใบเสนอราคาและหน้ายืนยันออนไลน์)
        </label>
        <textarea
          className="inp"
          placeholder="เช่น ตรวจพบสายไฟภายในชำรุดเพิ่มเติม, แนะนำให้เปลี่ยนแปรงถ่านพร้อมกัน"
          style={{ width: '100%', minHeight: 70, fontSize: 13, padding: '8px 12px', resize: 'vertical' }}
          value={note}
          onChange={e => onNoteChange(e.target.value)}
        />
      </div>
    </div>
  )
}
