import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { smokeItemCreateSchema, smokeItemUpdateSchema } from "@smoke-tracker/shared";
import { serializeSmokeItem } from "../lib/serializers";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const listQuerySchema = z.object({
  includeArchived: z.coerce.boolean().default(false),
});

export const smokeItemRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (request) => {
    const query = listQuerySchema.parse(request.query);
    const items = await app.prisma.smokeItem.findMany({
      where: {
        userId: request.currentUser.id,
        ...(query.includeArchived ? {} : { isArchived: false }),
      },
      orderBy: [{ isArchived: "asc" }, { createdAt: "asc" }],
    });

    return { items: items.map(serializeSmokeItem) };
  });

  app.post("/", async (request, reply) => {
    const input = smokeItemCreateSchema.parse(request.body);
    const item = await app.prisma.smokeItem.create({
      data: {
        userId: request.currentUser.id,
        name: input.name,
        pricePerUnit: input.pricePerUnit,
        color: input.color,
        icon: input.icon,
        dailyTarget: input.dailyTarget ?? null,
      },
    });

    return reply.code(201).send({ item: serializeSmokeItem(item) });
  });

  app.get("/:id", async (request, reply) => {
    const params = paramsSchema.parse(request.params);
    const item = await app.prisma.smokeItem.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
    });

    if (!item) {
      return reply.code(404).send({ message: "Smoke item not found" });
    }

    return { item: serializeSmokeItem(item) };
  });

  app.patch("/:id", async (request, reply) => {
    const params = paramsSchema.parse(request.params);
    const input = smokeItemUpdateSchema.parse(request.body);
    const existing = await app.prisma.smokeItem.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Smoke item not found" });
    }

    const item = await app.prisma.smokeItem.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.pricePerUnit !== undefined ? { pricePerUnit: input.pricePerUnit } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.dailyTarget !== undefined ? { dailyTarget: input.dailyTarget } : {}),
        ...(input.isArchived !== undefined ? { isArchived: input.isArchived } : {}),
      },
    });

    return { item: serializeSmokeItem(item) };
  });

  app.delete("/:id", async (request, reply) => {
    const params = paramsSchema.parse(request.params);
    const existing = await app.prisma.smokeItem.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Smoke item not found" });
    }

    await app.prisma.smokeItem.update({
      where: { id: existing.id },
      data: { isArchived: true },
    });

    return reply.code(204).send();
  });
};
