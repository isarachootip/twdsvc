export interface ValidateCsFormInput {
  role: string
  selectedBranchId: string
  firstName: string
  lastName: string
  phone: string
  product: string
  brandId: string
  symptom: string
  sizeId: number | null
  feesTotal: number
  pay: string
  pos: string
}

export function validateCsForm(input: ValidateCsFormInput): string | null {
  if (input.role === 'ADMIN' && !input.selectedBranchId) return 'กรุณาเลือกสาขาที่เปิดงาน'
  if (!input.firstName.trim()) return 'กรุณากรอกชื่อลูกค้า'
  if (!input.lastName.trim()) return 'กรุณากรอกนามสกุลลูกค้า'
  if (!/^0\d{8,9}$/.test(input.phone.replace(/\D/g, '')))
    return 'กรุณากรอกเบอร์โทรให้ถูกต้อง (เช่น 0812345678)'
  if (!input.product.trim()) return 'กรุณากรอกชื่อสินค้า'
  if (!input.brandId) return 'กรุณาเลือกแบรนด์'
  if (!input.symptom.trim()) return 'กรุณากรอกอาการเสีย'
  if (!input.sizeId) return 'กรุณาเลือกขนาดสินค้า'
  if (input.feesTotal > 0 && input.pay === 'POS_RECEIPT' && !input.pos.trim())
    return 'กรุณากรอกเลขที่ใบเสร็จ POS'
  return null
}
