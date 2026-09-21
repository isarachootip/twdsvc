'use client'

import { useEffect, useState } from 'react'

export default function QrImage({ value, size = 160 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    import('qrcode').then(QR => QR.toDataURL(value, { width: size * 2, margin: 1 })).then(u => { if (alive) setSrc(u) }).catch(() => setSrc(null))
    return () => { alive = false }
  }, [value, size])
  return (
    <div style={{ width: size, height: size, border: '1px solid var(--border-strong)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', background: '#fff' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="QR" width={size - 8} height={size - 8} /> : <span style={{ fontSize: size / 2, color: 'var(--text-mute)' }}>▦</span>}
    </div>
  )
}
