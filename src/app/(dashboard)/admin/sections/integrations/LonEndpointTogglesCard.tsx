'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import {
  LON_ENDPOINTS,
  LON_NOTIFICATION_TYPES,
  LON_TYPE_LABELS,
  type LonEndpointToggles,
  type LonType,
} from '@/lib/validations/lon.schema'

export function LonEndpointTogglesCard() {
  const [toggles, setToggles] = useState<LonEndpointToggles | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = useCallback(() => {
    api<{ toggles: LonEndpointToggles }>('/api/admin/lon-toggles')
      .then((res) => setToggles(res.toggles))
      .catch((e) => toast(e instanceof Error ? e.message : 'โหลดสวิตช์ LON ไม่สำเร็จ', 'error'))
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  if (!toggles) return null

  const toggleItem = async (key: LonType) => {
    const next: LonEndpointToggles = { ...toggles, [key]: !toggles[key] }
    setToggles(next)
    setSaving(true)
    try {
      const res = await api<{ toggles: LonEndpointToggles }>('/api/admin/lon-toggles', {
        method: 'PUT',
        body: next,
      })
      setToggles(res.toggles)
      toast('บันทึกสถานะ Endpoint LON แล้ว', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', 'error')
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>สวิตช์เปิด / ปิดการยิง LON ราย Endpoint</strong>
        <span className="sub-mute" style={{ fontSize: 11.5 }}>
          เส้นที่ปิดไว้จะยังบันทึก Payload ในสถานะข้ามการส่ง (SKIPPED) เพื่อตรวจสอบได้
        </span>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {LON_NOTIFICATION_TYPES.map((type) => {
          const enabled = toggles[type]
          return (
            <label
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '6px 4px',
                borderBottom: '1px solid var(--border)',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{LON_TYPE_LABELS[type]}</div>
                <div className="font-mono sub-mute" style={{ fontSize: 11.5 }}>
                  POST {LON_ENDPOINTS[type]}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${enabled ? 'text-emerald-700' : 'text-amber-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-600' : 'bg-amber-500'}`} />
                  {enabled ? 'เปิดใช้งาน' : 'ปิดรอ API'}
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={saving}
                  onChange={() => toggleItem(type)}
                />
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
