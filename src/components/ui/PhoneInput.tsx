'use client'

import React from 'react'
import { sanitizePhone } from '@/lib/phone-utils'

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  onRawChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PhoneInput({
  value,
  onChange,
  onRawChange,
  className = 'inp',
  placeholder = '08xxxxxxxx',
  disabled = false,
  required = false,
  ...rest
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = sanitizePhone(e.target.value)
    onChange(cleanDigits)
    if (onRawChange) {
      onRawChange(e)
    }
  }

  return (
    <input
      type="tel"
      inputMode="numeric"
      maxLength={10}
      autoComplete="tel"
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      {...rest}
    />
  )
}

export default PhoneInput
