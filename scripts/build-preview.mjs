import { spawnSync } from "node:child_process";
import { normalizePrefix } from "./preview-paths.mjs";
const env = { ...process.env, SITE_PATH_PREFIX: normalizePrefix(process.env.SITE_PATH_PREFIX || "/pbb-website/") };
const build = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], { env, stdio: "inherit", shell: process.platform === "win32" });
if (build.status !== 0) process.exit(build.status || 1);
const checks = spawnSync(process.execPath, ["scripts/test-preview.mjs"], { env, stdio: "inherit" });
process.exit(checks.status ?? 1);
