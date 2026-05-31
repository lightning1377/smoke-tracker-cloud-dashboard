import { z } from "zod";

export const smokeLogCreateSchema = z.object({
  smokeItemId: z.string().uuid(),
  timestamp: z.string().datetime(),
  notes: z.string().trim().max(1000).nullable().optional()
});

export const smokeLogUpdateSchema = smokeLogCreateSchema.partial();

export const smokeLogQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  itemId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional()
});

export type SmokeLogCreateInput = z.infer<typeof smokeLogCreateSchema>;
export type SmokeLogUpdateInput = z.infer<typeof smokeLogUpdateSchema>;
export type SmokeLogQueryInput = z.infer<typeof smokeLogQuerySchema>;
