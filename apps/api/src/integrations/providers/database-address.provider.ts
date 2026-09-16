import { Injectable } from '@nestjs/common';
import {
  IAddressProvider,
  ThaiAddressItem,
} from '../interfaces/address.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DatabaseAddressProvider implements IAddressProvider {
  constructor(private readonly prisma: PrismaService) {}

  async lookupZip(zipcode: string): Promise<ThaiAddressItem[]> {
    const trimmed = zipcode.trim();
    if (!trimmed) return [];

    const list = await this.prisma.thaiAddress.findMany({
      where: { zipcode: trimmed },
      orderBy: [{ province: 'asc' }, { district: 'asc' }, { subdistrict: 'asc' }],
    });

    return list.map((item) => ({
      zipcode: item.zipcode,
      province: item.province,
      district: item.district,
      subdistrict: item.subdistrict,
    }));
  }

  async listProvinces(): Promise<string[]> {
    const result = await this.prisma.thaiAddress.findMany({
      select: { province: true },
      distinct: ['province'],
      orderBy: { province: 'asc' },
    });
    return result.map((r) => r.province);
  }

  async listDistricts(province: string): Promise<string[]> {
    if (!province) return [];
    const result = await this.prisma.thaiAddress.findMany({
      where: { province },
      select: { district: true },
      distinct: ['district'],
      orderBy: { district: 'asc' },
    });
    return result.map((r) => r.district);
  }

  async listSubdistricts(
    province: string,
    district: string
  ): Promise<string[]> {
    if (!province || !district) return [];
    const result = await this.prisma.thaiAddress.findMany({
      where: { province, district },
      select: { subdistrict: true },
      distinct: ['subdistrict'],
      orderBy: { subdistrict: 'asc' },
    });
    return result.map((r) => r.subdistrict);
  }
}
