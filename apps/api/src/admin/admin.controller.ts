import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@svcm/shared';
import { SiteType, ChargeType, PayoutCycleType } from '@svcm/db';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ───────────── Section 2: Fee Rates & Size Categories ─────────────
  @Get('size-categories')
  async getSizeCategories() {
    return this.adminService.getSizeCategories();
  }

  @Post('size-categories')
  @Roles('ADMIN')
  async createSizeCategory(
    @Body()
    body: {
      code: string;
      name: string;
      operationFeeSatang?: number;
      shippingFee3plSatang?: number;
    },
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.createSizeCategory(body, user.id);
  }

  @Put('fee-rates')
  @Roles('ADMIN')
  async updateFeeRates(
    @Body()
    body: Array<{
      sizeCategoryId: string;
      operationFeeSatang: number;
      shippingFee3plSatang: number;
    }>,
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.updateFeeRates(body, user.id);
  }

  // ───────────── Section 3: Sites & District Managers ─────────────
  @Get('sites')
  async getSites(@Query('type') type?: SiteType) {
    return this.adminService.getSites(type);
  }

  @Post('sites')
  @Roles('ADMIN')
  async createSite(
    @Body()
    body: {
      code: string;
      name: string;
      type: SiteType;
      districtManagerId?: string;
      address?: string;
    },
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.createSite(body, user.id);
  }

  @Patch('sites/:id')
  @Roles('ADMIN')
  async updateSite(
    @Param('id') id: string,
    @Body()
    body: {
      code?: string;
      name?: string;
      type?: SiteType;
      districtManagerId?: string;
      address?: string;
    },
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.updateSite(id, body, user.id);
  }

  @Delete('sites/:id')
  @Roles('ADMIN')
  async archiveSite(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.archiveSite(id, user.id);
  }

  @Get('district-managers')
  async getDistrictManagers() {
    return this.adminService.getDistrictManagers();
  }

  @Post('district-managers')
  @Roles('ADMIN')
  async createDistrictManager(
    @Body() body: { name: string; areaLabel: string },
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.createDistrictManager(body, user.id);
  }

  @Patch('district-managers/:id')
  @Roles('ADMIN')
  async updateDistrictManager(
    @Param('id') id: string,
    @Body() body: { name?: string; areaLabel?: string },
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.updateDistrictManager(id, body, user.id);
  }

  // ───────────── Section 7: Repair SKUs ─────────────
  @Get('repair-skus')
  async getRepairSkus() {
    return this.adminService.getRepairSkus();
  }

  @Post('repair-skus')
  @Roles('ADMIN')
  async createRepairSku(
    @Body()
    body: { code: string; description: string; chargeType: ChargeType },
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.createRepairSku(body, user.id);
  }

  @Patch('repair-skus/:id')
  @Roles('ADMIN')
  async updateRepairSku(
    @Param('id') id: string,
    @Body()
    body: { code?: string; description?: string; chargeType?: ChargeType },
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.updateRepairSku(id, body, user.id);
  }

  @Delete('repair-skus/:id')
  @Roles('ADMIN')
  async deleteRepairSku(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.deleteRepairSku(id, user.id);
  }

  // ───────────── Section 8: Payout Config ─────────────
  @Get('payout-config')
  async getPayoutConfig() {
    return this.adminService.getPayoutConfig();
  }

  @Put('payout-config')
  @Roles('ADMIN')
  async updatePayoutConfig(
    @Body()
    body: {
      cycleType: PayoutCycleType;
      daysOfMonth: number[];
      nextCycleDate: string;
    },
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.updatePayoutConfig(body, user.id);
  }

  // ───────────── Section 11: General Settings ─────────────
  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @Roles('ADMIN')
  async updateSettings(
    @Body() body: Record<string, any>,
    @CurrentUser() user: AuthUser
  ) {
    return this.adminService.updateSettings(body, user.id);
  }
}
