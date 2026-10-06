'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { INTEGRATION_FIELDS, type IntegrationGroup, type IntegrationKey } from '@/lib/config/integration-fields'
import type { MaskedField } from '@/lib/services/integration-config.service'
import { useSave, SaveButton, Row, Loading } from './admin-helpers'
import { IntegrationField } from './integrations/IntegrationField'
import { ConnectionTestButtons } from './integrations/ConnectionTestButtons'
import { WebhookUrlBox } from './integrations/WebhookUrlBox'

interface IntegrationsResponse {
  fields: Record<IntegrationKey, MaskedField>
  encryptionReady: boolean
}

type Edits = Partial<Record<IntegrationKey, string | null>>

const GROUP_TITLE: Record<IntegrationGroup, string> = {
  line: 'LINE Official Account (Messaging API)',
  smtp: 'อีเมล (SMTP)',
  general: 'ทั่วไป',
}

export function IntegrationsSection() {
  const [data, setData] = useState<IntegrationsResponse | null>(null)
  const [edits, setEdits] = useState<Edits>({})
  const { saving, save, justSaved } = useSave()

  const load = useCallback(() => api<IntegrationsResponse>('/api/admin/integrations').then(setData), [])
  useEffect(() => { load() }, [load])

  if (!data) return <Loading />

  const setEdit = (key: IntegrationKey, value: string | null | undefined) =>
    setEdits(prev => {
      const next = { ...prev }
      if (value === undefined) delete next[key]
      else next[key] = value
      return next
    })

  const dirty = Object.keys(edits).length > 0
  const baseUrl = typeof edits.APP_BASE_URL === 'string' ? edits.APP_BASE_URL : data.fields.APP_BASE_URL.value ?? ''
  const secretNeedsKey = INTEGRATION_FIELDS.some(f => f.secret && typeof edits[f.key] === 'string' && edits[f.key] !== '')

  const onSave = () =>
    save(async () => {
      // Blank secret = "keep current", so drop it instead of sending an empty string
      const body = Object.fromEntries(
        Object.entries(edits).filter(([k, v]) => !(v === '' && INTEGRATION_FIELDS.find(f => f.key === k)?.secret))
      )
      await api('/api/admin/integrations', { method: 'PUT', body })
      setEdits({})
      await load()
    })

  return (
    <div className="pcard">
      <h3>เชื่อมต่อระบบ (Integrations)</h3>
      <p className="sub-mute">
        ค่าที่ตั้งที่นี่มีผลก่อนค่าใน .env ส่วนค่าลับ (Secret/Token/รหัสผ่าน) จะถูกเข้ารหัสก่อนเก็บ และไม่แสดงกลับมา — เว้นว่างไว้หากไม่ต้องการเปลี่ยน
      </p>
      {!data.encryptionReady && secretNeedsKey && (
        <div className="sub-mute" style={{ color: 'var(--red-dark)' }}>
          ยังไม่ได้ตั้งค่า CONFIG_ENCRYPTION_KEY ใน .env จึงบันทึกค่าลับไม่ได้
        </div>
      )}

      {(['line', 'smtp', 'general'] as const).map(group => (
        <div key={group} style={{ marginTop: 16 }}>
          <h4>{GROUP_TITLE[group]}</h4>
          <div className="grid3" style={{ marginTop: 8 }}>
            {INTEGRATION_FIELDS.filter(f => f.group === group).map(def => (
              <IntegrationField
                key={def.key}
                def={def}
                field={data.fields[def.key]}
                edit={edits[def.key]}
                onChange={v => setEdit(def.key, def.secret && v === '' ? undefined : v)}
                onClear={() => setEdit(def.key, null)}
                onUndo={() => setEdit(def.key, undefined)}
              />
            ))}
          </div>
          {group === 'line' && <WebhookUrlBox baseUrl={baseUrl} />}
          {group !== 'general' && <ConnectionTestButtons group={group} disabled={dirty} />}
        </div>
      ))}

      <Row>
        <SaveButton label="บันทึกการเชื่อมต่อ" saving={saving} justSaved={justSaved} onClick={onSave} />
      </Row>
    </div>
  )
}
