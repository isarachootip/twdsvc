export interface CommodityItem {
  id: number
  sku: string
  barcode: string | null
  name: string
  brand: string
  productType: string
  active: boolean
  ibc: string | null
  sbc: string | null
  barcode2: string | null
  barcode3: string | null
  barcode4: string | null
  barcode5: string | null
  skuCondition: string | null
  skuConditionName: string | null
  brandCode: string | null
  model: string | null
  vendorNo: string | null
  vendorName: string | null
  deptNo: string | null
  deptName: string | null
  sdeptNo: string | null
  sdeptName: string | null
  classNo: string | null
  className: string | null
  sclassNo: string | null
  sclassName: string | null
  unitCode: string | null
  unitName: string | null
  skuStatusCode: string | null
  skuStatusName: string | null
  skuPrice: string | number | null
  skuCost: string | number | null
  distrmcode: string | null
  norprice: string | number | null
  posprice: string | number | null
}

export interface ProductFilterState {
  search: string
  brand: string
  dept: string
  status: 'all' | 'active' | 'inactive'
  page: number
  limit: number
}

export interface ProductListResponse {
  items: CommodityItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductMetaResponse {
  brands: string[]
  departments: string[]
}
