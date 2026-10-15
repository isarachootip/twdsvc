'use client'

import { useState, useEffect, useCallback } from 'react'

export interface BrandingInfo {
  logoUrl: string
  companyName: string
  taxId: string
  footerNotes: string[]
}

export const DEFAULT_BRANDING: BrandingInfo = {
  logoUrl: '/images/thaiwatsadu-logo.png',
  companyName: 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด',
  taxId: '0105555021215',
  footerNotes: [
    'โปรดเก็บเอกสารเพื่อเป็นหลักฐานในการตรวจสอบรายละเอียดการซ่อมสินค้า',
    'บริษัทขอสงวนสิทธิ์ เรียกเก็บค่าใช้จ่ายที่เกิดขึ้นตามจริง หากสินค้าไม่ได้อยู่ในการรับประกัน',
    'บริษัทขอสงวนสิทธิ์ในการรับฝากสินค้าซ่อมไม่เกิน 14 วันนับจากวันที่สินค้าซ่อมเสร็จ',
    'กำหนดระยะเวลาส่งซ่อมโดยประมาณ ไม่เกิน 30 วัน',
    'บริษัทฯ รับประกันหลังการซ่อม ภายใน 30 วัน (เงื่อนไขเป็นไปตามข้อกำหนดของ Supplier)',
  ],
}

export function useBranding() {
  const [branding, setBranding] = useState<BrandingInfo>(DEFAULT_BRANDING)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/branding')
      if (!res.ok) throw new Error('Failed to load branding')
      const data: BrandingInfo = await res.json()
      setBranding({
        logoUrl: data.logoUrl || DEFAULT_BRANDING.logoUrl,
        companyName: data.companyName || DEFAULT_BRANDING.companyName,
        taxId: data.taxId || DEFAULT_BRANDING.taxId,
        footerNotes: Array.isArray(data.footerNotes) && data.footerNotes.length > 0
          ? data.footerNotes
          : DEFAULT_BRANDING.footerNotes,
      })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { branding, loading, error, reload }
}
