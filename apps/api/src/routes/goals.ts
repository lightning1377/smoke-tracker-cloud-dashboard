import type { FastifyPluginAsync } from "fastify";
import { goalCreateSchema, goalUpdateSchema } from "@smoke-tracker/shared";

export const goalRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ goals: [] }));
  app.get("/active", async () => ({ goals: [] }));

  app.post("/", async (request, reply) => {
    const input = goalCreateSchema.parse(request.body);
    return reply.code(201).send({ goal: { id: "demo-goal", ...input } });
  });

  app.patch("/:id", async (request) => {
    const input = goalUpdateSchema.parse(request.body);
    return { goal: { id: (request.params as { id: string }).id, ...input } };
  });

  app.delete("/:id", async (_request, reply) => reply.code(204).send());
};
