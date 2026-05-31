import type { FastifyPluginAsync } from "fastify";

export const exportRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (_request, reply) =>
    reply.code(202).send({
      job: {
        id: "demo-export",
        status: "pending",
        format: "csv"
      }
    })
  );

  app.get("/", async () => ({ jobs: [] }));
  app.get("/:id/download-url", async () => ({ url: null, expiresAt: null }));
};
