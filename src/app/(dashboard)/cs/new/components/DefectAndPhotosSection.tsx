'use client'

import { useState } from 'react'
import type { Photo } from '@/components/ui/PhotoButton'
import { CategorizedPhotoGrid, PhotoGuideModal } from '@/components/ui/photo-guide'

interface DefectAndPhotosSectionProps {
  photos: Photo[]
  setPhotos: (photos: Photo[]) => void
  defect: string
  setDefect: (val: string) => void
  disabled?: boolean
}

export function DefectAndPhotosSection({
  photos,
  setPhotos,
  defect,
  setDefect,
  disabled,
}: DefectAndPhotosSectionProps) {
  const [showAllGuides, setShowAllGuides] = useState(false)

  return (
    <div className="pcard">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>ภาพถ่ายสินค้า 5 มุมและระบุตำหนิ</h3>
          <p className="hint" style={{ margin: '4px 0 0' }}>
            ถ่ายภาพสินค้าตามมุมมาตรฐาน 5 ด้าน พร้อมรูปตัวอย่างประกอบ
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAllGuides(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            border: '1px solid var(--border-strong, #cbd5e1)',
            background: 'var(--surface-2, #f8fafc)',
            padding: '5px 12px',
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--brand, #b91c1c)',
            cursor: 'pointer',
          }}
        >
          💡 ดูรูปตัวอย่าง 5 มุม
        </button>
      </div>

      <CategorizedPhotoGrid
        photos={photos}
        onChange={setPhotos}
        disabled={disabled}
      />

      <div className="field" style={{ marginTop: 14 }}>
        <label>ระบุตำหนิ (ถ้ามี)</label>
        <textarea
          className="inp"
          placeholder="เช่น รอยขีดข่วนด้านข้าง, สายไฟหลุดลุ่ย, น็อตยึดหลวม"
          value={defect}
          onChange={e => setDefect(e.target.value)}
          disabled={disabled}
        />
      </div>

      {showAllGuides && (
        <PhotoGuideModal
          initialSlotId="front"
          onClose={() => setShowAllGuides(false)}
        />
      )}
    </div>
  )
}
