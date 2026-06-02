import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import argon2 from "argon2";
import { loginSchema, registerSchema } from "@smoke-tracker/shared";
import { clearAuthCookies, setAuthCookies } from "../lib/cookies.js";
import { serializeUser } from "../lib/serializers.js";
import {
  createAccessToken,
  createRefreshTokenSecret,
  decodeRefreshToken,
  encodeRefreshToken,
  hashRefreshTokenSecret,
} from "../lib/tokens.js";
import { config } from "../config.js";

const refreshTokenDays = 30;

async function createSession(app: FastifyInstance, userId: string) {
  const accessToken = await createAccessToken({ userId });
  const refreshSecret = createRefreshTokenSecret();
  const refreshToken = await app.prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshTokenSecret(refreshSecret),
      expiresAt: new Date(Date.now() + refreshTokenDays * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken: encodeRefreshToken(refreshToken.id, refreshSecret),
  };
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const existing = await app.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      return reply.code(409).send({ message: "Email is already registered" });
    }

    const user = await app.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: await argon2.hash(input.password),
        displayName: input.displayName ?? null,
        timezone: input.timezone,
      },
    });
    const session = await createSession(app, user.id);

    setAuthCookies(reply, session.accessToken, session.refreshToken);
    return reply.code(201).send({ user: serializeUser(user) });
  });

  app.post("/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      return reply.code(401).send({ message: "Invalid email or password" });
    }

    const session = await createSession(app, user.id);
    setAuthCookies(reply, session.accessToken, session.refreshToken);

    return { user: serializeUser(user) };
  });

  app.post("/refresh", async (request, reply) => {
    const cookie = request.cookies[config.REFRESH_COOKIE_NAME];
    const decoded = cookie ? decodeRefreshToken(cookie) : null;

    if (!decoded) {
      clearAuthCookies(reply);
      return reply.code(401).send({ message: "Refresh token required" });
    }

    const currentToken = await app.prisma.refreshToken.findUnique({
      where: { id: decoded.tokenId },
      include: { user: true },
    });

    if (currentToken && currentToken.revokedAt && currentToken.tokenHash === hashRefreshTokenSecret(decoded.secret)) {
      // Replay attack / Token reuse detected: revoke entire token family
      await app.prisma.refreshToken.updateMany({
        where: { userId: currentToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      clearAuthCookies(reply);
      return reply.code(401).send({ message: "Refresh token is invalid" });
    }

    if (
      !currentToken ||
      currentToken.expiresAt <= new Date() ||
      currentToken.tokenHash !== hashRefreshTokenSecret(decoded.secret)
    ) {
      clearAuthCookies(reply);
      return reply.code(401).send({ message: "Refresh token is invalid" });
    }

    await app.prisma.refreshToken.update({
      where: { id: currentToken.id },
      data: { revokedAt: new Date() },
    });

    const session = await createSession(app, currentToken.userId);
    setAuthCookies(reply, session.accessToken, session.refreshToken);

    return { user: serializeUser(currentToken.user) };
  });

  app.post("/logout", async (request, reply) => {
    const cookie = request.cookies[config.REFRESH_COOKIE_NAME];
    const decoded = cookie ? decodeRefreshToken(cookie) : null;

    if (decoded) {
      await app.prisma.refreshToken.updateMany({
        where: {
          id: decoded.tokenId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    clearAuthCookies(reply);
    return reply.code(204).send();
  });
};
