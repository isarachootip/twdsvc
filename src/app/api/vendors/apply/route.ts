import path from 'path'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { fullVendorApplicationSchema } from '@/lib/validations/vendor-setup.schema'
import { createVendorApplication } from '@/lib/services/vendor-application.service'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = fullVendorApplicationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.flatten(),
      }, { status: 400 })
    }

    const data = validation.data

    // If signature is Base64 data URL, save to file
    if (data.agreements.signatureUrl?.startsWith('data:image/')) {
      const base64Data = data.agreements.signatureUrl.split(';base64,').pop()
      if (base64Data) {
        const sigFilename = `sig-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.png`
        await fs.mkdir(UPLOAD_DIR, { recursive: true })
        await fs.writeFile(path.join(UPLOAD_DIR, sigFilename), Buffer.from(base64Data, 'base64'))
        data.agreements.signatureUrl = `/api/files/${sigFilename}`
      }
    }

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
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
