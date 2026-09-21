import { redirect } from 'next/navigation'
import { getCurrentUser, type UserSession } from './auth'
import { menusForRole } from './menus'
import { MENU_DEFS, ROLE_HOME } from './constants'

export async function homeFor(role: string): Promise<string> {
  const menus = await menusForRole(role)
  const home = ROLE_HOME[role]
  const homeKey = MENU_DEFS.find(m => m.href === home)?.key
  if (homeKey && menus.includes(homeKey)) return home
  const first = MENU_DEFS.find(m => menus.includes(m.key))
  return first?.href ?? '/manual'
}

/** ใช้ใน Server Component ของแต่ละหน้า: ตรวจ login + สิทธิ์เมนู (RoleMenuPermission) */
export async function guardPage(menuKey: string): Promise<UserSession> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const menus = await menusForRole(user.role)
  if (!menus.includes(menuKey)) redirect(await homeFor(user.role))
  return user
}
