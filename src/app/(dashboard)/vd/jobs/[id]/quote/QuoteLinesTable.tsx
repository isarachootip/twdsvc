'use client'

import QuoteLineRow from './QuoteLineRow'
import { LineType, QuoteLineItem } from './types'

interface QuoteLinesTableProps {
  lines: QuoteLineItem[]
  onUpdate: (key: number, patch: Partial<QuoteLineItem>) => void
  onRemove: (key: number) => void
  onAdd: (type: LineType) => void
}

export default function QuoteLinesTable({ lines, onUpdate, onRemove, onAdd }: QuoteLinesTableProps) {
  return (
    <div className="pcard" style={{ marginBottom: 0, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            รายการค่าอะไหล่ / ค่าแรง / ค่าบริการ
          </h3>
          <span style={{ fontSize: 12, background: 'var(--surface-2)', color: 'var(--text-2)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
            {lines.length} รายการ
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>
          * ราคาก่อนคิดภาษีมูลค่าเพิ่ม (VAT 7%)
        </div>
      </div>

      {lines.length === 0 ? (
        <div style={{ padding: '28px 16px', textAlign: 'center', background: 'var(--surface-2)', borderRadius: 8, border: '1px dashed var(--border-strong)', color: 'var(--text-mute)', fontSize: 13 }}>
          <p style={{ margin: '0 0 10px' }}>ยังไม่มีรายการ — กรุณากดปุ่มด้านล่างเพื่อเพิ่มค่าแรงหรืออะไหล่</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 2.5fr) minmax(110px, 1.2fr) minmax(85px, 0.9fr) minmax(95px, 0.9fr) 36px',
              gap: 8,
              padding: '8px 10px',
              background: 'var(--surface-2)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-2)',
              alignItems: 'center',
            }}
          >
            <span>รายการ / ชนิดค่าบริการ</span>
            <span style={{ textAlign: 'right', paddingRight: 4 }}>ราคา (฿ ก่อน VAT)</span>
            <span style={{ textAlign: 'center' }}>รอของ (วัน)</span>
            <span style={{ textAlign: 'center' }}>ประกัน (วัน)</span>
            <span />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {lines.map(line => (
              <QuoteLineRow
                key={line.key}
                line={line}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add buttons toolbar */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          onClick={() => onAdd('PART')}
          style={{
            borderColor: 'rgba(24, 95, 165, 0.4)',
            color: 'var(--blue)',
            background: 'var(--blue-tint)',
            fontWeight: 600,
          }}
        >
          <span>＋</span> เพิ่มอะไหล่
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => onAdd('LABOR')}
          style={{
            borderColor: 'rgba(186, 117, 23, 0.4)',
            color: '#92400e',
            background: 'var(--amber-tint)',
            fontWeight: 600,
          }}
        >
          <span>＋</span> เพิ่มค่าแรงช่าง
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => onAdd('OTHER')}
          style={{ fontWeight: 500 }}
        >
          <span>＋</span> เพิ่มรายการอื่น
        </button>
      </div>
    </div>
  )
}
