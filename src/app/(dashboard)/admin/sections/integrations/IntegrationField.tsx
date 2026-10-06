'use client'

import type { IntegrationFieldDef } from '@/lib/config/integration-fields'
import type { MaskedField } from '@/lib/services/integration-config.service'

interface Props {
  def: IntegrationFieldDef
  field: MaskedField
  /** undefined = untouched, string = edited, null = marked for deletion */
  edit: string | null | undefined
  onChange: (value: string) => void
  onClear: () => void
  onUndo: () => void
}

const SOURCE_LABEL: Record<MaskedField['source'], string> = {
  config: 'ตั้งค่าในระบบ',
  env: 'ใช้ค่าจาก .env',
  none: 'ยังไม่ตั้งค่า',
}

export function IntegrationField({ def, field, edit, onChange, onClear, onUndo }: Props) {
  const markedDelete = edit === null
  const value = typeof edit === 'string' ? edit : def.secret ? '' : field.value ?? ''

  return (
    <div className="field">
      <label>
        {def.label}{' '}
        <span className="sub-mute" style={{ fontWeight: 400 }}>
          {markedDelete ? '(จะถูกลบเมื่อบันทึก)' : `— ${SOURCE_LABEL[field.source]}`}
        </span>
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          className="inp"
          type={def.secret ? 'password' : 'text'}
          autoComplete="off"
          disabled={markedDelete}
          value={value}
          placeholder={def.secret ? (field.set ? '•••••••• (พิมพ์เพื่อเปลี่ยนค่า)' : 'ยังไม่ตั้งค่า') : ''}
          onChange={e => onChange(e.target.value)}
        />
        {markedDelete && <button type="button" className="btn" onClick={onUndo}>ยกเลิกการลบ</button>}
        {!markedDelete && field.source === 'config' && (
          <button type="button" className="btn" onClick={onClear} title="ลบค่าที่ตั้งไว้ในระบบ (จะกลับไปใช้ค่าจาก .env ถ้ามี)">
            ลบ
          </button>
        )}
      </div>
    </div>
  )
}
