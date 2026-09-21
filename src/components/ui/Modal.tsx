'use client'

import { useEffect } from 'react'

export default function Modal({ open, onClose, children, size, className, zIndex }: { open: boolean; onClose: () => void; children: React.ReactNode; size?: 'wide' | 'narrow'; className?: string; zIndex?: number }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-overlay" style={zIndex ? { zIndex } : undefined} onClick={onClose}>
      <div className={`modal-box ${size ?? ''} ${className ?? ''}`} onClick={e => e.stopPropagation()}>
        <button className="close-btn no-print" onClick={onClose} aria-label="ปิด">✕</button>
        {children}
      </div>
    </div>
  )
}
