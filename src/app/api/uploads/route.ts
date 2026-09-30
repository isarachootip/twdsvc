import crypto from 'crypto'
import path from 'path'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
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
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}${ext}`
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()))
    return NextResponse.json({ fileUrl: `/api/files/${name}`, fileName: file.name, mimeType: mime, fileSize: file.size }, { status: 201 })
  } catch (e) {
    return handleError(e)
  }
}
