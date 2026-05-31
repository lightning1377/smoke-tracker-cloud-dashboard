import type { FastifyPluginAsync } from "fastify";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/summary", async () => ({
    from: "2026-05-01",
    to: "2026-05-31",
    smokeCount: 0,
    totalCost: 0,
    averagePerDay: 0,
    mostActiveHour: null
  }));

  app.get("/daily-stats", async () => ({ days: [] }));
  app.get("/daily-target-progress", async () => ({ progress: [] }));
  app.get("/hourly-progress", async () => ({ hours: [] }));
  app.get("/trends", async () => ({ range: "30d", points: [] }));
};
