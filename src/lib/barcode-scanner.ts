// Client-side barcode & serial scanner helper
// Tier 1: Modern browser native BarcodeDetector API (fastest, hardware accelerated)
// Tier 2: Universal pure JavaScript decoder (@zxing/browser fallback for all browsers)

import type { DecodeHintType } from '@zxing/library'

interface NativeBarcodeDetector {
  detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>
}

interface WindowWithBarcodeDetector {
  BarcodeDetector?: new (options?: { formats: string[] }) => NativeBarcodeDetector
}

const SUPPORTED_NATIVE_FORMATS = [
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
]

async function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.crossOrigin = 'anonymous'

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('ไม่สามารถเปิดไฟล์รูปภาพเพื่ออ่านบาร์โค้ดได้'))
    img.src = imageUrl
  })

  return img
}

async function tryNativeDetect(img: HTMLImageElement): Promise<string | null> {
  const BarcodeDetectorClass = (window as unknown as WindowWithBarcodeDetector).BarcodeDetector
  if (!BarcodeDetectorClass) return null

  try {
    const detector = new BarcodeDetectorClass({ formats: SUPPORTED_NATIVE_FORMATS })
    const results = await detector.detect(img)
    if (results && results.length > 0) {
      const match = results.find(r => r.rawValue?.trim())
      return match?.rawValue?.trim() || null
    }
  } catch {
    // Ignore native detector errors and allow fallback to JS decoder
  }

  return null
}

async function tryZxingDetect(img: HTMLImageElement): Promise<string | null> {
  try {
    const { BrowserMultiFormatReader } = await import('@zxing/browser')
    const { DecodeHintType, BarcodeFormat } = await import('@zxing/library')

    const hints = new Map<DecodeHintType, unknown>()
    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.ITF,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
    ])

    const reader = new BrowserMultiFormatReader(hints)
    const result = await reader.decodeFromImageElement(img)
    const text = result?.getText()?.trim()
    return text || null
  } catch {
    return null
  }
}

export async function detectBarcodeFromImageUrl(imageUrl: string): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const img = await loadImage(imageUrl)

  // 1. Try Native BarcodeDetector first (if browser supports it)
  const nativeResult = await tryNativeDetect(img)
  if (nativeResult) return nativeResult

  // 2. Fallback to universal pure JavaScript ZXing engine
  const zxingResult = await tryZxingDetect(img)
  if (zxingResult) return zxingResult

  return null
}
