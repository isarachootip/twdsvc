import { z } from 'zod';

export const RoleSchema = z.enum([
  'ADMIN',
  'EXECUTIVE',
  'CS',
  'GR',
  'DC',
  'VD',
  'S2',
]);

export type Role = z.infer<typeof RoleSchema>;

export const MenuKeySchema = z.enum([
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
]);

export type MenuKey = z.infer<typeof MenuKeySchema>;

export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  role: RoleSchema,
  siteId: z.string().nullable().optional(),
  siteName: z.string().nullable().optional(),
  siteType: z.string().nullable().optional(),
  vendorCenterId: z.string().nullable().optional(),
  vendorCenterName: z.string().nullable().optional(),
  active: z.boolean(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const MeResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  role: RoleSchema,
  siteId: z.string().nullable().optional(),
  site: z
    .object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      type: z.string(),
    })
    .nullable()
    .optional(),
  vendorCenterId: z.string().nullable().optional(),
  vendorCenter: z
    .object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  menus: z.array(MenuKeySchema),
  canViewCost: z.boolean(),
});

export type MeResponse = z.infer<typeof MeResponseSchema>;
