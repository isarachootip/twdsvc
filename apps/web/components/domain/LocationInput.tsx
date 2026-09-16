'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

export interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
  hint?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  label = 'ตำแหน่งช่องเก็บสินค้า (Location)',
  placeholder = 'ตัวอย่าง: A-05-02',
  disabled = false,
  required = false,
  className,
  error,
  hint = 'รูปแบบ: โซน-แถว-ชั้น (เช่น A-05-02)',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto capitalize uppercase
    onChange(e.target.value.toUpperCase());
  };

  const isSoftPatternValid = !value || /^[A-Z]-\d{2}-\d{2}$/.test(value);

  return (
    <div className={cn('space-y-1.5 text-left font-sans', className)}>
      {label && (
        <label className="block text-xs font-semibold text-[#2B2723]">
          {label} {required && <span className="text-[#C8102E]">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9A9384]">
          <MapPin className="h-4 w-4" />
        </div>

        <input
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'block w-full rounded-lg border py-2 pl-9 pr-3 text-sm font-mono text-[#2B2723] uppercase transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 focus:border-[#C8102E]',
            error
              ? 'border-rose-300 bg-rose-50/30'
              : !isSoftPatternValid
              ? 'border-amber-300 bg-amber-50/20'
              : 'border-[#D2C9B8] bg-white',
            disabled && 'bg-[#FAF7F2] text-[#9A9384] cursor-not-allowed'
          )}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : !isSoftPatternValid ? (
        <p className="text-xs text-amber-700">คำเตือน: รูปแบบแนะนำคือ ตัวอักษร-ตัวเลข2หลัก-ตัวเลข2หลัก (เช่น A-05-02)</p>
      ) : hint ? (
        <p className="text-xs text-[#9A9384]">{hint}</p>
      ) : null}
    </div>
  );
};
