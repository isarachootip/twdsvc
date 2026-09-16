import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SiteType,
  ChargeType,
  PayoutCycleType,
} from '@svcm/db';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async recordAuditLog(params: {
    userId: string;
    entity: string;
    entityId: string;
    action: string;
    before?: any;
    after?: any;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        entity: params.entity,
        entityId: params.entityId,
        action: params.action,
        before: params.before ? JSON.parse(JSON.stringify(params.before)) : null,
        after: params.after ? JSON.parse(JSON.stringify(params.after)) : null,
      },
    });
  }

  // ───────────── 1. Fee Rates & Size Categories (Section 2) ─────────────
  async getSizeCategories() {
    const categories = await this.prisma.sizeCategory.findMany({
      include: {
        feeRates: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
      orderBy: { code: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      code: cat.code,
      name: cat.name,
      currentFeeRate: cat.feeRates[0] || {
        operationFeeSatang: 0,
        shippingFee3plSatang: 0,
        effectiveFrom: new Date(),
      },
    }));
  }

  async createSizeCategory(
    dto: {
      code: string;
      name: string;
      operationFeeSatang?: number;
      shippingFee3plSatang?: number;
    },
    userId: string
  ) {
    const existing = await this.prisma.sizeCategory.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(`รหัสประเภทสินค้า "${dto.code}" มีอยู่ในระบบแล้ว`);
    }

    const category = await this.prisma.sizeCategory.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        feeRates: {
          create: {
            operationFeeSatang: dto.operationFeeSatang || 0,
            shippingFee3plSatang: dto.shippingFee3plSatang || 0,
          },
        },
      },
      include: {
        feeRates: true,
      },
    });

    await this.recordAuditLog({
      userId,
      entity: 'SizeCategory',
      entityId: category.id,
      action: 'CREATE',
      after: category,
    });

    return category;
  }

  async updateFeeRates(
    rates: Array<{
      sizeCategoryId: string;
      operationFeeSatang: number;
      shippingFee3plSatang: number;
    }>,
    userId: string
  ) {
    const results: any[] = [];
    for (const rate of rates) {
      const cat = await this.prisma.sizeCategory.findUnique({
        where: { id: rate.sizeCategoryId },
      });
      if (!cat) continue;

      const newFee = await this.prisma.feeRate.create({
        data: {
          sizeCategoryId: rate.sizeCategoryId,
          operationFeeSatang: Math.round(rate.operationFeeSatang),
          shippingFee3plSatang: Math.round(rate.shippingFee3plSatang),
          effectiveFrom: new Date(),
        },
      });

      await this.recordAuditLog({
        userId,
        entity: 'FeeRate',
        entityId: newFee.id,
        action: 'UPDATE_FEE_RATE',
        after: newFee,
      });

      results.push(newFee);
    }
    return results;
  }

  // ───────────── 2. Sites & District Managers (Section 3) ─────────────
  async getSites(type?: SiteType) {
    const sites = await this.prisma.site.findMany({
      where: {
        ...(type ? { type } : {}),
        archivedAt: null,
      },
      include: {
        districtManager: true,
        _count: {
          select: {
            jobsOpened: true,
            users: true,
          },
        },
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    return sites.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      type: s.type,
      address: s.address,
      districtManagerId: s.districtManagerId,
      districtManager: s.districtManager,
      jobsCount: s._count.jobsOpened,
      usersCount: s._count.users,
    }));
  }

  async createSite(
    dto: {
      code: string;
      name: string;
      type: SiteType;
      districtManagerId?: string;
      address?: string;
    },
    userId: string
  ) {
    const existing = await this.prisma.site.findUnique({
      where: { code: dto.code.trim() },
    });
    if (existing) {
      throw new BadRequestException(`รหัสสาขา/คลัง "${dto.code}" มีอยู่ในระบบแล้ว`);
    }

    const site = await this.prisma.site.create({
      data: {
        code: dto.code.trim(),
        name: dto.name.trim(),
        type: dto.type,
        districtManagerId: dto.type === 'BRANCH' ? dto.districtManagerId || null : null,
        address: dto.address?.trim() || null,
      },
      include: {
        districtManager: true,
      },
    });

    await this.recordAuditLog({
      userId,
      entity: 'Site',
      entityId: site.id,
      action: 'CREATE',
      after: site,
    });

    return site;
  }

  async updateSite(
    id: string,
    dto: {
      code?: string;
      name?: string;
      type?: SiteType;
      districtManagerId?: string;
      address?: string;
    },
    userId: string
  ) {
    const before = await this.prisma.site.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Site not found');

    const updated = await this.prisma.site.update({
      where: { id },
      data: {
        ...(dto.code ? { code: dto.code.trim() } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        districtManagerId:
          dto.type === 'DC'
            ? null
            : dto.districtManagerId !== undefined
            ? dto.districtManagerId
            : before.districtManagerId,
        ...(dto.address !== undefined ? { address: dto.address?.trim() || null } : {}),
      },
      include: {
        districtManager: true,
      },
    });

    await this.recordAuditLog({
      userId,
      entity: 'Site',
      entityId: id,
      action: 'UPDATE',
      before,
      after: updated,
    });

    return updated;
  }

  async archiveSite(id: string, userId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobsOpened: true,
          },
        },
      },
    });
    if (!site) throw new NotFoundException('Site not found');

    // If site has referenced jobs, soft delete (archivedAt); else remove
    if (site._count.jobsOpened > 0) {
      await this.prisma.site.update({
        where: { id },
        data: { archivedAt: new Date() },
      });
    } else {
      await this.prisma.site.delete({ where: { id } });
    }

    await this.recordAuditLog({
      userId,
      entity: 'Site',
      entityId: id,
      action: site._count.jobsOpened > 0 ? 'ARCHIVE' : 'DELETE',
      before: site,
    });

    return { success: true, archived: site._count.jobsOpened > 0 };
  }

  async getDistrictManagers() {
    return this.prisma.districtManager.findMany({
      include: {
        sites: {
          where: { archivedAt: null },
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { areaLabel: 'asc' },
    });
  }

  async createDistrictManager(
    dto: { name: string; areaLabel: string },
    userId: string
  ) {
    const dm = await this.prisma.districtManager.create({
      data: {
        name: dto.name.trim(),
        areaLabel: dto.areaLabel.trim(),
      },
    });

    await this.recordAuditLog({
      userId,
      entity: 'DistrictManager',
      entityId: dm.id,
      action: 'CREATE',
      after: dm,
    });

    return dm;
  }

  async updateDistrictManager(
    id: string,
    dto: { name?: string; areaLabel?: string },
    userId: string
  ) {
    const before = await this.prisma.districtManager.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('DistrictManager not found');

    const updated = await this.prisma.districtManager.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.areaLabel ? { areaLabel: dto.areaLabel.trim() } : {}),
      },
    });

    await this.recordAuditLog({
      userId,
      entity: 'DistrictManager',
      entityId: id,
      action: 'UPDATE',
      before,
      after: updated,
    });

    return updated;
  }

  // ───────────── 3. Repair SKUs (Section 7) ─────────────
  async getRepairSkus() {
    return this.prisma.repairSku.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async createRepairSku(
    dto: { code: string; description: string; chargeType: ChargeType },
    userId: string
  ) {
    const existing = await this.prisma.repairSku.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(`รหัส SKU ค่าซ่อม "${dto.code}" มีอยู่ในระบบแล้ว`);
    }

    const sku = await this.prisma.repairSku.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        description: dto.description.trim(),
        chargeType: dto.chargeType,
      },
    });

    await this.recordAuditLog({
      userId,
      entity: 'RepairSku',
      entityId: sku.id,
      action: 'CREATE',
      after: sku,
    });

    return sku;
  }

  async updateRepairSku(
    id: string,
    dto: { code?: string; description?: string; chargeType?: ChargeType },
    userId: string
  ) {
    const before = await this.prisma.repairSku.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('RepairSku not found');

    const updated = await this.prisma.repairSku.update({
      where: { id },
      data: {
        ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}),
        ...(dto.description ? { description: dto.description.trim() } : {}),
        ...(dto.chargeType ? { chargeType: dto.chargeType } : {}),
      },
    });

    await this.recordAuditLog({
      userId,
      entity: 'RepairSku',
      entityId: id,
      action: 'UPDATE',
      before,
      after: updated,
    });

    return updated;
  }

  async deleteRepairSku(id: string, userId: string) {
    const before = await this.prisma.repairSku.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('RepairSku not found');

    await this.prisma.repairSku.delete({ where: { id } });

    await this.recordAuditLog({
      userId,
      entity: 'RepairSku',
      entityId: id,
      action: 'DELETE',
      before,
    });

    return { success: true };
  }

  // ───────────── 4. Payout Config (Section 8) ─────────────
  async getPayoutConfig() {
    const config = await this.prisma.payoutCycleConfig.findFirst();
    if (!config) {
      // Default fallback
      return {
        cycleType: 'MONTHLY_2X',
        daysOfMonth: [15, 30],
        nextCycleDate: new Date('2026-09-30'),
      };
    }
    return config;
  }

  async updatePayoutConfig(
    dto: {
      cycleType: PayoutCycleType;
      daysOfMonth: number[];
      nextCycleDate: string | Date;
    },
    userId: string
  ) {
    const existing = await this.prisma.payoutCycleConfig.findFirst();
    const nextDate = new Date(dto.nextCycleDate);

    let config;
    if (existing) {
      config = await this.prisma.payoutCycleConfig.update({
        where: { id: existing.id },
        data: {
          cycleType: dto.cycleType,
          daysOfMonth: dto.daysOfMonth,
          nextCycleDate: nextDate,
        },
      });
    } else {
      config = await this.prisma.payoutCycleConfig.create({
        data: {
          cycleType: dto.cycleType,
          daysOfMonth: dto.daysOfMonth,
          nextCycleDate: nextDate,
        },
      });
    }

    await this.recordAuditLog({
      userId,
      entity: 'PayoutCycleConfig',
      entityId: config.id,
      action: 'UPDATE',
      after: config,
    });

    return config;
  }

  // ───────────── 5. General Settings (Section 11) ─────────────
  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const result: Record<string, any> = {
      vatRate: 0.07,
      quoteExpiryDays: 7,
      charge3plReturnFee: true,
      tradeInCouponValidDays: 30,
      vendorSlaThreshold: 24,
    };

    settings.forEach((s) => {
      result[s.key] = s.value;
    });

    return result;
  }

  async updateSettings(settingsMap: Record<string, any>, userId: string) {
    const before = await this.getSettings();

    for (const [key, value] of Object.entries(settingsMap)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    const after = await this.getSettings();

    await this.recordAuditLog({
      userId,
      entity: 'SystemSetting',
      entityId: 'global',
      action: 'UPDATE_SETTINGS',
      before,
      after,
    });

    return after;
  }
}
