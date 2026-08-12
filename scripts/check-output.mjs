import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "htmlparser2";
import { fromRoot, relative, walk } from "./lib.mjs";

const dist = fromRoot("dist");
const htmlFiles = walk(dist, (file) => file.endsWith(".html"));
const errors = [];
const siteUrl = "https://pbb.ph";
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

const elements = (node, output = []) => {
  if (node.type === "tag" || node.type === "script" || node.type === "style") output.push(node);
  for (const child of node.children ?? []) elements(child, output);
  return output;
};

const resolveTarget = (value, currentFile) => {
  const [pathname, fragment = ""] = value.split("#", 2);
  const clean = pathname.split("?", 1)[0];
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(clean)) return null;
  const currentDirectory = path.dirname(currentFile);
  let target = clean.startsWith("/")
    ? path.join(dist, clean.replace(/^\/+/, ""))
    : path.resolve(currentDirectory, clean || path.basename(currentFile));
  if (clean.endsWith("/") || (!path.extname(target) && !clean.endsWith(".html"))) target = path.join(target, "index.html");
  return { target, fragment };
};

const nodeText = (node) => (node.data ?? "") + (node.children ?? []).map(nodeText).join("");
const pagePath = (file) => {
  const outputPath = relative(file).replace(/^dist\//, "").replaceAll("\\", "/");
  if (outputPath === "index.html") return "/";
  if (outputPath.endsWith("/index.html")) return `/${outputPath.slice(0, -"index.html".length)}`;
  return `/${outputPath}`;
};
const legacyTargets = new Map([
  ["/gallery.html", "/gallery/"],
  ["/deployment-model.html", "/deployment/"]
]);
const addUnique = (map, value, file, label) => {
  if (!value) return;
  if (map.has(value)) errors.push(`${relative(file)} duplicates ${label} from ${relative(map.get(value))}: ${value}`);
  else map.set(value, file);
};

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const document = parseDocument(html);
  const nodes = elements(document);
  const route = pagePath(file);
  const legacyTarget = legacyTargets.get(route);
  const renderedIds = nodes.map((node) => node.attribs?.id).filter(Boolean);
  const ids = new Set(renderedIds);
  if (ids.size !== renderedIds.length) errors.push(`${relative(file)} contains duplicate element IDs.`);
  const canonical = nodes.filter((node) => node.name === "link" && node.attribs?.rel === "canonical");
  if (canonical.length !== 1) errors.push(`${relative(file)} must have exactly one canonical link.`);
  if (!/<main(?:\s|>)/i.test(html)) errors.push(`${relative(file)} is missing a main landmark.`);

  const titleNodes = nodes.filter((node) => node.name === "title");
  const descriptionNodes = nodes.filter((node) => node.name === "meta" && node.attribs?.name === "description");
  const title = titleNodes.length === 1 ? nodeText(titleNodes[0]).trim() : "";
  const description = descriptionNodes.length === 1 ? descriptionNodes[0].attribs?.content?.trim() : "";
  if (!title) errors.push(`${relative(file)} must have one non-empty title.`);
  if (!description) errors.push(`${relative(file)} must have one non-empty meta description.`);
  addUnique(titles, title, file, "page title");
  addUnique(descriptions, description, file, "meta description");

  const canonicalValue = canonical[0]?.attribs?.href;
  const expectedCanonical = `${siteUrl}${legacyTarget ?? route}`;
  if (canonicalValue && canonicalValue !== expectedCanonical) errors.push(`${relative(file)} canonical must be ${expectedCanonical}, received ${canonicalValue}.`);
  if (!legacyTarget) addUnique(canonicals, canonicalValue, file, "canonical URL");

  for (const property of ["og:title", "og:description", "og:url", "og:image"]) {
    const matches = nodes.filter((node) => node.name === "meta" && node.attribs?.property === property);
    if (matches.length !== 1 || !matches[0].attribs?.content) errors.push(`${relative(file)} must have one non-empty ${property} meta tag.`);
  }
  for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
    const matches = nodes.filter((node) => node.name === "meta" && node.attribs?.name === name);
    if (matches.length !== 1 || !matches[0].attribs?.content) errors.push(`${relative(file)} must have one non-empty ${name} meta tag.`);
  }

  const jsonLd = [];
  for (const node of nodes.filter((entry) => entry.name === "script" && entry.attribs?.type === "application/ld+json")) {
    try { jsonLd.push(JSON.parse(nodeText(node))); }
    catch (error) { errors.push(`${relative(file)} has invalid JSON-LD: ${error.message}`); }
  }
  if (/^\/(?:modules|infrastructure)\/[^/]+\/$/.test(route) && !jsonLd.some((entry) => entry["@type"] === "BreadcrumbList")) {
    errors.push(`${relative(file)} is missing BreadcrumbList structured data.`);
  }
  if (legacyTarget) {
    const refresh = nodes.find((node) => node.name === "meta" && node.attribs?.["http-equiv"]?.toLowerCase() === "refresh");
    if (!refresh?.attribs?.content?.includes(`url=${legacyTarget}`)) errors.push(`${relative(file)} is missing a safe refresh fallback to ${legacyTarget}.`);
  }
  if (route === "/404.html" && !nodes.some((node) => node.name === "meta" && node.attribs?.name === "robots" && /noindex/i.test(node.attribs?.content ?? ""))) {
    errors.push("dist/404.html must be marked noindex.");
  }

  const references = [];
  for (const node of nodes) {
    for (const attribute of ["href", "src"]) {
      if (node.attribs?.[attribute]) references.push(node.attribs[attribute]);
    }
    if (node.attribs?.srcset) {
      references.push(...node.attribs.srcset.split(",").map((part) => part.trim().split(/\s+/, 1)[0]));
    }
  }

  if (!legacyTarget) {
    for (const href of nodes.filter((node) => node.name === "a").map((node) => node.attribs?.href).filter(Boolean)) {
      let destination;
      try {
        destination = new URL(href, new URL(route, siteUrl));
      } catch {
        continue;
      }
      if (destination.origin === siteUrl && legacyTargets.has(destination.pathname)) {
        errors.push(`${relative(file)} links to redirect-only compatibility route ${destination.pathname}; use ${legacyTargets.get(destination.pathname)} instead.`);
      }
    }
  }

  for (const node of nodes.filter((entry) => entry.name === "img")) {
    if (!("alt" in (node.attribs ?? {}))) errors.push(`${relative(file)} has an image without alt text.`);
    if (!/^\d+$/.test(node.attribs?.width ?? "") || !/^\d+$/.test(node.attribs?.height ?? "")) errors.push(`${relative(file)} has an image without explicit integer width and height.`);
    const rasterReferences = [node.attribs?.src, ...(node.attribs?.srcset ?? "").split(",").map((item) => item.trim().split(/\s+/, 1)[0])].filter(Boolean);
    for (const reference of rasterReferences) {
      if (/\.(?:png|jpe?g)(?:[?#]|$)/i.test(reference)) errors.push(`${relative(file)} has a non-WebP on-page raster image: ${reference}`);
    }
  }

  for (const reference of references) {
    const resolved = resolveTarget(reference, file);
    if (!resolved) continue;
    if (!fs.existsSync(resolved.target)) {
      errors.push(`${relative(file)} -> missing ${reference}`);
      continue;
    }
    if (resolved.fragment) {
      const targetHtml = fs.readFileSync(resolved.target, "utf8");
      const targetIds = resolved.target === file ? ids : new Set(elements(parseDocument(targetHtml)).map((node) => node.attribs?.id).filter(Boolean));
      if (!targetIds.has(decodeURIComponent(resolved.fragment))) errors.push(`${relative(file)} -> missing fragment ${reference}`);
    }
  }
}

const sitemapPath = path.join(dist, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  errors.push("dist/sitemap.xml is missing.");
} else {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const actual = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  const expected = new Set(htmlFiles.map(pagePath)
    .filter((route) => route !== "/404.html" && !legacyTargets.has(route))
    .map((route) => `${siteUrl}${route}`));
  for (const url of expected) if (!actual.has(url)) errors.push(`dist/sitemap.xml is missing ${url}.`);
  for (const url of actual) if (!expected.has(url)) errors.push(`dist/sitemap.xml contains a non-public or unknown route: ${url}.`);
  if (actual.size !== expected.size) errors.push(`dist/sitemap.xml has ${actual.size} URLs; expected ${expected.size}.`);
}

const deployedGallery = path.join(dist, "assets", "gallery");
const deployedGalleryFiles = fs.existsSync(deployedGallery) ? walk(deployedGallery, () => true) : [];
const nonWebpGallery = deployedGalleryFiles.filter((file) => !file.toLowerCase().endsWith(".webp"));
if (nonWebpGallery.length) errors.push(`Deployed gallery contains non-WebP files: ${nonWebpGallery.map(relative).join(", ")}`);
const gallerySources = walk(fromRoot("assets/gallery"), (file) => /\.(?:png|jpe?g)$/i.test(file) && !file.includes(`${path.sep}thumbs${path.sep}`));
if (deployedGalleryFiles.length !== gallerySources.length * 2) errors.push(`Deployed gallery has ${deployedGalleryFiles.length} WebP files; expected ${gallerySources.length * 2} full and thumbnail outputs.`);

if (errors.length) {
  console.error(`Output check failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Output check passed: ${htmlFiles.length} HTML pages and their internal links/assets resolve.`);
