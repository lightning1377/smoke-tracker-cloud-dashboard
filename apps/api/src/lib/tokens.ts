import { randomBytes, createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { config } from "../config.js";

const accessSecret = new TextEncoder().encode(config.ACCESS_TOKEN_SECRET);

export interface AccessTokenPayload {
  userId: string;
}

export async function createAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(config.JWT_ISSUER)
    .setAudience(config.JWT_AUDIENCE)
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const result = await jwtVerify(token, accessSecret, {
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
  });

  const userId = result.payload.userId;
  if (typeof userId !== "string") {
    throw new Error("Invalid access token payload");
  }

  return { userId };
}

export function createRefreshTokenSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshTokenSecret(secret: string) {
  return createHash("sha256").update(`${config.REFRESH_TOKEN_SECRET}:${secret}`).digest("hex");
}

export function encodeRefreshToken(tokenId: string, secret: string) {
  return `${tokenId}.${secret}`;
}

export function decodeRefreshToken(token: string) {
  const [tokenId, secret] = token.split(".");
  if (!tokenId || !secret) {
    return null;
  }

  return { tokenId, secret };
}
