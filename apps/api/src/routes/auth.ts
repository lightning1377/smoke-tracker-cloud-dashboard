import type { FastifyPluginAsync } from "fastify";
import { loginSchema, registerSchema } from "@smoke-tracker/shared";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);

    return reply.code(201).send({
      user: {
        id: "demo-user",
        email: input.email,
        displayName: input.displayName ?? null,
        timezone: input.timezone
      },
      accessToken: "replace-with-jwt"
    });
  });

  app.post("/login", async (request) => {
    const input = loginSchema.parse(request.body);

    return {
      user: {
        id: "demo-user",
        email: input.email,
        displayName: "Demo User",
        timezone: "UTC"
      },
      accessToken: "replace-with-jwt"
    };
  });

  app.post("/refresh", async () => ({ accessToken: "replace-with-rotated-jwt" }));
  app.post("/logout", async (_request, reply) => reply.code(204).send());
};
