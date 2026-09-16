import { Role, MenuKey } from '../schemas/auth';

export interface MenuDefinition {
  key: MenuKey;
  label: string;
  path: string;
  iconName: string;
}

export const MENU_DEFINITIONS: Record<MenuKey, MenuDefinition> = {
  exec: {
    key: 'exec',
    label: 'Executive Dashboard',
    path: '/exec',
    iconName: 'TrendingUp',
  },
  analytics: {
    key: 'analytics',
    label: 'Dashboard Overview',
    path: '/analytics',
    iconName: 'LayoutDashboard',
  },
  jobs: {
    key: 'jobs',
    label: 'งานซ่อมทั้งหมด',
    path: '/jobs',
    iconName: 'ClipboardList',
  },
  cs: {
    key: 'cs',
    label: 'เปิดใบแจ้งซ่อม / คิว CS',
    path: '/cs',
    iconName: 'FilePlus',
  },
  gr: {
    key: 'gr',
    label: 'GR (รับเข้า/ส่งมอบ)',
    path: '/gr',
    iconName: 'PackageCheck',
  },
  dc: {
    key: 'dc',
    label: 'DC (ศูนย์กระจายสินค้า)',
    path: '/dc',
    iconName: 'Warehouse',
  },
  vd: {
    key: 'vd',
    label: 'ช่าง / ศูนย์ซ่อม (VD)',
    path: '/vd',
    iconName: 'Wrench',
  },
  tradein: {
    key: 'tradein',
    label: 'Trade-in / คูปอง',
    path: '/tradein',
    iconName: 'Repeat',
  },
  s2: {
    key: 's2',
    label: 'สต็อกสาขา (S2)',
    path: '/s2',
    iconName: 'Boxes',
  },
  vd_payment: {
    key: 'vd_payment',
    label: 'รายงานจ่ายเงิน VD',
    path: '/vd-payment',
    iconName: 'Receipt',
  },
  admin: {
    key: 'admin',
    label: 'ตั้งค่าระบบหลังบ้าน',
    path: '/admin',
    iconName: 'Settings',
  },
};

export const DEFAULT_ROLE_MENUS: Record<Role, MenuKey[]> = {
  ADMIN: [
    'exec',
    'analytics',
    'jobs',
    'cs',
    'gr',
    'dc',
    'vd',
    'tradein',
    's2',
    'vd_payment',
    'admin',
  ],
  EXECUTIVE: ['exec', 'analytics', 'jobs', 'vd_payment'],
  CS: ['jobs', 'cs', 'tradein'],
  GR: ['jobs', 'gr'],
  DC: ['jobs', 'dc'],
  VD: ['jobs', 'vd'],
  S2: ['jobs', 's2'],
};

export const ROLE_HOME_ROUTES: Record<Role, string> = {
  ADMIN: '/exec',
  EXECUTIVE: '/exec',
  CS: '/cs',
  GR: '/gr',
  DC: '/dc',
  VD: '/vd',
  S2: '/s2',
};

export function getHomeRouteForRole(role: Role): string {
  return ROLE_HOME_ROUTES[role] || '/jobs';
}

export function canAccessMenu(
  role: Role,
  menuKey: MenuKey,
  customMatrix?: Record<string, boolean>
): boolean {
  if (customMatrix && typeof customMatrix[`${role}:${menuKey}`] === 'boolean') {
    return customMatrix[`${role}:${menuKey}`];
  }
  const defaultList = DEFAULT_ROLE_MENUS[role] || [];
  return defaultList.includes(menuKey);
}

export interface UserScopeContext {
  role: Role;
  siteId?: string | null;
  vendorCenterId?: string | null;
}

/**
 * Builds Prisma `where` filter for jobs based on user role and data scope (08 §4).
 */
export function scopeJobsFor(user: UserScopeContext): Record<string, any> {
  switch (user.role) {
    case 'ADMIN':
    case 'EXECUTIVE':
      return {};

    case 'CS':
    case 'GR':
    case 'S2':
      if (!user.siteId) {
        return { branchId: '__NO_ACCESS_NO_SITE__' };
      }
      return { branchId: user.siteId };

    case 'VD':
      if (!user.vendorCenterId) {
        return { vendorCenterId: '__NO_ACCESS_NO_VD_CENTER__' };
      }
      return { vendorCenterId: user.vendorCenterId };

    case 'DC':
      // DC sees jobs routed through DC
      return {
        OR: [
          { channel: 'DC' },
          {
            shipments: {
              some: {
                leg: {
                  in: [
                    'BRANCH_TO_DC',
                    'DC_TO_VD',
                    'VD_TO_DC',
                    'DC_TO_BRANCH',
                  ],
                },
              },
            },
          },
        ],
      };

    default:
      return { id: '__UNAUTHORIZED_ROLE__' };
  }
}
