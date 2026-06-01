import type { Goal, SmokeItem, SmokeLog, User } from "@prisma/client";

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    timezone: user.timezone,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function serializeSmokeItem(item: SmokeItem) {
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    pricePerUnit: item.pricePerUnit.toNumber(),
    color: item.color,
    icon: item.icon,
    dailyTarget: item.dailyTarget,
    isArchived: item.isArchived,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function serializeSmokeLog(log: SmokeLog & { smokeItem?: SmokeItem }) {
  const serialized = {
    id: log.id,
    userId: log.userId,
    smokeItemId: log.smokeItemId,
    timestamp: log.timestamp.toISOString(),
    notes: log.notes,
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  };

  if (!log.smokeItem) {
    return serialized;
  }

  return {
    ...serialized,
    item: serializeSmokeItem(log.smokeItem),
  };
}

export function serializeGoal(goal: Goal) {
  return {
    id: goal.id,
    userId: goal.userId,
    smokeItemId: goal.smokeItemId,
    type: goal.type,
    isActive: goal.isActive,
    targetDate: goal.targetDate?.toISOString() ?? null,
    targetDailyAmount: goal.targetDailyAmount,
    startingDailyLimit: goal.startingDailyLimit,
    dailyLimit: goal.dailyLimit,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}
