import crypto from 'crypto'
import path from 'path'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
const MAX = 10 * 1024 * 1024

// POST /api/vendors/upload — สำหรับอัปโหลดเอกสารประกอบการสมัครของร้านค้า
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 })
    }
    if (file.size > MAX) {
      return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 10MB' }, { status: 400 })
    }
    const mime = file.type || 'application/octet-stream'
    if (!ALLOWED.includes(mime)) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ (jpg/png) หรือ PDF' }, { status: 400 })
    }

    const ext = (path.extname(file.name) || (mime === 'image/png' ? '.png' : '.jpg')).toLowerCase()
    const name = `vd-${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext}`
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()))

    return NextResponse.json({
      fileUrl: `/api/files/${name}`,
      fileName: file.name,
      fileSize: file.size,
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
