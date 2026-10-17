'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { ExternalLink, QrCode } from 'lucide-react'

interface LineOaQrBoxProps {
  lineOaId: string
  lineAddFriendUrl: string | null
  isAdmin: boolean
}

export function LineOaQrBox({ lineOaId, lineAddFriendUrl, isAdmin }: LineOaQrBoxProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  useEffect(() => {
    if (!lineAddFriendUrl) {
      setQrDataUrl('')
      return
    }
    let active = true
    QRCode.toDataURL(lineAddFriendUrl, { width: 160, margin: 1 })
      .then(url => {
        if (active) setQrDataUrl(url)
      })
      .catch(() => {
        if (active) setQrDataUrl('')
      })
    return () => {
      active = false
    }
  }, [lineAddFriendUrl])

  if (!lineOaId || !lineAddFriendUrl) {
    return (
      <div className="pt-2 border-t text-xs space-y-1" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
        <div className="flex items-center gap-1.5 text-amber-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block shrink-0" />
          <span>ยังไม่ได้ระบุชื่อ @LINE Official Account ID ในระบบ</span>
        </div>
        {isAdmin && (
          <div>
            ผู้ดูแลระบบสามารถกำหนดค่า LINE Official Account ID ได้ที่{' '}
            <Link href="/admin/integrations" className="underline font-medium" style={{ color: 'var(--red)' }}>
              ตั้งค่าระบบหลังบ้าน &gt; เชื่อมต่อระบบ
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pt-3 border-t flex flex-col sm:flex-row items-center gap-4" style={{ borderColor: 'var(--border)' }}>
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={`QR Code สำหรับเพิ่มเพื่อน ${lineOaId}`}
          width={128}
          height={128}
          className="w-32 h-32 shrink-0"
        />
      ) : (
        <div className="w-32 h-32 flex items-center justify-center text-xs" style={{ color: 'var(--text-mute)' }}>
          <QrCode size={28} />
        </div>
      )}
      <div className="space-y-2 text-center sm:text-left">
        <div className="text-xs" style={{ color: 'var(--text-2)' }}>
          สแกน QR Code หรือกดปุ่มด้านล่างเพื่อเพิ่มเพื่อน LINE Official Account
        </div>
        <div className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          LINE OA: <span className="font-mono text-emerald-700">{lineOaId}</span>
        </div>
        <div>
          <a
            href={lineAddFriendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            <ExternalLink size={14} />
            เพิ่มเพื่อน {lineOaId}
          </a>
        </div>
      </div>
    </div>
  )
}
