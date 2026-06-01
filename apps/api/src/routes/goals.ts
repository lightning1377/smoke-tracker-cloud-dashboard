import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { goalCreateSchema, goalUpdateSchema } from "@smoke-tracker/shared";
import { serializeGoal } from "../lib/serializers.js";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

function goalPayload(input: z.infer<typeof goalCreateSchema> | z.infer<typeof goalUpdateSchema>) {
  return {
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.smokeItemId !== undefined ? { smokeItemId: input.smokeItemId } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(input.type === "limit"
      ? {
          dailyLimit: input.dailyLimit ?? null,
          targetDate: null,
          targetDailyAmount: null,
          startingDailyLimit: null,
        }
      : {}),
    ...(input.type === "reduction"
      ? {
          dailyLimit: null,
          targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null,
          targetDailyAmount: input.targetDailyAmount ?? null,
          startingDailyLimit: input.startingDailyLimit ?? null,
        }
      : {}),
    ...(input.type === undefined && "dailyLimit" in input ? { dailyLimit: input.dailyLimit } : {}),
    ...(input.type === undefined && "targetDate" in input
      ? { targetDate: input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null }
      : {}),
    ...(input.type === undefined && "targetDailyAmount" in input ? { targetDailyAmount: input.targetDailyAmount } : {}),
    ...(input.type === undefined && "startingDailyLimit" in input
      ? { startingDailyLimit: input.startingDailyLimit }
      : {}),
  };
}

export const goalRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (request) => {
    const goals = await app.prisma.goal.findMany({
      where: { userId: request.currentUser.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    return { goals: goals.map(serializeGoal) };
  });

  app.get("/active", async (request) => {
    const goals = await app.prisma.goal.findMany({
      where: {
        userId: request.currentUser.id,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { goals: goals.map(serializeGoal) };
  });

  app.post("/", async (request, reply) => {
    const input = goalCreateSchema.parse(request.body);
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

    const goal = await app.prisma.goal.create({
      data: {
        userId: request.currentUser.id,
        smokeItemId: input.smokeItemId,
        type: input.type,
        isActive: input.isActive,
        ...(input.type === "limit"
          ? {
              dailyLimit: input.dailyLimit,
              targetDate: null,
              targetDailyAmount: null,
              startingDailyLimit: null,
            }
          : {
              dailyLimit: null,
              targetDate: new Date(`${input.targetDate}T00:00:00.000Z`),
              targetDailyAmount: input.targetDailyAmount,
              startingDailyLimit: input.startingDailyLimit,
            }),
      },
    });

    return reply.code(201).send({ goal: serializeGoal(goal) });
  });

  app.patch("/:id", async (request, reply) => {
    const params = paramsSchema.parse(request.params);
    const input = goalUpdateSchema.parse(request.body);
    const existing = await app.prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Goal not found" });
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

    const goal = await app.prisma.goal.update({
      where: { id: existing.id },
      data: goalPayload(input),
    });

    return { goal: serializeGoal(goal) };
  });

  app.delete("/:id", async (request, reply) => {
    const params = paramsSchema.parse(request.params);
    const existing = await app.prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: request.currentUser.id,
      },
    });

    if (!existing) {
      return reply.code(404).send({ message: "Goal not found" });
    }

    await app.prisma.goal.delete({
      where: { id: existing.id },
    });

    return reply.code(204).send();
  });
};
