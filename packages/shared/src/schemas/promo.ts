import { z } from 'zod';

export const TradeInTypeSchema = z.enum(['TYPE1_WALK_IN', 'TYPE2_BACKOFFICE']);
export const PromotionStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']);

export const BestPromotionInputSchema = z.object({
  type: TradeInTypeSchema,
  sizeCategoryId: z.string().min(1, 'ต้องระบุขนาดสินค้า'),
  subDept: z.string().nullable().optional(),
  date: z.union([z.date(), z.string()]),
});
