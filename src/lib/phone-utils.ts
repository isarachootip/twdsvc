/**
 * Phone utilities for Thai mobile & landline numbers.
 * Provides unified sanitization, formatting, and validation across the platform.
 */

/**
 * Removes all non-digit characters and truncates to max 10 digits.
 */
export function sanitizePhone(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(/\D/g, '').slice(0, 10)
}

/**
 * Formats a phone string into standard display representation.
 * - 10-digit Thai mobile: 08x-xxx-xxxx -> 081-234-5678
 * - 9-digit Thai landline: 02-xxx-xxxx -> 02-123-4567
 * - Missing/empty: '-'
 */
export function formatPhone(input: string | null | undefined): string {
  if (!input || !input.trim()) return '-'
  const digits = input.replace(/\D/g, '')

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  if (digits.length === 9 && digits.startsWith('02')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 9)}`
  }

  return input.trim()
}

/**
 * Validates if the phone number is a valid 10-digit Thai mobile number.
 */
export function isValidThaiPhone(input: string | null | undefined): boolean {
  if (!input) return false
  const digits = sanitizePhone(input)
  // Thai mobile numbers are 10 digits starting with 06, 08, or 09 (or general 0X)
  return /^0[689]\d{8}$/.test(digits)
}
