export interface ThaiAddressItem {
  zipcode: string;
  province: string;
  district: string;
  subdistrict: string;
}

export interface IAddressProvider {
  lookupZip(zipcode: string): Promise<ThaiAddressItem[]>;
  listProvinces(): Promise<string[]>;
  listDistricts(province: string): Promise<string[]>;
  listSubdistricts(province: string, district: string): Promise<string[]>;
}
