import { config as loadEnv } from "dotenv";

loadEnv({ path: "../../.env" });
loadEnv();

const { buildApp } = await import("./app");
const { config } = await import("./config");

const app = await buildApp();

try {
  await app.listen({ host: "0.0.0.0", port: config.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
