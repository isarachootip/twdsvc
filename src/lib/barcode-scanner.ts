// Client-side barcode & serial scanner helper
// Uses modern browser native BarcodeDetector API

export async function detectBarcodeFromImageUrl(imageUrl: string): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const BarcodeDetectorClass = (
    window as unknown as {
      BarcodeDetector?: new (options?: { formats: string[] }) => {
        detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>
      }
    }
  ).BarcodeDetector

  if (!BarcodeDetectorClass) {
    throw new Error('เบราว์เซอร์นี้ไม่รองรับ BarcodeDetector API กรุณากรอก Serial Number ด้วยตนเอง')
  }

  const img = new Image()
  img.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('ไม่สามารถเปิดไฟล์รูปภาพเพื่ออ่านบาร์โค้ดได้'))
    img.src = imageUrl
  })

  try {
    const detector = new BarcodeDetectorClass({
      formats: [
        'code_128',
        'code_39',
        'code_93',
        'codabar',
        'ean_13',
        'ean_8',
        'itf',
        'upc_a',
        'upc_e',
        'qr_code',
        'data_matrix',
      ],
    })

    const results = await detector.detect(img)
    if (results && results.length > 0) {
      const code = results.find(r => r.rawValue?.trim())?.rawValue?.trim()
      return code || null
    }
    return null
  } catch {
    throw new Error('เกิดข้อผิดพลาดในการประมวลผลรูปภาพบาร์โค้ด')
  }
}
