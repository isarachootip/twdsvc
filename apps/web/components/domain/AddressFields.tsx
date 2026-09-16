import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export interface AddressValue {
  addressLine?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
}

export interface AddressFieldsProps {
  value?: AddressValue;
  onChange?: (address: AddressValue) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const AddressFields: React.FC<AddressFieldsProps> = ({
  value = {},
  onChange,
  disabled = false,
  required = false,
  className,
}) => {
  const [isSearchingZip, setIsSearchingZip] = useState(false);
  const [subdistrictOptions, setSubdistrictOptions] = useState<string[]>([]);

  const handleZipChange = async (zip: string) => {
    const trimmed = zip.trim();
    const update: AddressValue = { ...value, postalCode: trimmed };
    onChange?.(update);

    if (trimmed.length === 5) {
      setIsSearchingZip(true);
      try {
        const results = await fetchApi<
          Array<{
            zipcode: string;
            province: string;
            district: string;
            subdistrict: string;
          }>
        >(`/address/zip/${trimmed}`);

        if (results && results.length > 0) {
          const first = results[0];
          const subs = results.map((r) => r.subdistrict);
          setSubdistrictOptions(subs);

          onChange?.({
            ...value,
            postalCode: trimmed,
            province: first.province,
            district: first.district,
            subdistrict: first.subdistrict,
          });
        }
      } catch {
        // Fallback / ignore error
      } finally {
        setIsSearchingZip(false);
      }
    }
  };

  const handleChange = (field: keyof AddressValue, val: string) => {
    onChange?.({
      ...value,
      [field]: val,
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-text-2 mb-1">
            รหัสไปรษณีย์ {required && <span className="text-red">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={5}
              placeholder="เช่น 10260"
              value={value.postalCode || ''}
              onChange={(e) => handleZipChange(e.target.value)}
              disabled={disabled}
              className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red disabled:bg-surface-2 disabled:text-text-mute"
            />
            {isSearchingZip ? (
              <Loader2 className="w-3.5 h-3.5 text-red animate-spin absolute right-2.5 top-2.5 pointer-events-none" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-text-mute absolute right-2.5 top-2.5 pointer-events-none" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-2 mb-1">
            จังหวัด {required && <span className="text-red">*</span>}
          </label>
          <input
            type="text"
            placeholder="จังหวัด"
            value={value.province || ''}
            onChange={(e) => handleChange('province', e.target.value)}
            disabled={disabled}
            className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red disabled:bg-surface-2 disabled:text-text-mute"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-2 mb-1">
            เขต / อำเภอ {required && <span className="text-red">*</span>}
          </label>
          <input
            type="text"
            placeholder="เขต/อำเภอ"
            value={value.district || ''}
            onChange={(e) => handleChange('district', e.target.value)}
            disabled={disabled}
            className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red disabled:bg-surface-2 disabled:text-text-mute"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-2 mb-1">
            แขวง / ตำบล {required && <span className="text-red">*</span>}
          </label>
          {subdistrictOptions.length > 1 ? (
            <select
              value={value.subdistrict || ''}
              onChange={(e) => handleChange('subdistrict', e.target.value)}
              disabled={disabled}
              className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red disabled:bg-surface-2 disabled:text-text-mute"
            >
              {subdistrictOptions.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="แขวง/ตำบล"
              value={value.subdistrict || ''}
              onChange={(e) => handleChange('subdistrict', e.target.value)}
              disabled={disabled}
              className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red disabled:bg-surface-2 disabled:text-text-mute"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-2 mb-1">
          ที่อยู่ (บ้านเลขที่ / ซอย / ถนน / อาคาร){' '}
          {required && <span className="text-red">*</span>}
        </label>
        <input
          type="text"
          placeholder="เช่น 99/9 หมู่ 1 ถ.บางนา-ตราด"
          value={value.addressLine || ''}
          onChange={(e) => handleChange('addressLine', e.target.value)}
          disabled={disabled}
          className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red disabled:bg-surface-2 disabled:text-text-mute"
        />
      </div>
    </div>
  );
};
