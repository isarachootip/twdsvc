import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { IAddressProvider } from '../interfaces/address.interface';

@Controller('address')
export class AddressController {
  constructor(
    @Inject('ADDRESS_PROVIDER')
    private readonly addressProvider: IAddressProvider
  ) {}

  @Get('zip/:zip')
  async lookupZip(@Param('zip') zip: string) {
    return this.addressProvider.lookupZip(zip);
  }

  @Get('provinces')
  async listProvinces() {
    return this.addressProvider.listProvinces();
  }

  @Get('districts')
  async listDistricts(@Query('province') province: string) {
    return this.addressProvider.listDistricts(province || '');
  }

  @Get('subdistricts')
  async listSubdistricts(
    @Query('province') province: string,
    @Query('district') district: string
  ) {
    return this.addressProvider.listSubdistricts(
      province || '',
      district || ''
    );
  }
}
