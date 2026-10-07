'use client'

import type { Commodity } from './index'

interface SkuSearchInputProps {
  sku: string
  onSkuChange: (val: string) => void
  skuResults: Commodity[]
  onPickSku: (item: Commodity) => void
  onClearSkuResults: () => void
  onOpenPicker?: () => void
}

export function SkuSearchInput({
  sku,
  onSkuChange,
  skuResults,
  onPickSku,
  onClearSkuResults,
  onOpenPicker,
}: SkuSearchInputProps) {
  return (
    <div className="field" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label>SKU (ถ้ามี)</label>
        {onOpenPicker && (
          <button
            type="button"
            onClick={onOpenPicker}
            style={{
              fontSize: 11.5,
              background: 'none',
              border: 'none',
              color: 'var(--brand, #b91c1c)',
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
            }}
          >
            🔍 ค้นหาละเอียด
          </button>
        )}
      </div>
      <input
        className="inp"
        placeholder="รหัส SKU หรือพิมพ์ค้นหา"
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
            maxHeight: 240,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
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
                padding: '8px 10px',
                fontSize: 12.5,
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div>
                <b>{c.sku}</b> — {c.name} {c.model ? `(${c.model})` : ''}
              </div>
              <div className="sub-mute" style={{ fontSize: 11, marginTop: 2 }}>
                แบรนด์: <b>{c.brand}</b> {c.deptName ? `| กลุ่ม: ${c.deptName}` : ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
