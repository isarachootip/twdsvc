'use client'

import { LineType, QuoteLineItem } from './types'

export const TYPE_CONFIG: Record<LineType, { label: string; bg: string; color: string; border: string; placeholder: string }> = {
  PART: {
    label: 'อะไหล่',
    bg: 'var(--blue-tint)',
    color: 'var(--blue)',
    border: 'rgba(24, 95, 165, 0.25)',
    placeholder: 'ชื่อหรือรหัสอะไหล่ เช่น แบตเตอรี่, มอเตอร์',
  },
  LABOR: {
    label: 'ค่าแรง',
    bg: 'var(--amber-tint)',
    color: '#92400e',
    border: 'rgba(186, 117, 23, 0.25)',
    placeholder: 'รายละเอียดค่าแรงช่าง เช่น ค่าแรงเปลี่ยนแบตเตอรี่',
  },
  OTHER: {
    label: 'อื่นๆ',
    bg: 'var(--surface-2)',
    color: 'var(--text-2)',
    border: 'var(--border-strong)',
    placeholder: 'ค่าบริการอื่นๆ เช่น ค่าทำความสะอาดแผงวงจร',
  },
}

interface QuoteLineRowProps {
  line: QuoteLineItem
  onUpdate: (key: number, patch: Partial<QuoteLineItem>) => void
  onRemove: (key: number) => void
}

export default function QuoteLineRow({ line, onUpdate, onRemove }: QuoteLineRowProps) {
  const cfg = TYPE_CONFIG[line.type]
  const isLabor = line.type === 'LABOR'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 2.5fr) minmax(110px, 1.2fr) minmax(85px, 0.9fr) minmax(95px, 0.9fr) 36px',
        gap: 8,
        alignItems: 'center',
        padding: '6px 8px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      {/* Description with Type Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4,
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {cfg.label}
        </span>
        <input
          className="inp"
          style={{ flex: 1, height: 34, fontSize: 13 }}
          placeholder={cfg.placeholder}
          value={line.description}
          onChange={e => onUpdate(line.key, { description: e.target.value })}
        />
      </div>

      {/* Unit Price */}
      <div>
        <input
          className="inp"
          type="number"
          min={0}
          placeholder="0"
          style={{ width: '100%', height: 34, fontSize: 13, textAlign: 'right', fontWeight: 600 }}
          value={line.unitPrice}
          onChange={e => onUpdate(line.key, { unitPrice: e.target.value })}
        />
      </div>

      {/* Wait Days */}
      <div>
        <input
          className="inp"
          type="number"
          min={0}
          disabled={isLabor}
          placeholder={isLabor ? '—' : '0'}
          style={{ width: '100%', height: 34, fontSize: 12.5, textAlign: 'center', background: isLabor ? 'var(--surface-2)' : undefined }}
          value={isLabor ? '' : line.partWaitDays}
          onChange={e => onUpdate(line.key, { partWaitDays: e.target.value })}
        />
      </div>

      {/* Warranty Days */}
      <div>
        <input
          className="inp"
          type="number"
          min={0}
          disabled={isLabor}
          placeholder={isLabor ? '—' : '0'}
          style={{ width: '100%', height: 34, fontSize: 12.5, textAlign: 'center', background: isLabor ? 'var(--surface-2)' : undefined }}
          value={isLabor ? '' : line.partWarrantyDays}
          onChange={e => onUpdate(line.key, { partWarrantyDays: e.target.value })}
        />
      </div>

      {/* Delete Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          title="ลบรายการนี้"
          onClick={() => onRemove(line.key)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-mute)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--red)'
            e.currentTarget.style.background = 'var(--red-tint)'
            e.currentTarget.style.borderColor = 'var(--red)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-mute)'
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
