import crypto from 'crypto'
import path from 'path'
import { promises as fs } from 'fs'
import { prisma } from '@/lib/db'

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')

export const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.pdf': 'application/pdf',
}

export interface SaveFileOptions {
  prefix?: string
  ext: string
  mimeType: string
}

export interface SavedFileResult {
  name: string
  fileUrl: string
  size: number
}

/**
 * Persists an uploaded file into PostgreSQL (`stored_files`) so files survive
 * stateless container redeployments on Coolify/Docker, and also writes a local
 * disk cache copy under UPLOAD_DIR.
 */
export async function saveUploadedFile(buffer: Buffer, opts: SaveFileOptions): Promise<SavedFileResult> {
  const cleanExt = opts.ext.startsWith('.') ? opts.ext.toLowerCase() : `.${opts.ext.toLowerCase()}`
  const safeExt = cleanExt.replace(/[^.a-z0-9]/g, '') || '.jpg'
  const rand = crypto.randomBytes(8).toString('hex')
  const baseName = `${Date.now().toString(36)}-${rand}${safeExt}`
  const name = opts.prefix ? `${opts.prefix}-${baseName}` : baseName
  const mimeType = opts.mimeType || CONTENT_TYPES[safeExt] || 'application/octet-stream'

  await prisma.storedFile.create({
    data: {
      name,
      mimeType,
      size: buffer.length,
      data: new Uint8Array(buffer),
    },
  })

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(path.join(UPLOAD_DIR, name), buffer)
  } catch {
    // Ignore disk cache errors in read-only or ephemeral environments
  }

  return {
    name,
    fileUrl: `/api/files/${name}`,
    size: buffer.length,
  }
}

/**
 * Reads a stored file by name from PostgreSQL first, falling back to UPLOAD_DIR
 * on disk for legacy files uploaded prior to database persistence.
 */
export async function readStoredFile(name: string): Promise<{ data: Buffer; mimeType: string } | null> {
  if (!/^[a-z0-9-]+\.[a-z0-9]+$/i.test(name)) return null

  const record = await prisma.storedFile.findUnique({ where: { name } })
  if (record) {
    return {
      data: Buffer.from(record.data),
      mimeType: record.mimeType || CONTENT_TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream',
    }
  }

  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, name))
    const mimeType = CONTENT_TYPES[path.extname(name).toLowerCase()] ?? 'application/octet-stream'
    return { data: buf, mimeType }
  } catch {
    return null
  }
}
