'use client'

import { useRef, useState } from 'react'
import { uploadFile } from '@/lib/client'
import { useToast } from './Toast'

export interface Photo { fileUrl: string; fileName?: string; mimeType?: string; fileSize?: number }

/** ปุ่ม "📷 ถ่ายภาพ" แบบ prototype — เปิดกล้อง (มือถือ) หรือเลือกไฟล์ แล้วอัปโหลดทันที */
export default function PhotoButton({ photos, onChange, label = '📷 ถ่ายภาพ', doneLabel = '✓ ถ่ายแล้ว', multiple = true, disabled }: {
  photos: Photo[]; onChange: (p: Photo[]) => void; label?: string; doneLabel?: string; multiple?: boolean; disabled?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const done = photos.length > 0
  const pick = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const up: Photo[] = []
      for (const f of Array.from(files).slice(0, 4)) up.push(await uploadFile(f))
      onChange(multiple ? [...photos, ...up].slice(0, 8) : up.slice(0, 1))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ', 'error')
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <input ref={ref} type="file" accept="image/*" capture="environment" multiple={multiple} hidden onChange={e => pick(e.target.files)} />
      <button type="button" className={`photo-toggle ${done ? 'done' : ''}`} disabled={disabled || busy} onClick={() => ref.current?.click()}>
        {busy ? 'กำลังอัปโหลด…' : done ? `${doneLabel}${photos.length > 1 ? ` (${photos.length})` : ''}` : label}
      </button>
      {done && !busy && (
        <button type="button" className="remove-btn" title="ลบภาพ" onClick={() => onChange([])} style={{ fontSize: 12 }}>✕</button>
      )}
    </span>
  )
}

/** กล่องภาพ 4 ช่อง (CS / Trade-in) */
export function PhotoGrid({ photos, onChange, max = 4 }: { photos: Photo[]; onChange: (p: Photo[]) => void; max?: number }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const { toast } = useToast()
  const slots = Array.from({ length: max }, (_, i) => photos[i] ?? null)
  const pick = async (files: FileList | null, idx: number) => {
    if (!files?.length) return
    setBusy(idx)
    try {
      const next = [...photos]
      let i = idx
      for (const f of Array.from(files)) {
        if (i >= max) break
        next[i] = await uploadFile(f)
        i++
      }
      onChange(next.filter(Boolean).slice(0, max))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ', 'error')
    } finally {
      setBusy(null)
      if (ref.current) ref.current.value = ''
    }
  }
  const [target, setTarget] = useState(0)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${max}, 1fr)`, gap: 10 }}>
      <input ref={ref} type="file" accept="image/*" capture="environment" hidden multiple onChange={e => pick(e.target.files, target)} />
      {slots.map((p, i) => (
        <div key={i} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => { setTarget(Math.min(i, photos.length)); ref.current?.click() }}
            style={{ width: '100%', aspectRatio: '1 / 1', border: `1px dashed ${p ? 'var(--green)' : 'var(--border-strong)'}`, borderRadius: 10, background: p ? 'var(--green-tint)' : 'var(--surface-2)', color: 'var(--text-mute)', fontSize: 12.5, cursor: 'pointer', overflow: 'hidden', padding: 0, fontFamily: 'inherit' }}
          >
            {busy === i ? 'กำลังอัปโหลด…' : p ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.fileUrl} alt={`ภาพที่ ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : `📷 ภาพที่ ${i + 1}`}
          </button>
          {p && (
            <button type="button" className="remove-btn" onClick={() => onChange(photos.filter((_, k) => k !== i))} style={{ position: 'absolute', top: 2, right: 4, background: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 11 }}>✕</button>
          )}
        </div>
      ))}
    </div>
  )
}
