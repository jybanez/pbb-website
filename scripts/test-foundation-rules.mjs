import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  approvedScreenshots,
  catalogConsistencyErrors,
  duplicateIdErrors,
  HERO_FOCAL_POSITIONS,
  heroImageReferenceErrors,
  imageFocalPositionErrors,
  moduleIconCatalogErrors,
  relationshipErrors,
  screenshotErrors,
  seoUniquenessErrors
} from "./content-rules.mjs";
import { galleryTransformSignature, imageTransformSignature } from "./image-cache.mjs";
import {
  ENGAGEMENT_FIELD_TYPES,
  ENGAGEMENT_FORM_KEYS,
  ENGAGEMENT_INQUIRY_TYPES,
  EXPECTED_ENGAGEMENT_FIELDS,
  engagementConfigurationErrors,
  normalizeInquiryType
} from "./engagement-rules.mjs";

assert.deepEqual(ENGAGEMENT_INQUIRY_TYPES, ["briefing", "pilot", "partnership"]);
assert.deepEqual(ENGAGEMENT_FORM_KEYS, ["homepage", "briefing", "pilot", "partnership"]);
assert.deepEqual(ENGAGEMENT_FIELD_TYPES, ["text", "select", "textarea", "checkbox-group"]);
for (const inquiryType of ENGAGEMENT_INQUIRY_TYPES) assert.equal(normalizeInquiryType(inquiryType), inquiryType);
for (const inquiryType of [undefined, null, "", "vendor", "Pilot"]) assert.equal(normalizeInquiryType(inquiryType), "briefing");
const engagementForms = JSON.parse(fs.readFileSync(path.resolve("src/data/engagement-forms.json"), "utf8"));
assert.deepEqual(engagementConfigurationErrors(engagementForms), []);
for (const key of ENGAGEMENT_FORM_KEYS) assert.deepEqual(engagementForms[key].fields.map((field) => field.name), EXPECTED_ENGAGEMENT_FIELDS[key]);
const mutateEngagement = (callback) => {
  const value = structuredClone(engagementForms);
  callback(value);
  return engagementConfigurationErrors(value);
};
assert.ok(mutateEngagement((value) => { value.unapproved = value.homepage; }).length > 0);
assert.ok(mutateEngagement((value) => { value.pilot.inquiryType = "vendor"; }).length > 0);
assert.ok(mutateEngagement((value) => { value.pilot.inquiryType = "briefing"; }).length > 0);
assert.ok(mutateEngagement((value) => { value.pilot.fields[0].type = "date"; }).length > 0);
assert.ok(mutateEngagement((value) => { value.pilot.fields[0].label = ""; }).length > 0);
assert.ok(mutateEngagement((value) => { value.pilot.fields[1].name = value.pilot.fields[0].name; }).length > 0);
assert.ok(mutateEngagement((value) => { value.pilot.fields[1].id = value.pilot.fields[0].id; }).length > 0);
assert.ok(mutateEngagement((value) => { value.briefing.fields[1].options.push(value.briefing.fields[1].options[0]); }).length > 0);
assert.ok(mutateEngagement((value) => { value.briefing.fields[1].options[0] = ""; }).length > 0);
assert.ok(mutateEngagement((value) => { value.briefing.fields[1].options = []; }).length > 0);
assert.ok(mutateEngagement((value) => { value.pilot.fields[0].maxlength = 0; }).length > 0);

const moduleCatalogItem = {
  slug: "hotline", name: "PBB Hotline", productName: "Vox", family: "Auxilus Mos",
  category: "emergency-operations", status: "integrated"
};
const moduleRecord = {
  slug: "hotline", name: "PBB Hotline", productName: "Vox", productFamily: "Auxilus Mos",
  category: "emergency-operations", readiness: { status: "integrated" }
};
assert.deepEqual(catalogConsistencyErrors({ kind: "module", file: "module.json", record: moduleRecord, catalogItem: moduleCatalogItem }), []);
for (const [path, value] of [
  ["name", "Wrong name"], ["productName", "Wrong product"], ["productFamily", "Citizen-facing services"],
  ["category", "health-welfare"], ["readiness", { status: "prototype" }]
]) {
  assert.equal(catalogConsistencyErrors({ kind: "module", file: "module.json", record: { ...moduleRecord, [path]: value }, catalogItem: moduleCatalogItem }).length, 1);
}

