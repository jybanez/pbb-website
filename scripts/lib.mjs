import fs from "node:fs";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "..");
export const fromRoot = (...parts) => path.join(root, ...parts);
export const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(fromRoot(relativePath), "utf8"));
export const walk = (directory, predicate = () => true) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath, predicate) : predicate(fullPath) ? [fullPath] : [];
  });
};
export const relative = (filePath) => path.relative(root, filePath).replaceAll("\\", "/");
