import fs from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import sharp from "sharp";
import { fromRoot, readJson, relative, walk } from "./lib.mjs";
import {
  catalogConsistencyErrors,
  duplicateIdErrors,
  heroImageReferenceErrors,
  imageFocalPositionErrors,
  moduleIconCatalogErrors,
  relationshipErrors,
  screenshotErrors,
  seoUniquenessErrors
} from "./content-rules.mjs";
import { engagementConfigurationErrors } from "./engagement-rules.mjs";

const errors = [];
const fail = (message) => errors.push(message);
const unique = (values) => new Set(values).size === values.length;
const hasRawHtml = (value) => {
  if (typeof value === "string") return /<\/?[a-z][^>]*>/i.test(value);
  if (Array.isArray(value)) return value.some(hasRawHtml);
  if (value && typeof value === "object") return Object.values(value).some(hasRawHtml);
  return false;
};

const sharedSchema = readJson("schemas/shared.schema.json");
const moduleSchema = readJson("schemas/module.schema.json");
const componentSchema = readJson("schemas/infrastructure-component.schema.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(sharedSchema);
ajv.addSchema(moduleSchema);
ajv.addSchema(componentSchema);
const validateModule = ajv.getSchema(moduleSchema.$id);
const validateComponent = ajv.getSchema(componentSchema.$id);

const categories = readJson("src/data/categories.json");
const statuses = readJson("src/data/readiness-statuses.json");
const deployments = readJson("src/data/deployments.json");
const catalog = readJson("src/data/product-catalog.json");
const images = readJson("src/data/images.json");
const engagementForms = readJson("src/data/engagement-forms.json");

for (const error of engagementConfigurationErrors(engagementForms)) fail(error);

const categoryIds = categories.map((item) => item.id);
const statusIds = statuses.map((item) => item.id);
const placementIds = deployments.placements.map((item) => item.id);
const classificationIds = deployments.classifications.map((item) => item.id);
const moduleSlugs = catalog.modules.map((item) => item.slug);
const infrastructureSlugs = catalog.infrastructure.map((item) => item.slug);
const moduleIconKeys = new Set(catalog.modules.map((item) => item.iconImageKey).filter(Boolean));

for (const [label, values] of [
  ["category IDs", categoryIds],
  ["readiness IDs", statusIds],
  ["deployment placement IDs", placementIds],
  ["deployment classification IDs", classificationIds],
  ["module catalog slugs", moduleSlugs],
  ["infrastructure catalog slugs", infrastructureSlugs]
]) {
  if (!unique(values)) fail(`Duplicate ${label}.`);
}

const requiredCategories = [
  "emergency-operations", "health-welfare", "community-communication",
  "community-engagement", "learning-knowledge", "utility-public-service",
  "local-node-infrastructure"
];
if (JSON.stringify(categoryIds) !== JSON.stringify(requiredCategories)) {
  fail("Formal categories or their required order do not match the approved brief.");
}
if (catalog.modules.find((item) => item.slug === "games")?.category !== "community-engagement") {
  fail("PBB Games / Tabulus must use Community engagement.");
}

for (const item of catalog.modules) {
  if (!categoryIds.includes(item.category)) fail(`Unknown catalog category for ${item.slug}: ${item.category}`);
  if (!statusIds.includes(item.status)) fail(`Unknown catalog readiness for ${item.slug}: ${item.status}`);
}
for (const error of moduleIconCatalogErrors({ modules: catalog.modules, images })) fail(error);

const moduleFiles = walk(fromRoot("src/content/modules"), (file) => file.endsWith("module.json"));
const modules = moduleFiles.map((file) => ({ file, data: JSON.parse(fs.readFileSync(file, "utf8")) }));
const componentFiles = walk(fromRoot("src/content/infrastructure"), (file) => file.endsWith("component.json"));
const components = componentFiles.map((file) => ({ file, data: JSON.parse(fs.readFileSync(file, "utf8")) }));

if (!unique(modules.map(({ data }) => data.slug))) fail("Duplicate module slugs.");
if (!unique(components.map(({ data }) => data.slug))) fail("Duplicate infrastructure component slugs.");

const seoRecords = [];

for (const { file, data } of modules) {
  if (!validateModule(data)) {
    for (const issue of validateModule.errors ?? []) {
      fail(`${relative(file)}${issue.instancePath || "/"}: ${issue.message}`);
    }
  }
  if (hasRawHtml(data)) fail(`${relative(file)} contains unsupported raw HTML.`);
  const catalogItem = catalog.modules.find((item) => item.slug === data.slug);
  for (const error of catalogConsistencyErrors({
    kind: "module", file: relative(file), record: data, catalogItem
  })) fail(error);
  if (catalogItem && !catalogItem.detailAvailable) fail(`${relative(file)} exists but its catalog detailAvailable flag is false.`);
  for (const error of heroImageReferenceErrors({ file: relative(file), key: data.heroImageKey, images })) fail(error);

  for (const error of duplicateIdErrors(relative(file), [
    ["workflow IDs", data.workflowSteps], ["screenshot IDs", data.screenshots], ["FAQ IDs", data.faqs]
  ])) fail(error);
  for (const error of relationshipErrors(relative(file), [
    { label: "module", slugs: data.relatedModules, allowed: moduleSlugs },
    { label: "infrastructure", slugs: data.relatedInfrastructure, allowed: infrastructureSlugs }
  ])) fail(error);
  for (const error of screenshotErrors({
    file: relative(file), screenshots: data.screenshots, images,
    sourceExists: (source) => fs.existsSync(fromRoot(source))
  })) fail(error);
  seoRecords.push({ file: relative(file), seo: data.seo });
}

for (const { file, data } of components) {
  if (!validateComponent(data)) {
    for (const issue of validateComponent.errors ?? []) {
      fail(`${relative(file)}${issue.instancePath || "/"}: ${issue.message}`);
    }
  }
  if (hasRawHtml(data)) fail(`${relative(file)} contains unsupported raw HTML.`);
  const catalogItem = catalog.infrastructure.find((item) => item.slug === data.slug);
  for (const error of catalogConsistencyErrors({
    kind: "component", file: relative(file), record: data, catalogItem
  })) fail(error);
  for (const error of heroImageReferenceErrors({ file: relative(file), key: data.heroImageKey, images })) fail(error);
  for (const error of duplicateIdErrors(relative(file), [
    ["screenshot IDs", data.diagramsOrScreenshots], ["FAQ IDs", data.faqs]
  ])) fail(error);
  for (const error of relationshipErrors(relative(file), [
    { label: "supported module", slugs: data.supportedModules, allowed: moduleSlugs },
    { label: "module", slugs: data.relatedModules, allowed: moduleSlugs },
    { label: "infrastructure component", slugs: data.relatedComponents, allowed: infrastructureSlugs }
  ])) fail(error);
  for (const error of screenshotErrors({
    file: relative(file), screenshots: data.diagramsOrScreenshots, images,
    sourceExists: (source) => fs.existsSync(fromRoot(source))
  })) fail(error);
  seoRecords.push({ file: relative(file), seo: data.seo });
}

for (const error of seoUniquenessErrors(seoRecords)) fail(error);

for (const [key, image] of Object.entries(images)) {
  for (const error of imageFocalPositionErrors(key, image)) fail(error);
  const imagePath = fromRoot(image.source);
  if (!fs.existsSync(imagePath)) {
    fail(`Image manifest entry ${key} is missing source ${image.source}.`);
    continue;
  }
  const metadata = await sharp(imagePath).metadata();
  if (metadata.width !== image.width || metadata.height !== image.height) {
    fail(`Image manifest dimensions are wrong for ${key}: expected ${metadata.width}x${metadata.height}.`);
  }
  if (!Array.isArray(image.widths) || !image.widths.includes(image.largestWidth)) {
    fail(`Image manifest entry ${key} must include largestWidth in widths.`);
  }
  if (moduleIconKeys.has(key)) {
    if (!metadata.hasAlpha) fail(`Module icon ${key} source must preserve transparency.`);
    if (image.widths.some((width) => width > metadata.width || width > metadata.height)) {
      fail(`Module icon ${key} declares an upscaled variant.`);
    }
  }
}

if (errors.length) {
  console.error(`Content validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Content validation passed: ${modules.length} module records, ${components.length} infrastructure records, ${catalog.modules.length} catalog modules, ${Object.keys(images).length} image sources.`);