assert.deepEqual(catalogConsistencyErrors({
  kind: "component", file: "component.json", record: { slug: "relay", name: "PBB Relay" },
  catalogItem: { slug: "relay", name: "PBB Relay" }
}), []);
assert.equal(catalogConsistencyErrors({ kind: "component", file: "component.json", record: {}, catalogItem: null }).length, 1);
assert.equal(catalogConsistencyErrors({
  kind: "component", file: "component.json", record: { name: "Wrong name" }, catalogItem: { name: "PBB Relay" }
}).length, 1);

assert.equal(duplicateIdErrors("component.json", [["screenshot IDs", [{ id: "same" }, { id: "same" }]]]).length, 1);
assert.equal(relationshipErrors("component.json", [{ label: "module", slugs: ["unknown"], allowed: ["hotline"] }]).length, 1);

const screenshot = { type: "image", imageKey: "relay", src: "relay.png", width: 1200, height: 700 };
const imageManifest = { relay: { source: "relay.png", width: 1200, height: 700 } };
assert.deepEqual(approvedScreenshots([screenshot], imageManifest), [screenshot]);
assert.deepEqual(approvedScreenshots([{ type: "placeholder", imageKey: "relay" }], imageManifest), []);
assert.deepEqual(approvedScreenshots([{ ...screenshot, imageKey: "missing" }], imageManifest), []);
assert.deepEqual(approvedScreenshots([], imageManifest), []);
assert.deepEqual(approvedScreenshots(undefined, imageManifest), []);
assert.deepEqual(screenshotErrors({ file: "component.json", screenshots: [screenshot], images: imageManifest, sourceExists: () => true }), []);
assert.equal(screenshotErrors({ file: "component.json", screenshots: [{ ...screenshot, imageKey: "missing" }], images: imageManifest, sourceExists: () => true }).length, 1);
assert.equal(screenshotErrors({ file: "component.json", screenshots: [screenshot], images: imageManifest, sourceExists: () => false }).length, 1);
assert.equal(screenshotErrors({ file: "component.json", screenshots: [{ ...screenshot, width: 1 }], images: imageManifest, sourceExists: () => true }).length, 1);

assert.equal(seoUniquenessErrors([
  { file: "module.json", seo: { title: "Duplicate title", description: "First description" } },
  { file: "component.json", seo: { title: "Duplicate title", description: "Second description" } }
]).length, 1);

assert.deepEqual(HERO_FOCAL_POSITIONS, ["left", "center", "right", "far-right"]);
assert.deepEqual(imageFocalPositionErrors("hero", {}), [], "A missing focal token must use the template default.");
for (const position of HERO_FOCAL_POSITIONS) assert.deepEqual(imageFocalPositionErrors("hero", { heroFocalPosition: position }), []);
assert.equal(imageFocalPositionErrors("hero", { heroFocalPosition: "73% center" }).length, 1, "Arbitrary CSS focal positions must be rejected.");
assert.deepEqual(heroImageReferenceErrors({ file: "module.json", key: "hero", images: { hero: { alt: "" } } }), []);
assert.equal(heroImageReferenceErrors({ file: "module.json", key: "missing", images: {} }).length, 1);
assert.equal(heroImageReferenceErrors({ file: "module.json", key: "hero", images: { hero: { alt: "Informative" } } }).length, 1);

const iconModules = [
  { slug: "hotline", iconImageKey: "moduleHotlineIcon" },
  { slug: "chat", iconImageKey: "moduleChatIcon" }
];
const iconImages = {
  moduleHotlineIcon: { source: "assets/website/module-icons/hotline.png", outputBase: "module-icon-hotline", widths: [96, 192, 256], largestWidth: 256, width: 1254, height: 1254, nearLossless: true, alt: "" },
  moduleChatIcon: { source: "assets/website/module-icons/chat.png", outputBase: "module-icon-chat", widths: [96, 192, 256], largestWidth: 256, width: 512, height: 512, nearLossless: true, alt: "" }
};
assert.deepEqual(moduleIconCatalogErrors({ modules: iconModules, images: iconImages }), []);
assert.ok(moduleIconCatalogErrors({ modules: [{ slug: "hotline" }], images: iconImages }).length > 0);
assert.ok(moduleIconCatalogErrors({ modules: [{ slug: "hotline", iconImageKey: "missing" }], images: iconImages }).length > 0);
assert.ok(moduleIconCatalogErrors({ modules: iconModules, images: { ...iconImages, moduleChatIcon: { ...iconImages.moduleChatIcon, alt: "Chat" } } }).length > 0);
assert.ok(moduleIconCatalogErrors({ modules: [{ slug: "hotline", iconImageKey: "moduleHotlineIcon" }, { slug: "chat", iconImageKey: "moduleHotlineIcon" }], images: iconImages }).length > 0);
assert.ok(moduleIconCatalogErrors({ modules: iconModules, images: { ...iconImages, moduleChatIcon: { ...iconImages.moduleChatIcon, outputBase: "module-icon-hotline" } } }).length > 0);

