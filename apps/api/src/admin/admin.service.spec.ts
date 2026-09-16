import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminService } from './admin.service';

describe('AdminService (06_api.md §2 & 07_screens.md §Admin)', () => {
  let adminService: AdminService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit_1' }),
      },
      sizeCategory: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      feeRate: {
        create: vi.fn(),
      },
      site: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      districtManager: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      repairSku: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      payoutCycleConfig: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      systemSetting: {
        findMany: vi.fn(),
        upsert: vi.fn(),
      },
    };

    adminService = new AdminService(mockPrisma);
  });

  it('should update fee rates and record AuditLog', async () => {
    mockPrisma.sizeCategory.findUnique.mockResolvedValue({
      id: 'cat_small',
      code: 'SMALL',
    });
    mockPrisma.feeRate.create.mockResolvedValue({
      id: 'fr_new',
      sizeCategoryId: 'cat_small',
      operationFeeSatang: 35000,
      shippingFee3plSatang: 8000,
    });

    const result = await adminService.updateFeeRates(
      [
        {
          sizeCategoryId: 'cat_small',
          operationFeeSatang: 35000,
          shippingFee3plSatang: 8000,
        },
      ],
      'usr_admin'
    );

    expect(result).toHaveLength(1);
    expect(mockPrisma.feeRate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ operationFeeSatang: 35000 }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entity: 'FeeRate',
          action: 'UPDATE_FEE_RATE',
        }),
      })
    );
  });

  it('should create site and clear districtManager if type is DC', async () => {
    mockPrisma.site.findUnique.mockResolvedValue(null);
    mockPrisma.site.create.mockResolvedValue({
      id: 'site_dc_1',
      code: 'DC01',
      name: 'DC วังน้อย',
      type: 'DC',
      districtManagerId: null,
    });

    const result = await adminService.createSite(
      {
        code: 'DC01',
        name: 'DC วังน้อย',
        type: 'DC' as any,
        districtManagerId: 'dm_1', // Should be ignored for DC
      },
      'usr_admin'
    );

    expect(result.districtManagerId).toBeNull();
    expect(mockPrisma.site.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'DC',
          districtManagerId: null,
        }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it('should update general system settings and record AuditLog', async () => {
    mockPrisma.systemSetting.findMany.mockResolvedValue([
      { key: 'vatRate', value: 0.07 },
      { key: 'quoteExpiryDays', value: 7 },
    ]);

    const updated = await adminService.updateSettings(
      { vatRate: 0.07, quoteExpiryDays: 14 },
      'usr_admin'
    );

    expect(mockPrisma.systemSetting.upsert).toHaveBeenCalledTimes(2);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entity: 'SystemSetting',
          action: 'UPDATE_SETTINGS',
        }),
      })
    );
  });
});
