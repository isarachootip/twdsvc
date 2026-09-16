import { z } from 'zod';

export const ChannelSchema = z.enum(['DSD', 'DC', 'TPL']);
export const VendorCenterMethodSchema = z.enum(['DSD', 'DC', 'DC_DSD']);

export const RoutingJobInputSchema = z.object({
  branchId: z.string().min(1, 'ต้องระบุสาขา'),
  brandId: z.string().nullable().optional(),
  sizeCategoryId: z.string().nullable().optional(),
  shippingMethod: z.enum(['STANDARD', 'EXPRESS']).nullable().optional(),
  hasWarranty: z.boolean().nullable().optional(),
  allowNonAuthorizedVendor: z.boolean().optional().default(false),
});

export const ResolvedRoutingSchema = z.object({
  vendorCenterId: z.string(),
  channel: ChannelSchema,
});
