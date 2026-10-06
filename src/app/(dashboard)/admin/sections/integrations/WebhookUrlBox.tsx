'use client'

import { useToast } from '@/components/ui/Toast'

export function WebhookUrlBox({ baseUrl }: { baseUrl: string }) {
  const { toast } = useToast()
  const base = baseUrl.replace(/\/+$/, '')
  const url = `${base || 'https://<โดเมนของคุณ>'}/api/webhooks/line`
  const isLocal = /^https?:\/\/(localhost|127\.|\[::1\])/.test(base)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('คัดลอก Webhook URL แล้ว', 'success')
    } catch {
      toast('คัดลอกไม่สำเร็จ', 'error')
    }
  }

  return (
    <div className="field">
      <label>Webhook URL (ตั้งใน LINE Developers Console แล้วกด Verify)</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input className="inp" readOnly value={url} />
        <button type="button" className="btn" onClick={copy}>คัดลอก</button>
      </div>
      {(isLocal || !base) && (
        <span className="sub-mute" style={{ color: 'var(--red-dark)' }}>
          LINE เรียก localhost ไม่ได้ ต้องเป็น HTTPS ที่เข้าถึงได้จากอินเทอร์เน็ต (เช่น ngrok หรือ Cloudflare Tunnel)
        </span>
      )}
    </div>
  )
}
