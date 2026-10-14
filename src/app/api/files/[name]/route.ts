import { NextRequest, NextResponse } from 'next/server'
import { readStoredFile } from '@/lib/services/file-storage.service'

// ชื่อไฟล์เป็น random 16 bytes — เดาไม่ได้ (ใช้แสดงภาพในระบบ/หน้า public ได้)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const stored = await readStoredFile(name)
  if (!stored) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return new NextResponse(new Uint8Array(stored.data), {
    headers: {
      'Content-Type': stored.mimeType,
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
