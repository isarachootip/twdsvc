'use client'

import type { PhotoSlotConfig } from './types'
import { SampleIllustration } from './SampleIllustrations'

export function PhotoGuideDetail({ slot }: { slot: PhotoSlotConfig }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 220px) 1fr',
        gap: 20,
        alignItems: 'center',
      }}
    >
      {/* Illustration Card */}
      <div
        style={{
          aspectRatio: '1 / 1',
          borderRadius: 12,
          border: '1.5px dashed var(--border-strong, #d1d5db)',
          background: 'var(--surface-2, #f9fafb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          color: 'var(--brand, #b91c1c)',
        }}
      >
        <SampleIllustration id={slot.id} />
      </div>

      {/* Guide Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: 11.5,
            padding: '3px 8px',
            borderRadius: 6,
            fontWeight: 600,
            alignSelf: 'flex-start',
          }}
        >
          มุมที่ {slot.index} จาก 5
        </div>
        <h4 style={{ margin: 0, fontSize: 16 }}>{slot.title}</h4>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text, #374151)', lineHeight: 1.5 }}>
          {slot.description}
        </p>

        <div
          style={{
            marginTop: 6,
            padding: 12,
            borderRadius: 8,
            background: 'var(--surface-2, #f3f4f6)',
            borderLeft: '4px solid var(--brand, #b91c1c)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text, #111827)' }}>
            📌 เทคนิคการถ่ายภาพ:
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-mute, #4b5563)', marginTop: 4 }}>
            {slot.tips}
          </div>
        </div>
      </div>
    </div>
  )
}
