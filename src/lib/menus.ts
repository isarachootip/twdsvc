import { prisma } from './db'
import { DEFAULT_MENU_MATRIX, MENU_DEFS } from './constants'
import { Role } from '@prisma/client'

export async function menusForRole(role: string): Promise<string[]> {
  try {
    const rows = await prisma.roleMenuPermission.findMany({ where: { role: role as Role } })
    if (rows.length === 0) return DEFAULT_MENU_MATRIX[role] ?? []
    const keys = rows.filter(r => r.canAccess).map(r => r.menuKey)
    if (role === 'ADMIN' && !keys.includes('admin')) keys.push('admin') // กันล็อกตัวเอง
    return MENU_DEFS.map(m => m.key).filter(k => keys.includes(k))
  } catch {
    return DEFAULT_MENU_MATRIX[role] ?? []
  }
}

export async function canWriteMenu(role: string, menuKey: string): Promise<boolean> {
  try {
    const row = await prisma.roleMenuPermission.findUnique({ where: { menuKey_role: { menuKey, role: role as Role } } })
    if (!row) return (DEFAULT_MENU_MATRIX[role] ?? []).includes(menuKey) && role !== 'EXECUTIVE'
    return row.canWrite
  } catch {
    return (DEFAULT_MENU_MATRIX[role] ?? []).includes(menuKey) && role !== 'EXECUTIVE'
  }
}
