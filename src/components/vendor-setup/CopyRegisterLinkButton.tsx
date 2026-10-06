'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const REGISTER_PATH = '/vendor/register'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Non-HTTPS / permission denied: fall back to a temporary textarea
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}

export function CopyRegisterLinkButton() {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    const ok = await copyText(`${window.location.origin}${REGISTER_PATH}`)
    if (!ok) {
      toast('คัดลอกไม่สำเร็จ กรุณาคัดลอกลิงก์จากแถบที่อยู่เอง', 'error')
      return
    }
    setCopied(true)
    toast('คัดลอกลิงก์สมัครคู่ค้าแล้ว', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" className="btn" onClick={handleCopy}>
      {copied ? <Check size={14} /> : <Link2 size={14} />}
      <span className="ml-1.5">คัดลอกลิงก์สมัครคู่ค้า</span>
    </button>
  )
}
