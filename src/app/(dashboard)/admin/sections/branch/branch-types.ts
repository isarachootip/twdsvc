export interface LinkedRoute {
  id: string
  standardChannel: string
  primaryCenter?: { code: string; vendorParent?: { name: string } } | null
  backupCenter?: { code: string; vendorParent?: { name: string } } | null
  dcSite?: { code: string; name: string } | null
}

export interface SiteUserLite {
  id: string
  username: string
  fullName: string
  role: string
  active: boolean
}

export interface SiteDetailItem {
  id: string
  code: string
  name: string
  nickname?: string | null
  type: 'BRANCH' | 'DC'
  province: string
  district?: string | null
  subdistrict?: string | null
  postalCode?: string | null
  address?: string | null
  googleMapsUrl?: string | null
  phone?: string | null
  storeManagerName?: string | null
  storeManagerPhone?: string | null
  storeEmail?: string | null
  openingHours?: string | null
  region?: string | null
  districtManager?: string | null
  manager?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
  openJobsCount?: number
  _count?: { users: number; jobs: number }
  primaryRoutes?: LinkedRoute[]
  users?: SiteUserLite[]
}

export interface SiteFormData {
  id?: string
  code: string
  name: string
  nickname?: string
  type: 'BRANCH' | 'DC'
  province: string
  district?: string
  subdistrict?: string
  postalCode?: string
  address?: string
  googleMapsUrl?: string
  phone?: string
  storeManagerName?: string
  storeManagerPhone?: string
  storeEmail?: string
  openingHours?: string
  region?: string
  districtManager?: string
  active: boolean
}

export interface BranchFilterState {
  search: string
  type: 'ALL' | 'BRANCH' | 'DC'
  status: 'ALL' | 'ACTIVE' | 'INACTIVE'
  region: string
}

export const REGION_OPTIONS = [
  'ทั้งหมด',
  'กรุงเทพและปริมณฑล',
  'ภาคกลาง',
  'ภาคเหนือ',
  'ภาคตะวันออกเฉียงเหนือ (อีสาน)',
  'ภาคตะวันออก',
  'ภาคใต้',
  'ภาคตะวันตก',
] as const
