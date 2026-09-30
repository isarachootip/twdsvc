'use client'

import { useState } from 'react'
import { PHOTO_SLOTS, type PhotoSlotId } from './types'
import { PhotoGuideDetail } from './PhotoGuideDetail'

interface PhotoGuideModalProps {
  initialSlotId?: PhotoSlotId
  onClose: () => void
}

export function PhotoGuideModal({ initialSlotId, onClose }: PhotoGuideModalProps) {
  const [activeTab, setActiveTab] = useState<PhotoSlotId>(initialSlotId ?? 'front')
  const currentSlot = PHOTO_SLOTS.find(s => s.id === activeTab) ?? PHOTO_SLOTS[0]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          borderRadius: 14,
          maxWidth: 680,
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #e5e7eb)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              💡 คู่มือรูปภาพตัวอย่าง 5 มุมมาตรฐาน
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-mute, #6b7280)' }}>
              คำแนะนำและตัวอย่างมุมถ่ายภาพสินค้าเพื่อความถูกต้องในการรับซ่อม
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'var(--surface-2, #f3f4f6)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: 'var(--text, #374151)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            background: 'var(--surface-2, #f9fafb)',
            borderBottom: '1px solid var(--border, #e5e7eb)',
            padding: '4px 8px',
            gap: 4,
            overflowX: 'auto',
          }}
        >
          {PHOTO_SLOTS.map(slot => {
            const isActive = slot.id === activeTab
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setActiveTab(slot.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'var(--surface, #ffffff)' : 'transparent',
                  color: isActive ? 'var(--red, #b91c1c)' : 'var(--text-mute, #6b7280)',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                {slot.title}
              </button>
            )
          })}
        </div>

        {/* Body Content */}
        <div style={{ padding: 20, overflowY: 'auto' }}>
          <PhotoGuideDetail slot={currentSlot} />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'var(--surface, #ffffff)',
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ fontSize: 13, padding: '7px 18px' }}
          >
            เข้าใจแล้ว / ปิด
          </button>
        </div>
      </div>
    </div>
  )
}
