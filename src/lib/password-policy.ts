export const MIN_PASSWORD_LENGTH = 10
export const MAX_PASSWORD_LENGTH = 128

/** Returns a Thai error message, or null when the new password is acceptable. */
export function validateNewPassword(next: string, current: string): string | null {
  if (next.length < MIN_PASSWORD_LENGTH) return `รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`
  if (next.length > MAX_PASSWORD_LENGTH) return `รหัสผ่านใหม่ต้องไม่เกิน ${MAX_PASSWORD_LENGTH} ตัวอักษร`
  if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) return 'รหัสผ่านใหม่ต้องมีทั้งตัวอักษรและตัวเลข'
  if (next === current) return 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม'
  return null
}
