import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { saveUploadedFile } from '@/lib/services/file-storage.service'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'application/pdf']
const MAX = 10 * 1024 * 1024

// POST /api/uploads (multipart: file) → { fileUrl, fileName, mimeType, fileSize }
export async function POST(req: NextRequest) {
  try {
    await requireUser(undefined, req)
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new HttpError(400, 'ไม่พบไฟล์')
    if (file.size > MAX) throw new HttpError(400, 'ไฟล์ใหญ่เกิน 10MB')
    const mime = file.type || 'application/octet-stream'
    if (!ALLOWED.includes(mime)) throw new HttpError(400, 'รองรับเฉพาะไฟล์รูปภาพ (jpg/png/heic) หรือ PDF')
    const ext = (path.extname(file.name) || (mime === 'image/png' ? '.png' : '.jpg')).toLowerCase().replace(/[^.a-z0-9]/g, '')
    const saved = await saveUploadedFile(Buffer.from(await file.arrayBuffer()), { ext, mimeType: mime })
    return NextResponse.json({ fileUrl: saved.fileUrl, fileName: file.name, mimeType: mime, fileSize: file.size }, { status: 201 })
  } catch (e) {
    return handleError(e)
  }
}
