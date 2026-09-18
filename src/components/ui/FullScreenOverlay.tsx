'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface FullScreenOverlayProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function FullScreenOverlay({ open, onClose, title, children }: FullScreenOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-2)' }}
        >
          ← กลับ
        </button>
        {title && (
          <h1 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
        )}
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={20} style={{ color: 'var(--text-2)' }} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
