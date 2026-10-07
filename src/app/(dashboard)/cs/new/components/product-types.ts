export interface Brand {
  id: number
  name: string
}

export interface Size {
  id: number
  code: string
  name: string
}

export interface Commodity {
  id: number
  sku: string
  name: string
  brand: string
  barcode?: string | null
  deptName?: string | null
  model?: string | null
}

export interface ProductSectionProps {
  sku: string
  onSkuChange: (val: string) => void
  skuResults: Commodity[]
  onPickSku: (item: Commodity) => void
  onClearSkuResults: () => void
  product: string
  setProduct: (val: string) => void
  brandName?: string
  setBrandName?: (val: string) => void
  brandId?: string
  setBrandId?: (val: string) => void
  brands: Brand[]
  symptom: string
  setSymptom: (val: string) => void
  serialNo: string
  setSerialNo: (val: string) => void
  onExtractSerial?: () => void
  extractingSerial?: boolean
  warranty: 'yes' | 'no'
  setWarranty: (val: 'yes' | 'no') => void
  allowOutside: boolean
  setAllowOutside: (val: boolean) => void
  sizeId: number | null
  setSizeId: (val: number) => void
  sizes: Size[]
  method: 'STANDARD' | 'EXPRESS'
  setMethod: (val: 'STANDARD' | 'EXPRESS') => void
}
