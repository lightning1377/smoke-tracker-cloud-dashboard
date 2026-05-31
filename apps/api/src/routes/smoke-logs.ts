import type { FastifyPluginAsync } from "fastify";
import {
  smokeLogCreateSchema,
  smokeLogQuerySchema,
  smokeLogUpdateSchema
} from "@smoke-tracker/shared";

export const smokeLogRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request) => {
    const query = smokeLogQuerySchema.parse(request.query);
    return { logs: [], pageInfo: { limit: query.limit, nextCursor: null } };
  });

  app.post("/", async (request, reply) => {
    const input = smokeLogCreateSchema.parse(request.body);
    return reply.code(201).send({ log: { id: "demo-log", ...input } });
  });

  app.get("/:id", async (request) => ({ log: { id: (request.params as { id: string }).id } }));

  app.patch("/:id", async (request) => {
    const input = smokeLogUpdateSchema.parse(request.body);
    return { log: { id: (request.params as { id: string }).id, ...input } };
  });

  app.delete("/:id", async (_request, reply) => reply.code(204).send());
};
