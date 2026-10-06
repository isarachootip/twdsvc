import path from 'path'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { fullVendorApplicationSchema } from '@/lib/validations/vendor-setup.schema'
import { createVendorApplication } from '@/lib/services/vendor-application.service'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

/** Persists a validated PNG/JPEG data-URL signature to disk and returns its file URL. */
async function saveSignature(dataUrl: string): Promise<string> {
  const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl)
  if (!match) return dataUrl // already a file path (validated by Zod)
  const ext = match[1] === 'png' ? 'png' : 'jpg'
  const name = `sig-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.${ext}`
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(match[2], 'base64'))
  return `/api/files/${name}`
}

// POST /api/vendors/apply — public vendor self-registration
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validation = fullVendorApplicationSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง', details: validation.error.flatten() }, { status: 400 })
  }

  try {
    const data = validation.data
    data.agreements.signatureUrl = await saveSignature(data.agreements.signatureUrl)
    const app = await createVendorApplication(data)

    return NextResponse.json({
      ok: true,
      applicationNo: app.applicationNo,
      id: app.id,
      status: app.status,
      estimatedTier: app.estimatedTier,
      score: app.score,
    }, { status: 201 })
  } catch (error) {
    console.error('[vendors/apply]', error)
    return NextResponse.json({ error: 'ส่งใบสมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 500 })
  }
}
