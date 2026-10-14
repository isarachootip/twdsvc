import { NextRequest, NextResponse } from 'next/server'
import { rateLimited } from '@/lib/public-token'
import { saveUploadedFile } from '@/lib/services/file-storage.service'

const MAX = 10 * 1024 * 1024
/** MIME → stored extension. Extension is derived from MIME, never from the client filename. */
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
  'image/heic': '.heic', 'image/heif': '.heif', 'application/pdf': '.pdf',
}

// POST /api/vendors/upload — สำหรับอัปโหลดเอกสารประกอบการสมัครของร้านค้า (public)
export async function POST(req: NextRequest) {
  if (await rateLimited(req, { bucket: 'vendor-upload', limit: 20, windowMs: 10 * 60_000 })) {
    return NextResponse.json({ error: 'อัปโหลดถี่เกินไป กรุณารอสักครู่แล้วลองใหม่' }, { status: 429 })
  }
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })
    }
    if (file.size > MAX) {
      return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 10MB' }, { status: 400 })
    }
    const ext = EXT_BY_MIME[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ (jpg/png) หรือ PDF' }, { status: 400 })
    }

    const saved = await saveUploadedFile(Buffer.from(await file.arrayBuffer()), {
      prefix: 'vd',
      ext,
      mimeType: file.type,
    })

    return NextResponse.json({
      fileUrl: saved.fileUrl,
      fileName: file.name,
      fileSize: file.size,
    }, { status: 201 })
  } catch (error) {
    console.error('[vendors/upload]', error)
    return NextResponse.json({ error: 'อัปโหลดไฟล์ไม่สำเร็จ' }, { status: 500 })
  }
}
