import fs from "node:fs";
import path from "node:path";
import { normalizeInquiryType } from "./scripts/engagement-rules.mjs";
import { approvedScreenshots } from "./scripts/content-rules.mjs";

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.resolve(relativePath), "utf8"));

export default function (eleventyConfig) {
  eleventyConfig.setQuietMode(true);

  // Single-word files under src/data are loaded by Eleventy's data cascade.
  // Hyphenated files get explicit camel-case aliases for readable templates.
  eleventyConfig.addGlobalData("readinessStatuses", () => readJson("src/data/readiness-statuses.json"));
  eleventyConfig.addGlobalData("productCatalog", () => readJson("src/data/product-catalog.json"));
  eleventyConfig.addGlobalData("engagementForms", () => readJson("src/data/engagement-forms.json"));
  eleventyConfig.addGlobalData("modules", () => {
    const root = path.resolve("src/content/modules");
    return fs.readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => readJson(path.join("src/content/modules", entry.name, "module.json")))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  eleventyConfig.addGlobalData("components", () => {
    const root = path.resolve("src/content/infrastructure");
    if (!fs.existsSync(root)) return [];
    return fs.readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => readJson(path.join("src/content/infrastructure", entry.name, "component.json")))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  eleventyConfig.addFilter("statusLabel", (status, statuses) =>
    statuses.find((entry) => entry.id === status)?.label ?? status);
  eleventyConfig.addFilter("categoryLabel", (category, categories) =>
    categories.find((entry) => entry.id === category)?.label ?? category);
  eleventyConfig.addFilter("deploymentLabel", (deployment, deployments) =>
    deployments.placements.find((entry) => entry.id === deployment)?.label ?? deployment);
  eleventyConfig.addFilter("catalogItem", (slug, catalog) =>
    catalog.modules.find((entry) => entry.slug === slug));
  eleventyConfig.addFilter("infrastructureItem", (slug, catalog) =>
    catalog.infrastructure.find((entry) => entry.slug === slug));
  eleventyConfig.addFilter("imagePath", (image, width) =>
    `/assets/generated/${image.outputBase}-${width}.webp`);
  eleventyConfig.addFilter("inquiryType", normalizeInquiryType);
  eleventyConfig.addFilter("approvedScreenshots", approvedScreenshots);
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));

  eleventyConfig.addPassthroughCopy({ "src/assets/site.css": "assets/site.css" });
  eleventyConfig.addPassthroughCopy({ "src/assets/site.js": "assets/site.js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/gallery-route.js": "assets/gallery-route.js" });
  eleventyConfig.addPassthroughCopy({ "src/assets/generated": "assets/generated" });
  eleventyConfig.addPassthroughCopy({ "assets/pbb-logo-eye-h42.png": "assets/pbb-logo-eye-h42.png" });
  eleventyConfig.addPassthroughCopy({ "assets/pbb-logo-eye-h84@2x.png": "assets/pbb-logo-eye-h84@2x.png" });
  eleventyConfig.addPassthroughCopy({ "assets/pbb-logo-eye-h126@3x.png": "assets/pbb-logo-eye-h126@3x.png" });
  eleventyConfig.addPassthroughCopy({ "assets/pbb-preview-graphic.png": "assets/pbb-preview-graphic.png" });
  eleventyConfig.addPassthroughCopy("assets/gallery/**/*.webp");
  eleventyConfig.addPassthroughCopy({ "vendor": "vendor" });
  eleventyConfig.addPassthroughCopy("gallery-data.js");
  eleventyConfig.addPassthroughCopy("pbb-gallery.js");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("robots.txt");
  if (fs.existsSync(".well-known")) {
    eleventyConfig.addPassthroughCopy(".well-known");
  }

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "templates",
      data: "data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk"]
  };
}
