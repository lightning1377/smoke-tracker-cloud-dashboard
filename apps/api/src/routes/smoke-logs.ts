import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { smokeLogCreateSchema, smokeLogQuerySchema, smokeLogUpdateSchema } from "@smoke-tracker/shared";
import { serializeSmokeLog } from "../lib/serializers";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

function endOfDate(date: string) {
  const end = new Date(`${date}T23:59:59.999Z`);
  return end;
}

export const smokeLogRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (request) => {
    const query = smokeLogQuerySchema.parse(request.query);
    const logs = await app.prisma.smokeLog.findMany({
      where: {
        userId: request.currentUser.id,
        ...(query.itemId ? { smokeItemId: query.itemId } : {}),
        ...(query.from || query.to
          ? {
              timestamp: {
                ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
                ...(query.to ? { lte: endOfDate(query.to) } : {}),
              },
            }
          : {}),
      },
      include: { smokeItem: true },
      orderBy: [{ timestamp: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = logs.slice(0, query.limit);

    return {
      logs: page.map(serializeSmokeLog),
      pageInfo: {
        limit: query.limit,
        nextCursor: logs.length > query.limit ? logs[query.limit]?.id : null,
      },
    };
  });

  app.post("/", async (request, reply) => {
    const input = smokeLogCreateSchema.parse(request.body);
    const item = await app.prisma.smokeItem.findFirst({
      where: {
        id: input.smokeItemId,
        userId: request.currentUser.id,
        isArchived: false,
      },
    });

    if (!item) {
      return reply.code(404).send({ message: "Smoke item not found" });
    }

    const log = await app.prisma.smokeLog.create({
      data: {
        userId: request.currentUser.id,
        smokeItemId: item.id,
        timestamp: new Date(input.timestamp),
        notes: input.notes ?? null,
      },
      include: { smokeItem: true },
    });

    return reply.code(201).send({ log: serializeSmokeLog(log) });
  });

  app.get("/:id", async (request, reply) => {
    const params = paramsSchema.parse(request.params);
    const log = await app.prisma.smokeLog.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
      include: { smokeItem: true },
    });

    if (!log) {
      return reply.code(404).send({ message: "Smoke log not found" });
    }

    return { log: serializeSmokeLog(log) };
  });

  app.patch("/:id", async (request, reply) => {
    const params = paramsSchema.parse(request.params);
    const input = smokeLogUpdateSchema.parse(request.body);
    const existing = await app.prisma.smokeLog.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Smoke log not found" });
    }

    if (input.smokeItemId) {
      const item = await app.prisma.smokeItem.findFirst({
        where: {
          id: input.smokeItemId,
          userId: request.currentUser.id,
          isArchived: false,
        },
      });

      if (!item) {
        return reply.code(404).send({ message: "Smoke item not found" });
      }
    }

    const log = await app.prisma.smokeLog.update({
      where: { id: existing.id },
      data: {
        ...(input.smokeItemId !== undefined ? { smokeItemId: input.smokeItemId } : {}),
        ...(input.timestamp !== undefined ? { timestamp: new Date(input.timestamp) } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: { smokeItem: true },
    });

    return { log: serializeSmokeLog(log) };
  });

  app.delete("/:id", async (request, reply) => {
    const params = paramsSchema.parse(request.params);
    const existing = await app.prisma.smokeLog.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Smoke log not found" });
    }

    await app.prisma.smokeLog.delete({
      where: { id: existing.id },
    });

    return reply.code(204).send();
  });
};
