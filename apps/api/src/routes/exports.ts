import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { serializeGoal, serializeSmokeItem, serializeSmokeLog } from "../lib/serializers.js";

const downloadQuerySchema = z.object({
  format: z.enum(["csv", "json"]).default("csv"),
});

function csvEscape(value: unknown) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

export const exportRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/download", async (request, reply) => {
    const query = downloadQuerySchema.parse(request.query);
    const [items, logs, goals] = await Promise.all([
      app.prisma.smokeItem.findMany({
        where: { userId: request.currentUser.id },
        orderBy: { createdAt: "asc" },
      }),
      app.prisma.smokeLog.findMany({
        where: { userId: request.currentUser.id },
        include: { smokeItem: true },
        orderBy: { timestamp: "asc" },
      }),
      app.prisma.goal.findMany({
        where: { userId: request.currentUser.id },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    const exportedAt = new Date().toISOString();

    if (query.format === "json") {
      return reply
        .header("content-type", "application/json")
        .header("content-disposition", `attachment; filename="smoke-tracker-export-${exportedAt}.json"`)
        .send({
          exportedAt,
          user: {
            id: request.currentUser.id,
            email: request.currentUser.email,
          },
          items: items.map(serializeSmokeItem),
          logs: logs.map(serializeSmokeLog),
          goals: goals.map(serializeGoal),
        });
    }

    const rows = [
      ["timestamp", "itemName", "itemId", "pricePerUnit", "notes"],
      ...logs.map((log) => [
        log.timestamp.toISOString(),
        log.smokeItem.name,
        log.smokeItem.id,
        log.smokeItem.pricePerUnit.toNumber(),
        log.notes ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

    return reply
      .header("content-type", "text/csv")
      .header("content-disposition", `attachment; filename="smoke-tracker-logs-${exportedAt}.csv"`)
      .send(csv);
  });

  app.post("/", async (_request, reply) =>
    reply.code(202).send({
      job: {
        id: "local-download",
        status: "completed",
        format: "csv",
      },
    }),
  );

  app.get("/", async () => ({ jobs: [] }));
  app.get("/:id/download-url", async () => ({ url: "/v1/exports/download?format=csv", expiresAt: null }));
};
