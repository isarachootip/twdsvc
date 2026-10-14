import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { findToken, rateLimited } from '@/lib/public-token'
import { saveUploadedFile } from '@/lib/services/file-storage.service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (await rateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const { token } = await params
  const pt = await findToken(token, ['DRIVER', 'TRACKING', 'QUOTE'])
  if (!pt || pt.expiresAt < new Date()) {
    return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' }, { status: 400 })
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File) || !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'ไฟล์ภาพไม่ถูกต้อง (ขนาดไม่เกิน 10MB)' }, { status: 400 })
  }

  const ext = (path.extname(file.name) || '.jpg').toLowerCase().replace(/[^.a-z0-9]/g, '')
  const saved = await saveUploadedFile(Buffer.from(await file.arrayBuffer()), { ext, mimeType: file.type })

  return NextResponse.json({
    fileUrl: saved.fileUrl,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  })
}