const image = { source: "source.png", outputBase: "source", quality: 84, nearLossless: false };
const signature = imageTransformSignature({ image, width: 640, sourceHash: "source-a", engineVersion: "1.0.0" });
assert.notEqual(signature, imageTransformSignature({ image: { ...image, quality: 85 }, width: 640, sourceHash: "source-a", engineVersion: "1.0.0" }));
assert.notEqual(signature, imageTransformSignature({ image: { ...image, nearLossless: true }, width: 640, sourceHash: "source-a", engineVersion: "1.0.0" }));
assert.notEqual(signature, imageTransformSignature({ image, width: 960, sourceHash: "source-a", engineVersion: "1.0.0" }));
assert.notEqual(signature, imageTransformSignature({ image, width: 640, sourceHash: "source-b", engineVersion: "1.0.0" }));
assert.notEqual(signature, imageTransformSignature({ image, width: 640, sourceHash: "source-a", engineVersion: "2.0.0" }));
const gallerySignature = galleryTransformSignature({ sourceHash: "source-a", engineVersion: "1.0.0", variant: { kind: "gallery-full", resize: null }, quality: 84, nearLossless: false });
assert.notEqual(gallerySignature, galleryTransformSignature({ sourceHash: "source-b", engineVersion: "1.0.0", variant: { kind: "gallery-full", resize: null }, quality: 84, nearLossless: false }));
assert.notEqual(gallerySignature, galleryTransformSignature({ sourceHash: "source-a", engineVersion: "1.0.0", variant: { kind: "gallery-thumb", resize: { width: 640 } }, quality: 84, nearLossless: false }));
assert.notEqual(gallerySignature, galleryTransformSignature({ sourceHash: "source-a", engineVersion: "1.0.0", variant: { kind: "gallery-full", resize: null }, quality: 92, nearLossless: true }));

const readRecord = (kind, slug, file) => JSON.parse(fs.readFileSync(path.resolve("src/content", kind, slug, file), "utf8"));
const phase2Modules = Object.fromEntries(["natalium", "salus"].map((slug) => [slug, readRecord("modules", slug, "module.json")]));
const phase2Components = Object.fromEntries(["account", "relay", "realtime", "mapserver", "kit-setup"].map((slug) => [slug, readRecord("infrastructure", slug, "component.json")]));

assert.ok(!phase2Modules.natalium.relatedInfrastructure.includes("realtime"), "Natalium must not present Realtime as confirmed infrastructure.");
assert.ok(!phase2Modules.natalium.relatedInfrastructure.includes("mapserver"), "Natalium must not present MapServer as confirmed infrastructure.");
assert.ok(!phase2Components.realtime.supportedModules.includes("natalium"), "Realtime must not present unconfirmed Natalium support.");
assert.ok(phase2Components.realtime.supportedModules.includes("salus"), "Realtime must include Salus's confirmed optional notification path.");
assert.ok(phase2Components.account.supportedModules.includes("salus"), "Account must include Salus's confirmed sign-in path.");
for (const component of [phase2Components.relay, phase2Components.mapserver]) {
  assert.ok(!component.supportedModules.includes("salus"), `${component.name} must not present unconfirmed Salus support.`);
}
for (const slug of ["salus", "library", "learning"]) {
  assert.ok(!phase2Components["kit-setup"].supportedModules.includes(slug), `Kit Setup must not present incomplete ${slug} packaging as current support.`);
}

console.log("Foundation semantic and image-cache regression rules passed.");
