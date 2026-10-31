import fs from 'fs'
import path from 'path'
import { describe, it, expect, setTier } from '../framework/core'
import { validateCsForm, type ValidateCsFormInput } from '../../src/app/(dashboard)/cs/new/components/formValidation'

setTier('Tier 1')

describe('Unit: CS Form Photo & Field Validation', () => {
  const baseInput: ValidateCsFormInput = {
    role: 'CS',
    selectedBranchId: 'branch-1',
    firstName: 'สมศรี',
    lastName: 'มีสุข',
    phone: '0812345678',
    product: 'สว่านไร้สาย',
    brandName: 'MAKITA',
    symptom: 'เปิดไม่ติด มอเตอร์ไม่หมุน',
    sizeId: 1,
    feesTotal: 0,
    pay: 'PROMPTPAY_QR',
    pos: '',
    photos: [],
  }

  it('VAL-01: Rejects form when photos array is empty', () => {
    const err = validateCsForm({ ...baseInput, photos: [] })
    expect(err).toBe('กรุณาถ่ายภาพสินค้าอย่างน้อย 1 รูปก่อนบันทึก')
  })

  it('VAL-02: Rejects form when photos is undefined or null', () => {
    const err = validateCsForm({ ...baseInput, photos: undefined })
    expect(err).toBe('กรุณาถ่ายภาพสินค้าอย่างน้อย 1 รูปก่อนบันทึก')
  })

  it('VAL-03: Rejects form when photos contains only empty or invalid fileUrl items', () => {
    const err = validateCsForm({
      ...baseInput,
      photos: [{ fileUrl: '' }, { fileUrl: undefined }, null as unknown as { fileUrl: string }],
    })
    expect(err).toBe('กรุณาถ่ายภาพสินค้าอย่างน้อย 1 รูปก่อนบันทึก')
  })

  it('VAL-04: Passes validation when at least 1 valid photo exists', () => {
    const err = validateCsForm({
      ...baseInput,
      photos: [{ fileUrl: 'https://storage.googleapis.com/test-bucket/photo1.jpg' }],
    })
    expect(err).toBe(null)
  })

  it('VAL-05: Passes validation when multiple photos are provided in different slots', () => {
    const err = validateCsForm({
      ...baseInput,
      photos: [
        { fileUrl: 'https://storage.googleapis.com/test-bucket/front.jpg' },
        { fileUrl: 'https://storage.googleapis.com/test-bucket/serial.jpg' },
      ],
    })
    expect(err).toBe(null)
  })

  it('VAL-06: FeesAndPaymentSection keeps post-save secondary buttons visible but disabled', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(dashboard)/cs/new/components/FeesAndPaymentSection.tsx'),
      'utf8'
    )
    expect(src.includes('พิมพ์ใบแจ้งซ่อม')).toBe(true)
    expect(src.includes('+ เปิดใบแจ้งซ่อมใหม่')).toBe(true)
    expect(src.includes('กลับคิว CS')).toBe(true)
    expect(src.includes('disabled onClick={onOpenPrint}')).toBe(true)
    expect(src.includes('disabled onClick={onReset}')).toBe(true)
    expect(src.includes('disabled onClick={onBackToCs}')).toBe(true)
  })

  it('VAL-07: Rejects form when productGroupName is empty and accepts valid productGroupName', () => {
    const validPhotos = [{ fileUrl: 'https://storage.googleapis.com/test-bucket/photo1.jpg' }]
    const missingTypeErr = validateCsForm({ ...baseInput, productGroupName: '   ', photos: validPhotos })
    expect(missingTypeErr).toBe('กรุณาเลือกประเภทสินค้า')

    const okErr = validateCsForm({ ...baseInput, productGroupName: 'เครื่องมือช่าง', photos: validPhotos })
    expect(okErr).toBe(null)
  })
})
