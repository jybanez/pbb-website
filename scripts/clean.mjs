import fs from "node:fs/promises";
import { fromRoot } from "./lib.mjs";

await fs.rm(fromRoot("dist"), { recursive: true, force: true });
console.log("Removed disposable dist output.");
