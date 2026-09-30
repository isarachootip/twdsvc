'use client'

import { PhotoGrid, type Photo } from '@/components/ui/PhotoButton'

interface DefectAndPhotosSectionProps {
  photos: Photo[]
  setPhotos: (photos: Photo[]) => void
  defect: string
  setDefect: (val: string) => void
}

export function DefectAndPhotosSection({
  photos,
  setPhotos,
  defect,
  setDefect,
}: DefectAndPhotosSectionProps) {
  return (
    <div className="pcard">
      <h3>ภาพถ่ายสินค้าและระบุตำหนิ</h3>
      <p className="hint">ถ่ายภาพได้สูงสุด 4 ภาพ</p>
      <PhotoGrid photos={photos} onChange={setPhotos} />
      <div className="field" style={{ marginTop: 12 }}>
        <label>ระบุตำหนิ</label>
        <textarea
          className="inp"
          placeholder="เช่น รอยขีดข่วนด้านข้าง, สายไฟหลุดลุ่ย"
          value={defect}
          onChange={e => setDefect(e.target.value)}
        />
      </div>
    </div>
  )
}
