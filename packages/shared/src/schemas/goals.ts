import { z } from "zod";

export const limitGoalSchema = z.object({
  type: z.literal("limit"),
  smokeItemId: z.string().uuid(),
  isActive: z.boolean().default(true),
  dailyLimit: z.number().int().positive(),
  targetDate: z.null().optional(),
  targetDailyAmount: z.null().optional(),
  startingDailyLimit: z.null().optional()
});

export const reductionGoalSchema = z.object({
  type: z.literal("reduction"),
  smokeItemId: z.string().uuid(),
  isActive: z.boolean().default(true),
  targetDate: z.string().date(),
  targetDailyAmount: z.number().int().nonnegative(),
  startingDailyLimit: z.number().int().positive(),
  dailyLimit: z.null().optional()
});

export const goalCreateSchema = z.discriminatedUnion("type", [
  limitGoalSchema,
  reductionGoalSchema
]);

export const goalUpdateSchema = z.union([
  limitGoalSchema.partial(),
  reductionGoalSchema.partial()
]);

export type GoalCreateInput = z.infer<typeof goalCreateSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;
