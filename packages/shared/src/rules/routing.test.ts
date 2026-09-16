import { describe, it, expect } from 'vitest';
import {
  resolveRouting,
  assertCompatible,
  MasterRoutingData,
  VendorCenterData,
} from './routing';

describe('Routing Rules (docs/05_business_rules.md §3)', () => {
  const centerVd0088: VendorCenterData = {
    id: 'vc_0088_1',
    code: 'VD-0088-1',
    vendorId: 'v_0088',
    vendor: {
      id: 'v_0088',
      brands: ['b_bosch', 'b_makita'],
      sizes: ['sz_large'],
      isBrandAuthorized: true,
    },
    zoneSiteId: 'site_bangna',
    method: 'DC_DSD',
  };

  const centerVd0091: VendorCenterData = {
    id: 'vc_0091_1',
    code: 'VD-0091-1',
    vendorId: 'v_0091',
    vendor: {
      id: 'v_0091',
      brands: ['b_xiaomi', 'b_philips'],
      sizes: ['sz_small'],
      isBrandAuthorized: true,
    },
    zoneSiteId: 'site_rangsit',
    method: 'DSD',
  };

  const centerVd0102: VendorCenterData = {
    id: 'vc_0102_1',
    code: 'VD-0102-1',
    vendorId: 'v_0102',
    vendor: {
      id: 'v_0102',
      brands: ['b_panasonic'],
      sizes: ['sz_small', 'sz_large'],
      isBrandAuthorized: true,
    },
    zoneSiteId: 'site_chaeng',
    method: 'DC',
  };

  const masterData: MasterRoutingData = {
    routes: [
      {
        branchId: 'site_bangna',
        primaryCenterId: centerVd0088.id,
        primaryCenter: centerVd0088,
        backupCenterId: centerVd0091.id,
        backupCenter: centerVd0091,
        standardChannel: 'DC',
      },
      {
        branchId: 'site_rangsit',
        primaryCenterId: centerVd0091.id,
        primaryCenter: centerVd0091,
        backupCenterId: centerVd0088.id,
        backupCenter: centerVd0088,
        standardChannel: 'DSD',
      },
    ],
    centers: [centerVd0088, centerVd0091, centerVd0102],
  };

  it('should assign primary center when primary is eligible', () => {
    const result = resolveRouting(
      {
        branchId: 'site_bangna',
        brandId: 'b_bosch',
        sizeCategoryId: 'sz_large',
        shippingMethod: 'STANDARD',
      },
      masterData
    );

    expect(result).not.toBeNull();
    expect(result?.vendorCenterId).toBe('vc_0088_1');
    expect(result?.channel).toBe('DC');
  });

  it('should fallback to backup center when primary does not support brand/size', () => {
    // Bangna branch, but product is Xiaomi (small) which VD-0088 does not support
    const result = resolveRouting(
      {
        branchId: 'site_bangna',
        brandId: 'b_xiaomi',
        sizeCategoryId: 'sz_small',
        shippingMethod: 'STANDARD',
      },
      masterData
    );

    expect(result).not.toBeNull();
    expect(result?.vendorCenterId).toBe('vc_0091_1');
  });

  it('should override channel to TPL when shippingMethod is EXPRESS', () => {
    const result = resolveRouting(
      {
        branchId: 'site_bangna',
        brandId: 'b_bosch',
        sizeCategoryId: 'sz_large',
        shippingMethod: 'EXPRESS',
      },
      masterData
    );

    expect(result).not.toBeNull();
    expect(result?.vendorCenterId).toBe('vc_0088_1');
    expect(result?.channel).toBe('TPL');
  });

  it('should fallback to zone center when branch has no direct route for brand', () => {
    // Chaengwattana has no route in masterData.routes, but centerVd0102 has zoneSiteId = site_chaeng
    const result = resolveRouting(
      {
        branchId: 'site_chaeng',
        brandId: 'b_panasonic',
        sizeCategoryId: 'sz_large',
        shippingMethod: 'STANDARD',
      },
      masterData
    );

    expect(result).not.toBeNull();
    expect(result?.vendorCenterId).toBe('vc_0102_1');
    expect(result?.channel).toBe('DC');
  });

  it('should return null when no eligible vendor center exists (triggering PENDING_VENDOR_ASSIGNMENT)', () => {
    const result = resolveRouting(
      {
        branchId: 'site_bangna',
        brandId: 'b_unknown_unsupported',
        sizeCategoryId: 'sz_large',
        shippingMethod: 'STANDARD',
      },
      masterData
    );

    expect(result).toBeNull();
  });

  describe('assertCompatible', () => {
    it('should throw error when DSD center is dispatched via DC channel', () => {
      expect(() => assertCompatible('DSD', 'DC')).toThrow();
    });

    it('should throw error when DC center is dispatched via DSD channel', () => {
      expect(() => assertCompatible('DC', 'DSD')).toThrow();
    });

    it('should allow DC_DSD center on both DC and DSD channels', () => {
      expect(assertCompatible('DC_DSD', 'DC')).toBe(true);
      expect(assertCompatible('DC_DSD', 'DSD')).toBe(true);
    });

    it('should allow TPL channel on all center methods', () => {
      expect(assertCompatible('DSD', 'TPL')).toBe(true);
      expect(assertCompatible('DC', 'TPL')).toBe(true);
      expect(assertCompatible('DC_DSD', 'TPL')).toBe(true);
    });
  });
});
