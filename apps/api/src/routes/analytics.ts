import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const rangeQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  itemId: z.string().uuid().optional(),
});

const targetQuerySchema = z.object({
  date: z.string().date().optional(),
});

const trendsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d"]).default("30d"),
  itemId: z.string().uuid().optional(),
});

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateRange(query: z.infer<typeof rangeQuerySchema>) {
  const now = new Date();
  return {
    from: query.from ? new Date(`${query.from}T00:00:00.000Z`) : startOfDay(now),
    to: query.to ? new Date(`${query.to}T23:59:59.999Z`) : endOfDay(now),
  };
}

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/summary", async (request) => {
    const query = rangeQuerySchema.parse(request.query);
    const range = dateRange(query);
    const logs = await app.prisma.smokeLog.findMany({
      where: {
        userId: request.currentUser.id,
        timestamp: { gte: range.from, lte: range.to },
        ...(query.itemId ? { smokeItemId: query.itemId } : {}),
      },
      include: { smokeItem: true },
    });
    const totalCost = logs.reduce((sum, log) => sum + log.smokeItem.pricePerUnit.toNumber(), 0);
    const activeHours = new Map<number, number>();

    for (const log of logs) {
      const hour = log.timestamp.getHours();
      activeHours.set(hour, (activeHours.get(hour) ?? 0) + 1);
    }

    const days = Math.max(1, Math.ceil((endOfDay(range.to).getTime() - startOfDay(range.from).getTime()) / 86_400_000));
    const mostActiveHour = [...activeHours.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      from: dateKey(range.from),
      to: dateKey(range.to),
      smokeCount: logs.length,
      totalCost,
      averagePerDay: Number((logs.length / days).toFixed(2)),
      mostActiveHour,
    };
  });

  app.get("/daily-stats", async (request) => {
    const query = rangeQuerySchema.parse(request.query);
    const range = dateRange(query);
    const logs = await app.prisma.smokeLog.findMany({
      where: {
        userId: request.currentUser.id,
        timestamp: { gte: range.from, lte: range.to },
        ...(query.itemId ? { smokeItemId: query.itemId } : {}),
      },
      include: { smokeItem: true },
      orderBy: { timestamp: "asc" },
    });
    const byDate = new Map<
      string,
      { date: string; totalCost: number; smokeCount: number; items: Record<string, unknown> }
    >();

    for (const log of logs) {
      const key = dateKey(log.timestamp);
      const day = byDate.get(key) ?? { date: key, totalCost: 0, smokeCount: 0, items: {} };
      const itemKey = log.smokeItem.name;
      const current = (day.items[itemKey] as
        | { itemId: string; itemName: string; count: number; cost: number; color: string; icon: string }
        | undefined) ?? {
        itemId: log.smokeItem.id,
        itemName: log.smokeItem.name,
        count: 0,
        cost: 0,
        color: log.smokeItem.color,
        icon: log.smokeItem.icon,
      };
      const cost = log.smokeItem.pricePerUnit.toNumber();

      current.count += 1;
      current.cost += cost;
      day.smokeCount += 1;
      day.totalCost += cost;
      day.items[itemKey] = current;
      byDate.set(key, day);
    }

    return { days: [...byDate.values()] };
  });

  app.get("/daily-target-progress", async (request) => {
    const query = targetQuerySchema.parse(request.query);
    const date = query.date ? new Date(`${query.date}T00:00:00.000Z`) : new Date();
    const from = startOfDay(date);
    const to = endOfDay(date);
    const items = await app.prisma.smokeItem.findMany({
      where: {
        userId: request.currentUser.id,
        isArchived: false,
        dailyTarget: { not: null },
      },
      include: {
        logs: {
          where: { timestamp: { gte: from, lte: to } },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    return {
      progress: items.map((item) => {
        const target = item.dailyTarget ?? 0;
        const current = item.logs.length;
        const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        const hourlyProgress = Array.from({ length: 24 }, (_, hour) => {
          const count = item.logs.filter((log) => log.timestamp.getHours() === hour).length;
          const cumulativeCount = item.logs.filter((log) => log.timestamp.getHours() <= hour).length;
          return { hour, count, cumulativeCount };
        });

        return {
          itemId: item.id,
          itemName: item.name,
          target,
          current,
          remaining: Math.max(0, target - current),
          percentage,
          status:
            current > target
              ? "over"
              : current === target
                ? "complete"
                : current / Math.max(1, new Date().getHours()) > target / 24
                  ? "on-track"
                  : "behind",
          hourlyProgress,
          cost: current * item.pricePerUnit.toNumber(),
          lastLogTime: item.logs.at(-1)?.timestamp.toISOString() ?? null,
        };
      }),
    };
  });

  app.get("/hourly-progress", async (request) => {
    const query = targetQuerySchema.parse(request.query);
    const date = query.date ? new Date(`${query.date}T00:00:00.000Z`) : new Date();
    const logs = await app.prisma.smokeLog.findMany({
      where: {
        userId: request.currentUser.id,
        timestamp: { gte: startOfDay(date), lte: endOfDay(date) },
      },
    });

    return {
      hours: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: logs.filter((log) => log.timestamp.getHours() === hour).length,
      })),
    };
  });

  app.get("/trends", async (request) => {
    const query = trendsQuerySchema.parse(request.query);
    const days = query.range === "7d" ? 7 : query.range === "90d" ? 90 : 30;
    const to = endOfDay(new Date());
    const from = startOfDay(new Date(Date.now() - (days - 1) * 86_400_000));
    const logs = await app.prisma.smokeLog.findMany({
      where: {
        userId: request.currentUser.id,
        timestamp: { gte: from, lte: to },
        ...(query.itemId ? { smokeItemId: query.itemId } : {}),
      },
      include: { smokeItem: true },
    });
    const points = Array.from({ length: days }, (_, offset) => {
      const date = startOfDay(new Date(from.getTime() + offset * 86_400_000));
      const key = dateKey(date);
      const dayLogs = logs.filter((log) => dateKey(log.timestamp) === key);
      return {
        date: key,
        count: dayLogs.length,
        cost: dayLogs.reduce((sum, log) => sum + log.smokeItem.pricePerUnit.toNumber(), 0),
      };
    });

    return { range: query.range, points };
  });
};
