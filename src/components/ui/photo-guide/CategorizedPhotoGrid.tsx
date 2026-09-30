'use client'

import { useRef, useState } from 'react'
import { uploadFile } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import type { Photo } from '@/components/ui/PhotoButton'
import { PHOTO_SLOTS, type PhotoSlotId } from './types'
import { PhotoGuideSlot } from './PhotoGuideSlot'
import { PhotoGuideModal } from './PhotoGuideModal'

interface CategorizedPhotoGridProps {
  photos: Photo[]
  onChange: (photos: Photo[]) => void
  disabled?: boolean
}

export function CategorizedPhotoGrid({
  photos,
  onChange,
  disabled,
}: CategorizedPhotoGridProps) {
  const ref = useRef<HTMLInputElement>(null)
  const [busyIdx, setBusyIdx] = useState<number | null>(null)
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0)
  const [guideModalSlot, setGuideModalSlot] = useState<PhotoSlotId | null>(null)
  const { toast } = useToast()

  const handlePick = (slotIdx: number) => {
    setActiveSlotIdx(slotIdx)
    ref.current?.click()
  }

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    setBusyIdx(activeSlotIdx)
    try {
      const up = await uploadFile(file)
      const slotConfig = PHOTO_SLOTS[activeSlotIdx]
      const taggedPhoto: Photo = {
        ...up,
        fileName: `${slotConfig.index}_${slotConfig.id}.jpg`,
      }

      const next = [...photos]
      // Ensure array length is at least 5
      while (next.length < PHOTO_SLOTS.length) {
        next.push(undefined as unknown as Photo)
      }
      next[activeSlotIdx] = taggedPhoto
      onChange(next)
      toast(`อัปโหลดรูป${slotConfig.shortTitle}เรียบร้อย`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ', 'error')
    } finally {
      setBusyIdx(null)
      if (ref.current) ref.current.value = ''
    }
  }

  const handleRemove = (slotIdx: number) => {
    const next = [...photos]
    if (next[slotIdx]) {
      delete next[slotIdx]
    }
    onChange(next)
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={e => handleFileChange(e.target.files)}
      />

      {/* 5-Column Responsive Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10,
        }}
      >
        {PHOTO_SLOTS.map((slot, idx) => (
          <PhotoGuideSlot
            key={slot.id}
            slot={slot}
            photo={photos[idx] ?? null}
            isBusy={busyIdx === idx}
            disabled={disabled}
            onPick={() => handlePick(idx)}
            onRemove={() => handleRemove(idx)}
            onOpenGuide={() => setGuideModalSlot(slot.id)}
          />
        ))}
      </div>

      {guideModalSlot && (
        <PhotoGuideModal
          initialSlotId={guideModalSlot}
          onClose={() => setGuideModalSlot(null)}
        />
      )}
    </div>
  )
}
