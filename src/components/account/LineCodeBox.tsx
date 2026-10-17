'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, RefreshCw } from 'lucide-react'

interface LineCodeBoxProps {
  code: string
  expiresAt: string
  onRefresh: () => void
  onExpired: () => void
}

export function LineCodeBox({ code, expiresAt, onRefresh, onExpired }: LineCodeBoxProps) {
  const [copied, setCopied] = useState(false)
  const [remainingSec, setRemainingSec] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    const update = () => {
      const sec = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setRemainingSec(sec)
      if (sec <= 0) onExpired()
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [expiresAt, onExpired])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is unavailable
    }
  }

  const mins = Math.floor(remainingSec / 60)
  const secs = remainingSec % 60
  const timeText = `${mins}:${String(secs).padStart(2, '0')}`

  return (
    <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-2)' }}>
            รหัสเชื่อมต่อของคุณ (พิมพ์ส่งในแชท LINE OA)
          </div>
          <div className="text-3xl font-mono tracking-widest font-bold select-all" style={{ color: 'var(--text)' }}>
            {code}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn" onClick={copyCode}>
            {copied ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
            {copied ? 'คัดลอกแล้ว' : 'คัดลอกรหัส'}
          </button>
          <button type="button" className="btn" onClick={onRefresh}>
            <RefreshCw size={14} />
            ตรวจสอบสถานะ
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-amber-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse inline-block shrink-0" />
          <span>กำลังรอรับรหัสจากแชท LINE อัตโนมัติ (ตรวจสอบทุก 3 วินาที)</span>
        </div>
        <div style={{ color: 'var(--text-mute)' }}>
          หมดอายุใน <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{timeText}</span> นาที
        </div>
      </div>
    </div>
  )
}
