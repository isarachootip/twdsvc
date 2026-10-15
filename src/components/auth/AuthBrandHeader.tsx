'use client'

import { useState, useEffect } from 'react'
import { useBranding, DEFAULT_BRANDING, resolveBrandLogoUrl } from '@/lib/hooks/useBranding'

interface AuthBrandHeaderProps {
  subtitle: string
}

export function AuthBrandHeader({ subtitle }: AuthBrandHeaderProps) {
  const { branding } = useBranding()
  const [imgSrc, setImgSrc] = useState<string>(DEFAULT_BRANDING.logoUrl)

  useEffect(() => {
    setImgSrc(resolveBrandLogoUrl(branding.logoUrl))
  }, [branding.logoUrl])

  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={branding.companyName || 'Service Center Logo'}
          className="h-14 w-auto max-w-[220px] object-contain"
          onError={() => {
            if (imgSrc !== DEFAULT_BRANDING.logoUrl) {
              setImgSrc(DEFAULT_BRANDING.logoUrl)
            }
          }}
        />
      </div>
      <div className="text-sm" style={{ color: 'var(--text-2)' }}>
        {subtitle}
      </div>
    </div>
  )
}
