'use client'

import { useState } from 'react'
import { ImageOff, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

export interface AttachmentItem {
  id: string
  fileUrl: string
  fileName?: string | null
  kind?: string | null
}

export default function AttachmentGallery({ attachments }: { attachments: AttachmentItem[] }) {
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({})
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (!attachments || attachments.length === 0) return null

  const markFailed = (id: string) => {
    setFailedIds(prev => (prev[id] ? prev : { ...prev, [id]: true }))
  }

  const activeItem = lightboxIdx !== null ? attachments[lightboxIdx] : null

  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        {attachments.map((a, idx) => {
          const isFailed = !!failedIds[a.id]
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                if (!isFailed) setLightboxIdx(idx)
              }}
              title={isFailed ? 'ไม่พบไฟล์ภาพในระบบ (ไฟล์ก่อนอัปเกรดระบบจัดเก็บ)' : (a.fileName || a.kind || 'ดูภาพขยาย')}
              style={{
                width: 56,
                height: 56,
                padding: 0,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                overflow: 'hidden',
                cursor: isFailed ? 'default' : 'zoom-in',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {isFailed ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: 'var(--text-mute)', padding: 2 }}>
                  <ImageOff size={16} />
                  <span style={{ fontSize: 9, lineHeight: 1.1, maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.kind || 'ไม่มีภาพ'}
                  </span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.fileUrl}
                  alt={a.fileName || a.kind || 'attachment'}
                  onError={() => markFailed(a.id)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {activeItem && lightboxIdx !== null && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8, color: '#fff', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {activeItem.fileName || activeItem.kind || 'รูปภาพประกอบ'} ({lightboxIdx + 1}/{attachments.length})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={activeItem.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none', opacity: 0.9 }}
                >
                  <ExternalLink size={14} /> เปิดแท็บใหม่
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxIdx(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeItem.fileUrl}
              alt={activeItem.fileName || activeItem.kind || 'preview'}
              style={{ maxWidth: '88vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 8, background: '#000' }}
            />

            {attachments.length > 1 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((lightboxIdx - 1 + attachments.length) % attachments.length)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                >
                  <ChevronLeft size={15} /> ก่อนหน้า
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % attachments.length)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                >
                  ถัดไป <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
