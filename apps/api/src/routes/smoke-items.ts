import type { FastifyPluginAsync } from "fastify";
import { smokeItemCreateSchema, smokeItemUpdateSchema } from "@smoke-tracker/shared";

export const smokeItemRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ items: [] }));

  app.post("/", async (request, reply) => {
    const input = smokeItemCreateSchema.parse(request.body);
    return reply.code(201).send({ item: { id: "demo-item", ...input } });
  });

  app.get("/:id", async (request) => ({ item: { id: (request.params as { id: string }).id } }));

  app.patch("/:id", async (request) => {
    const input = smokeItemUpdateSchema.parse(request.body);
    return { item: { id: (request.params as { id: string }).id, ...input } };
  });

  app.delete("/:id", async (_request, reply) => reply.code(204).send());
};
