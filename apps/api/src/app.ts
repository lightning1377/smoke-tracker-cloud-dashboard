import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { ZodError } from "zod";
import { config } from "./config";
import { clearAuthCookies } from "./lib/cookies";
import { serializeUser } from "./lib/serializers";
import { authPlugin } from "./plugins/auth";
import { prismaPlugin } from "./plugins/prisma";
import { analyticsRoutes } from "./routes/analytics";
import { authRoutes } from "./routes/auth";
import { exportRoutes } from "./routes/exports";
import { goalRoutes } from "./routes/goals";
import { smokeItemRoutes } from "./routes/smoke-items";
import { smokeLogRoutes } from "./routes/smoke-logs";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: config.WEB_ORIGIN,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
  });
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: "Validation failed",
        issues: error.issues,
      });
    }

    app.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/ready", async () => ({ status: "ready" }));

  await app.register(authRoutes, { prefix: "/v1/auth" });
  await app.register(smokeItemRoutes, { prefix: "/v1/smoke-items" });
  await app.register(smokeLogRoutes, { prefix: "/v1/smoke-logs" });
  await app.register(goalRoutes, { prefix: "/v1/goals" });
  await app.register(analyticsRoutes, { prefix: "/v1/analytics" });
  await app.register(exportRoutes, { prefix: "/v1/exports" });

  app.get("/v1/me", { preHandler: app.authenticate }, async (request) => ({
    user: serializeUser(request.currentUser),
  }));

  app.delete("/v1/me", { preHandler: app.authenticate }, async (request, reply) => {
    await app.prisma.user.delete({
      where: { id: request.currentUser.id },
    });

    clearAuthCookies(reply);
    return reply.code(204).send();
  });

  return app;
}
