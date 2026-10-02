'use client'

import { useState } from 'react'
import { type Photo } from '@/components/ui/PhotoButton'
import { useToast } from '@/components/ui/Toast'
import { detectBarcodeFromImageUrl } from '@/lib/barcode-scanner'

export function useSerialExtractor(photos: Photo[], setSerialNo: (val: string) => void) {
  const { toast } = useToast()
  const [extracting, setExtracting] = useState(false)

  const extractSerialFromPhoto = async () => {
    const photo5 = photos[4] ?? photos.find(p => p?.fileName?.includes('serial_no'))
    if (!photo5?.fileUrl) {
      toast('กรุณาถ่ายหรืออัปโหลดรูปที่ 5 (Serial_no) ก่อนกดดึงค่า', 'error')
      return
    }
    setExtracting(true)
    try {
      const code = await detectBarcodeFromImageUrl(photo5.fileUrl)
      if (code) {
        setSerialNo(code)
        toast(`ดึงค่า Serial No สำเร็จ: ${code}`, 'success')
      } else {
        toast('ไม่พบบาร์โค้ดในภาพ กรุณาระบุด้วยการพิมพ์', 'error')
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ไม่สามารถอ่านบาร์โค้ดได้ กรุณาระบุด้วยการพิมพ์', 'error')
    } finally {
      setExtracting(false)
    }
  }

  return { extractSerialFromPhoto, extracting }
}
