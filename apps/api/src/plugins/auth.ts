import fp from "fastify-plugin";
import type { User } from "@prisma/client";
import type { FastifyReply } from "fastify";
import { config } from "../config";
import { verifyAccessToken } from "../lib/tokens";

declare module "fastify" {
  interface FastifyRequest {
    currentUser: User;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app) => {
  app.decorate("authenticate", async (request, reply) => {
    const token = request.cookies[config.ACCESS_COOKIE_NAME];

    if (!token) {
      return reply.code(401).send({ message: "Authentication required" });
    }

    try {
      const payload = await verifyAccessToken(token);
      const user = await app.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        return reply.code(401).send({ message: "Authentication required" });
      }

      request.currentUser = user;
    } catch {
      return reply.code(401).send({ message: "Authentication required" });
    }
  });
});
