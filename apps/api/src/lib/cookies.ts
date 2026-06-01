import type { FastifyReply } from "fastify";
import { config } from "../config.js";

const isProduction = config.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/",
};

export function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply
    .setCookie(config.ACCESS_COOKIE_NAME, accessToken, {
      ...baseCookieOptions,
      maxAge: 15 * 60,
    })
    .setCookie(config.REFRESH_COOKIE_NAME, refreshToken, {
      ...baseCookieOptions,
      maxAge: 30 * 24 * 60 * 60,
    });
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie(config.ACCESS_COOKIE_NAME, { path: "/" }).clearCookie(config.REFRESH_COOKIE_NAME, { path: "/" });
}
