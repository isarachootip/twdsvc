import assert from 'node:assert/strict'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { prisma } from '../../src/lib/db'
import { saveUploadedFile, readStoredFile, UPLOAD_DIR } from '../../src/lib/services/file-storage.service'

async function main() {
  console.log('🧪 Running file-storage.service unit tests...')

  const sampleBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const saved = await saveUploadedFile(sampleBytes, {
    prefix: 'test',
    ext: '.png',
    mimeType: 'image/png',
  })

  assert(saved.name.startsWith('test-'), 'File name should start with prefix')
  assert(saved.name.endsWith('.png'), 'File name should end with extension')
  assert.equal(saved.fileUrl, `/api/files/${saved.name}`)
  assert.equal(saved.size, sampleBytes.length)

  // Simulate container redeploy by deleting local disk cache file
  const diskPath = path.join(UPLOAD_DIR, saved.name)
  await fs.unlink(diskPath).catch(() => {})

  // Reading should still succeed from PostgreSQL stored_files table
  const loaded = await readStoredFile(saved.name)
  assert(loaded !== null, 'File should be loaded from PostgreSQL even after disk file is deleted')
  assert.equal(loaded.mimeType, 'image/png')
  assert.deepEqual(loaded.data, sampleBytes)

  // Clean up test record
  await prisma.storedFile.delete({ where: { name: saved.name } })

  // Invalid filename characters should return null
  const invalid = await readStoredFile('../secret.txt')
  assert.equal(invalid, null)

  console.log('✅ file-storage.service unit tests passed!')
}

main()
  .catch(err => {
    console.error('❌ Test failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
