/**
 * Routing rules for assigning Vendor Center and Channel.
 * Reference: docs/05_business_rules.md §3
 */

export type ChannelType = 'DSD' | 'DC' | 'TPL';
export type VendorCenterMethodType = 'DSD' | 'DC' | 'DC_DSD';

export interface VendorData {
  id: string;
  brands: string[];
  sizes: string[];
  isBrandAuthorized: boolean;
  archivedAt?: Date | string | null;
}

export interface VendorCenterData {
  id: string;
  code: string;
  vendorId: string;
  vendor: VendorData;
  zoneSiteId?: string | null;
  method: VendorCenterMethodType;
  archivedAt?: Date | string | null;
}

export interface RouteData {
  branchId: string;
  primaryCenterId: string;
  primaryCenter: VendorCenterData;
  backupCenterId?: string | null;
  backupCenter?: VendorCenterData | null;
  standardChannel: 'DSD' | 'DC';
}

export interface RoutingJobInput {
  branchId: string;
  brandId?: string | null;
  sizeCategoryId?: string | null;
  shippingMethod?: 'STANDARD' | 'EXPRESS' | null;
  hasWarranty?: boolean | null;
  allowNonAuthorizedVendor?: boolean;
}

export interface MasterRoutingData {
  routes: RouteData[];
  centers: VendorCenterData[];
}

export interface ResolvedRouting {
  vendorCenterId: string;
  channel: ChannelType;
}

/**
 * Validates whether the vendor center method is compatible with the dispatch channel.
 */
export function assertCompatible(method: VendorCenterMethodType, channel: ChannelType): boolean {
  if (channel === 'TPL') return true; // 3PL is compatible with all methods
  if (method === 'DC_DSD') return true; // Hybrid center supports both DC and DSD
  if (method === 'DSD' && channel === 'DC') {
    throw new Error('DSD vendor center cannot receive shipments via DC channel');
  }
  if (method === 'DC' && channel === 'DSD') {
    throw new Error('DC vendor center cannot receive direct DSD shipments');
  }
  return true;
}

/**
 * Determines eligibility of a vendor center for a given job.
 */
export function isCenterEligible(center: VendorCenterData, job: RoutingJobInput): boolean {
  if (center.archivedAt || center.vendor.archivedAt) return false;

  if (job.brandId && !center.vendor.brands.includes(job.brandId)) {
    return false;
  }

  if (job.sizeCategoryId && !center.vendor.sizes.includes(job.sizeCategoryId)) {
    return false;
  }

  const isAuthorizedOk = center.vendor.isBrandAuthorized || Boolean(job.allowNonAuthorizedVendor);
  if (!isAuthorizedOk) {
    return false;
  }

  return true;
}

/**
 * Resolves routing for a job:
 * 1) Branch routes (primary -> backup)
 * 2) Fallback: zone centers where zoneSiteId matches branchId
 * 3) If not found -> returns null (triggers PENDING_VENDOR_ASSIGNMENT)
 */
export function resolveRouting(
  job: RoutingJobInput,
  master: MasterRoutingData
): ResolvedRouting | null {
  function build(center: VendorCenterData, standardChannel: 'DSD' | 'DC'): ResolvedRouting {
    // If shipping method is EXPRESS, it always goes via 3PL (TPL)
    if (job.shippingMethod === 'EXPRESS') {
      return { vendorCenterId: center.id, channel: 'TPL' };
    }

    // Resolve channel compatible with center method
    let channel: ChannelType = standardChannel;
    if (center.method === 'DSD') {
      channel = 'DSD';
    } else if (center.method === 'DC') {
      channel = 'DC';
    }

    assertCompatible(center.method, channel);
    return {
      vendorCenterId: center.id,
      channel,
    };
  }

  // 1) Branch routes
  const branchRoutes = master.routes.filter((r) => r.branchId === job.branchId);
  for (const r of branchRoutes) {
    if (isCenterEligible(r.primaryCenter, job)) {
      return build(r.primaryCenter, r.standardChannel);
    }
    if (r.backupCenter && isCenterEligible(r.backupCenter, job)) {
      return build(r.backupCenter, r.standardChannel);
    }
  }

  // 2) Fallback: Zone center
  const zoneCenter = master.centers.find(
    (c) => c.zoneSiteId === job.branchId && isCenterEligible(c, job)
  );

  if (zoneCenter) {
    const standardChannel = zoneCenter.method === 'DC' ? 'DC' : 'DSD';
    return build(zoneCenter, standardChannel);
  }

  // 3) Not found -> null
  return null;
}
