import { z } from "zod";

export const smokeItemCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  pricePerUnit: z.number().nonnegative(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().trim().min(1).max(40),
  dailyTarget: z.number().int().positive().nullable().optional()
});

export const smokeItemUpdateSchema = smokeItemCreateSchema.partial().extend({
  isArchived: z.boolean().optional()
});

export type SmokeItemCreateInput = z.infer<typeof smokeItemCreateSchema>;
export type SmokeItemUpdateInput = z.infer<typeof smokeItemUpdateSchema>;
