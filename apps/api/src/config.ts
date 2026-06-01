import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_ISSUER: z.string().min(1).default("smoke-tracker-cloud-dashboard"),
  JWT_AUDIENCE: z.string().min(1).default("smoke-tracker-users"),
  ACCESS_COOKIE_NAME: z.string().min(1).default("smoke_access"),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_COOKIE_NAME: z.string().min(1).default("smoke_refresh"),
});

export const config = configSchema.parse(process.env);
