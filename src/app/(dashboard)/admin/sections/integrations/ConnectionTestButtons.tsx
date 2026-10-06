'use client'

import { useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'

interface TestResponse {
  ok: boolean
  message: string
}

type Target = 'line' | 'smtp' | 'smtp-send'

interface Props {
  group: 'line' | 'smtp'
  /** Tests run against the SAVED configuration, so unsaved edits block testing. */
  disabled: boolean
}

export function ConnectionTestButtons({ group, disabled }: Props) {
  const [busy, setBusy] = useState<Target | null>(null)
  const [result, setResult] = useState<TestResponse | null>(null)
  const { toast, prompt } = useToast()

  const run = async (target: Target, to?: string) => {
    setBusy(target)
    setResult(null)
    try {
      setResult(await api<TestResponse>('/api/admin/integrations/test', { method: 'POST', body: { target, to } }))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ทดสอบไม่สำเร็จ', 'error')
    } finally {
      setBusy(null)
    }
  }

  const sendTest = async () => {
    const to = await prompt({
      title: 'ส่งอีเมลทดสอบ',
      message: 'ระบบจะส่งอีเมลทดสอบด้วยการตั้งค่า SMTP ที่บันทึกไว้',
      input: { label: 'อีเมลผู้รับ', placeholder: 'name@example.com', required: true },
    })
    if (to) run('smtp-send', to.trim())
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {group === 'line' ? (
          <button type="button" className="btn" disabled={disabled || busy !== null} onClick={() => run('line')}>
            {busy === 'line' ? 'กำลังทดสอบ…' : 'ทดสอบ LINE'}
          </button>
        ) : (
          <>
            <button type="button" className="btn" disabled={disabled || busy !== null} onClick={() => run('smtp')}>
              {busy === 'smtp' ? 'กำลังทดสอบ…' : 'ทดสอบ SMTP'}
            </button>
            <button type="button" className="btn" disabled={disabled || busy !== null} onClick={sendTest}>
              {busy === 'smtp-send' ? 'กำลังส่ง…' : 'ส่งอีเมลทดสอบ'}
            </button>
          </>
        )}
      </div>
      {disabled && <div className="sub-mute" style={{ marginTop: 4 }}>บันทึกการตั้งค่าก่อน จึงจะทดสอบได้</div>}
      {result && (
        <div className="sub-mute" role="status" style={{ marginTop: 6, color: result.ok ? 'var(--text-2)' : 'var(--red-dark)' }}>
          {result.ok ? '✔ ' : '✖ '}{result.message}
        </div>
      )}
    </div>
  )
}
