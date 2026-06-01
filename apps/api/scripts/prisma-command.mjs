import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config as loadEnv } from "dotenv";

const directory = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(directory, "..");
const repoRoot = resolve(apiRoot, "../..");

loadEnv({ path: resolve(repoRoot, ".env") });
loadEnv({ path: resolve(apiRoot, ".env") });

const prismaBin = resolve(apiRoot, "node_modules/.bin/prisma");
const result = spawnSync(prismaBin, process.argv.slice(2), {
  cwd: apiRoot,
  env: process.env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
