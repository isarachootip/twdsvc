import path from 'path'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.heic': 'image/heic', '.heif': 'image/heif', '.pdf': 'application/pdf' }

// ชื่อไฟล์เป็น random 16 bytes — เดาไม่ได้ (ใช้แสดงภาพในระบบ/หน้า public ได้)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!/^[a-z0-9-]+\.[a-z0-9]+$/i.test(name)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, name))
    return new NextResponse(buf, { headers: { 'Content-Type': TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=31536000, immutable' } })
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}
