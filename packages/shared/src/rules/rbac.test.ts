import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ROLE_MENUS,
  getHomeRouteForRole,
  canAccessMenu,
  scopeJobsFor,
} from './rbac';

describe('RBAC Rules & Scope (08_rbac.md)', () => {
  it('should have correct default menus for all roles', () => {
    // ADMIN has all 11 menus
    expect(DEFAULT_ROLE_MENUS.ADMIN).toHaveLength(11);
    expect(DEFAULT_ROLE_MENUS.ADMIN).toContain('exec');
    expect(DEFAULT_ROLE_MENUS.ADMIN).toContain('admin');

    // EXECUTIVE has 4 menus
    expect(DEFAULT_ROLE_MENUS.EXECUTIVE).toEqual([
      'exec',
      'analytics',
      'jobs',
      'vd_payment',
    ]);

    // CS has jobs, cs, tradein
    expect(DEFAULT_ROLE_MENUS.CS).toEqual(['jobs', 'cs', 'tradein']);

    // GR has jobs, gr
    expect(DEFAULT_ROLE_MENUS.GR).toEqual(['jobs', 'gr']);

    // DC has jobs, dc
    expect(DEFAULT_ROLE_MENUS.DC).toEqual(['jobs', 'dc']);

    // VD has jobs, vd
    expect(DEFAULT_ROLE_MENUS.VD).toEqual(['jobs', 'vd']);

    // S2 has jobs, s2
    expect(DEFAULT_ROLE_MENUS.S2).toEqual(['jobs', 's2']);
  });

  it('should return correct home routes for each role (07_screens §0)', () => {
    expect(getHomeRouteForRole('ADMIN')).toBe('/exec');
    expect(getHomeRouteForRole('EXECUTIVE')).toBe('/exec');
    expect(getHomeRouteForRole('CS')).toBe('/cs');
    expect(getHomeRouteForRole('GR')).toBe('/gr');
    expect(getHomeRouteForRole('DC')).toBe('/dc');
    expect(getHomeRouteForRole('VD')).toBe('/vd');
    expect(getHomeRouteForRole('S2')).toBe('/s2');
  });

  it('should test canAccessMenu with default matrix and overrides', () => {
    expect(canAccessMenu('CS', 'cs')).toBe(true);
    expect(canAccessMenu('CS', 'admin')).toBe(false);
    expect(canAccessMenu('ADMIN', 'admin')).toBe(true);
    expect(canAccessMenu('GR', 'gr')).toBe(true);
    expect(canAccessMenu('GR', 'cs')).toBe(false);

    // Custom override
    expect(canAccessMenu('CS', 'admin', { 'CS:admin': true })).toBe(true);
    expect(canAccessMenu('ADMIN', 'cs', { 'ADMIN:cs': false })).toBe(false);
  });

  it('should generate accurate data scope for scopeJobsFor (08_rbac.md §4)', () => {
    // ADMIN & EXECUTIVE see all jobs
    expect(scopeJobsFor({ role: 'ADMIN' })).toEqual({});
    expect(scopeJobsFor({ role: 'EXECUTIVE' })).toEqual({});

    // CS, GR, S2 see only branch jobs
    expect(scopeJobsFor({ role: 'CS', siteId: 'site_bangna' })).toEqual({
      branchId: 'site_bangna',
    });
    expect(scopeJobsFor({ role: 'GR', siteId: 'site_bangna' })).toEqual({
      branchId: 'site_bangna',
    });
    expect(scopeJobsFor({ role: 'S2', siteId: 'site_bangna' })).toEqual({
      branchId: 'site_bangna',
    });

    // VD sees only vendorCenter jobs
    expect(scopeJobsFor({ role: 'VD', vendorCenterId: 'vc_bosch_bkk' })).toEqual(
      { vendorCenterId: 'vc_bosch_bkk' }
    );

    // DC sees DC channel or shipment leg through DC
    const dcScope = scopeJobsFor({ role: 'DC', siteId: 'site_dc_wangnoi' });
    expect(dcScope.OR).toBeDefined();
    expect(dcScope.OR).toContainEqual({ channel: 'DC' });
  });
});
