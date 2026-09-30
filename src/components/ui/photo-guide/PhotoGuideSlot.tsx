'use client'

import type { Photo } from '@/components/ui/PhotoButton'
import type { PhotoSlotConfig } from './types'
import { SampleIllustration } from './SampleIllustrations'

interface PhotoGuideSlotProps {
  slot: PhotoSlotConfig
  photo: Photo | null
  isBusy: boolean
  disabled?: boolean
  onPick: () => void
  onRemove: () => void
  onOpenGuide: () => void
}

export function PhotoGuideSlot({
  slot,
  photo,
  isBusy,
  disabled,
  onPick,
  onRemove,
  onOpenGuide,
}: PhotoGuideSlotProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 10,
        border: `1.5px ${photo ? 'solid var(--green, #16a34a)' : 'dashed var(--border-strong, #d1d5db)'}`,
        background: photo ? 'var(--green-tint, #f0fdf4)' : 'var(--surface-2, #fafafa)',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Top Header Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          background: photo ? 'rgba(22, 163, 74, 0.08)' : 'rgba(0,0,0,0.03)',
          borderBottom: `1px solid ${photo ? 'rgba(22, 163, 74, 0.2)' : 'var(--border, #e5e7eb)'}`,
          fontSize: 11.5,
          fontWeight: 600,
          color: photo ? 'var(--green, #16a34a)' : 'var(--text, #374151)',
        }}
      >
        <span>{slot.title}</span>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onOpenGuide()
          }}
          style={{
            border: 'none',
            background: 'none',
            color: 'var(--brand, #b91c1c)',
            fontSize: 10.5,
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
          title={`ดูตัวอย่างภาพถ่าย${slot.shortTitle}`}
        >
          รูปตัวอย่าง
        </button>
      </div>

      {/* Main Box: Image or Guide Illustration */}
      <div
        onClick={() => !disabled && !isBusy && onPick()}
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer',
          padding: 8,
        }}
      >
        {isBusy ? (
          <div style={{ fontSize: 12, color: 'var(--text-mute)' }}>กำลังอัปโหลด…</div>
        ) : photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.fileUrl}
            alt={slot.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: 'var(--text-mute, #9ca3af)',
            }}
          >
            <div style={{ width: 44, height: 44, opacity: 0.75 }}>
              <SampleIllustration id={slot.id} />
            </div>
            <span style={{ fontSize: 11, textAlign: 'center' }}>📷 แตะเพื่อถ่ายภาพ</span>
          </div>
        )}
      </div>

      {/* Action footer */}
      {photo && !disabled && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 6px',
            borderTop: '1px solid rgba(22, 163, 74, 0.2)',
            background: '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={onPick}
            style={{
              border: 'none',
              background: 'none',
              fontSize: 10.5,
              color: 'var(--text-mute)',
              cursor: 'pointer',
              padding: '2px 4px',
            }}
          >
            ถ่ายใหม่
          </button>
          <button
            type="button"
            onClick={onRemove}
            style={{
              border: 'none',
              background: '#fee2e2',
              color: '#dc2626',
              borderRadius: 4,
              fontSize: 10.5,
              cursor: 'pointer',
              padding: '2px 6px',
              fontWeight: 600,
            }}
          >
            ✕ ลบ
          </button>
        </div>
      )}
    </div>
  )
}
