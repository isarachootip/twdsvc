'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/client'

export function useSave() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const save = async (fn: () => Promise<unknown>) => {
    setSaving(true)
    try {
      await fn()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
      toast('บันทึกแล้ว ✓', 'success')
      return true
    } catch (e) {
      toast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', 'error')
      return false
    } finally {
      setSaving(false)
    }
  }
  return { saving, save, justSaved }
}

export function SaveButton({
  label,
  saving,
  justSaved,
  onClick,
}: {
  label: string
  saving: boolean
  justSaved: boolean
  onClick: () => void
}) {
  return (
    <button className="btn btn-primary" disabled={saving} onClick={onClick}>
      {saving ? 'กำลังบันทึก…' : justSaved ? 'บันทึกแล้ว ✓' : label}
    </button>
  )
}

export function Row({ children, between }: { children: React.ReactNode; between?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        marginTop: 14,
        justifyContent: between ? 'space-between' : 'flex-end',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {children}
    </div>
  )
}

export function Loading() {
  return <div className="empty">กำลังโหลด…</div>
}

export interface SiteLite {
  id: string
  code: string
  name: string
  type: string
  manager?: string
}

export function useSites() {
  const [sites, setSites] = useState<SiteLite[]>([])
  useEffect(() => {
    api<SiteLite[]>('/api/sites')
      .then(setSites)
      .catch(() => {})
  }, [])
  return sites
}

export function useSetting<T>(key: string) {
  const [val, setVal] = useState<T | null>(null)
  const load = useCallback(
    () =>
      api<Record<string, string>>('/api/admin/settings').then(s => {
        try {
          setVal(JSON.parse(s[key]))
        } catch {
          setVal(s[key] as unknown as T)
        }
      }),
    [key]
  )
  useEffect(() => {
    load()
  }, [load])
  return { val, setVal, load }
}
