'use client'

/**
 * Re-export all admin sections from modular files in ./sections/
 * Each domain section is isolated to maintain high cohesion and strict line limits (< 150 lines).
 */
export {
  VendorSection,
  FeeSection,
  BranchSection,
  ZoneSection,
  SlaSection,
  RoleSection,
  SkuSection,
  PayoutSection,
  TradeinSection,
  DashboardSection,
  GeneralSection,
  PendingVendorSection,
  useSave,
  SaveButton,
  Row,
  Loading,
  useSites,
  useSetting,
} from './sections/index'
export type { SiteLite } from './sections/index'
