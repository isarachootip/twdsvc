'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useBranding, DEFAULT_BRANDING, resolveBrandLogoUrl } from '@/lib/hooks/useBranding'

interface SidebarBrandHeaderProps {
  onClose: () => void
}

export default function SidebarBrandHeader({ onClose }: SidebarBrandHeaderProps) {
  const { branding } = useBranding()
  const [imgSrc, setImgSrc] = useState<string>(DEFAULT_BRANDING.logoUrl)

  useEffect(() => {
    setImgSrc(resolveBrandLogoUrl(branding.logoUrl))
  }, [branding.logoUrl])

  return (
    <div className="px-4 py-3.5 border-b flex items-center gap-2.5" style={{ borderColor: 'var(--border)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={branding.companyName || 'Service Center Logo'}
        className="h-8 w-auto max-w-[100px] object-contain shrink-0"
        onError={() => {
          if (imgSrc !== DEFAULT_BRANDING.logoUrl) {
            setImgSrc(DEFAULT_BRANDING.logoUrl)
          }
        }}
      />
      <div className="leading-tight min-w-0">
        <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
          Service Center
        </div>
        <div className="text-[11.5px] truncate" style={{ color: 'var(--text-2)' }}>
          ระบบศูนย์บริการ
        </div>
      </div>
      <button className="ml-auto md:hidden shrink-0" onClick={onClose} aria-label="ปิดเมนู">
        <X size={18} />
      </button>
    </div>
  )
}
