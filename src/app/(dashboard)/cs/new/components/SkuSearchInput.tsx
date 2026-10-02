'use client'

import type { Commodity } from './index'

interface SkuSearchInputProps {
  sku: string
  onSkuChange: (val: string) => void
  skuResults: Commodity[]
  onPickSku: (item: Commodity) => void
  onClearSkuResults: () => void
}

export function SkuSearchInput({
  sku,
  onSkuChange,
  skuResults,
  onPickSku,
  onClearSkuResults,
}: SkuSearchInputProps) {
  return (
    <div className="field" style={{ position: 'relative' }}>
      <label>SKU (ถ้ามี)</label>
      <input
        className="inp"
        placeholder="ไม่บังคับ"
        value={sku}
        onChange={e => onSkuChange(e.target.value)}
        onBlur={() => setTimeout(onClearSkuResults, 200)}
      />
      {skuResults.length > 0 && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            left: 0,
            right: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            marginTop: 2,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {skuResults.map(c => (
            <button
              type="button"
              key={c.id}
              onMouseDown={() => onPickSku(c)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '7px 10px',
                fontSize: 12.5,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <b>{c.sku}</b> — {c.name} <span className="sub-mute">{c.brand}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
