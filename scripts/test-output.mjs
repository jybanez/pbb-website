import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fromRoot, readJson, walk } from "./lib.mjs";
import { approvedScreenshots } from "./content-rules.mjs";

const productCatalog = readJson("src/data/product-catalog.json");
const images = readJson("src/data/images.json");
const site = readJson("src/data/site.json");
const engagementForms = readJson("src/data/engagement-forms.json");
const infrastructureCatalog = new Map(productCatalog.infrastructure.map((item) => [item.slug, item]));
const moduleCatalog = new Map(productCatalog.modules.map((item) => [item.slug, item]));
const moduleRecords = new Map(productCatalog.modules.map((item) => [item.slug, readJson(`src/content/modules/${item.slug}/module.json`)]));
const infrastructureRecords = new Map(productCatalog.infrastructure.map((item) => [item.slug, readJson(`src/content/infrastructure/${item.slug}/component.json`)]));

const assertEvidenceSection = ({ pagePath, screenshots, heading, label }) => {
  const html = fs.readFileSync(fromRoot(pagePath), "utf8");
  const approved = approvedScreenshots(screenshots, images);
  const sections = [...html.matchAll(/<section class="detail-section" aria-labelledby="screenshots">([\s\S]*?)<\/section>/g)];
  const headingCount = (html.match(new RegExp(heading, "g")) ?? []).length;
  if (approved.length === 0) {
    if (sections.length || headingCount || html.includes('class="screenshot-gallery"') || html.includes('class="screenshot-placeholder"') || html.includes('id="screenshots"')) {
      throw new Error(`${label} must omit its complete evidence section when no approved screenshot exists.`);
    }
    for (const screenshot of screenshots ?? []) {
      if (screenshot.type === "placeholder" && (html.includes(screenshot.title) || html.includes(screenshot.caption))) {
        throw new Error(`${label} renders placeholder evidence copy publicly.`);
      }
    }
    return;
  }

  if (sections.length !== 1 || headingCount !== 1) throw new Error(`${label} must render its approved evidence section exactly once.`);
  const section = sections[0][1];
  if ((section.match(/class="screenshot-gallery"/g) ?? []).length !== 1 || (section.match(/class="screenshot-card"/g) ?? []).length !== approved.length || section.includes("screenshot-placeholder")) {
    throw new Error(`${label} evidence gallery does not match its approved screenshot count.`);
  }
  for (const screenshot of approved) {
    const image = images[screenshot.imageKey];
    if (!section.includes(`<strong>${screenshot.title}</strong>`) || !section.includes(`<span>${screenshot.caption}</span>`)) {
      throw new Error(`${label} evidence does not match screenshot record ${screenshot.id}.`);
    }
    for (const width of image.widths) {
      if (!section.includes(`/assets/generated/${image.outputBase}-${width}.webp ${width}w`)) throw new Error(`${label} evidence ${screenshot.id} is missing its ${width}px WebP candidate.`);
    }
    for (const attribute of [`src="/assets/generated/${image.outputBase}-${image.largestWidth}.webp"`, `width="${image.width}"`, `height="${image.height}"`, `alt="${image.alt}"`, 'loading="lazy"', 'decoding="async"']) {
      if (!section.includes(attribute)) throw new Error(`${label} evidence ${screenshot.id} is missing ${attribute}.`);
    }
    if (html.includes(screenshot.src) || fs.existsSync(fromRoot(`dist/${screenshot.src}`))) throw new Error(`${label} deploys or references its source raster screenshot.`);
  }
};

const assertRelatedInfrastructureCards = ({ pagePath, sectionId, slugs, label }) => {
  const html = fs.readFileSync(fromRoot(pagePath), "utf8");
  const section = html.match(new RegExp(`<section[^>]*aria-labelledby="${sectionId}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1];
  if (!section) throw new Error(`${label} is missing its ${sectionId} section.`);

  const cards = [...section.matchAll(/<a class="related-card" href="([^"]+)">([\s\S]*?)<\/a>/g)]
    .map((match) => ({ href: match[1], body: match[2] }));
  if (cards.length !== slugs.length) {
    throw new Error(`${label} rendered ${cards.length} related infrastructure cards for ${slugs.length} declared slugs.`);
  }
  if (new Set(cards.map((card) => card.href)).size !== cards.length) {
    throw new Error(`${label} rendered duplicate related infrastructure card URLs.`);
  }
  if (cards.some((card) => /module-icon-image|related-module-icon|related-module-content/.test(card.body))) {
    throw new Error(`${label} infrastructure relationship cards must remain free of module-icon markup.`);
  }

  for (const slug of slugs) {
    const item = infrastructureCatalog.get(slug);
    if (!item) throw new Error(`${label} declares unknown related infrastructure slug: ${slug}.`);
    const expectedHref = `/infrastructure/${slug}/`;
    const matches = cards.filter((card) => card.href === expectedHref);
    if (matches.length !== 1) {
      throw new Error(`${label} must render ${expectedHref} exactly once; received ${matches.length}.`);
    }
    if (!matches[0].body.includes(`<strong>${item.name}</strong>`) || !matches[0].body.includes(`<small>${item.description}</small>`)) {
      throw new Error(`${label} card for ${slug} does not match its catalog name and description.`);
    }
  }
};

const moduleIconTag = (html, slug) => html.match(new RegExp(`<img[^>]*module-icon-${slug}-256\\.webp[^>]*>`))?.[0];
const assertModuleIconTag = ({ tag, slug, loading, sizes, label }) => {
  if (!tag) throw new Error(`${label} is missing the ${slug} module icon.`);
  const item = moduleCatalog.get(slug);
  const image = images[item?.iconImageKey];
  if (!item || !image) throw new Error(`${label} cannot resolve catalog icon data for ${slug}.`);
  for (const width of [96, 192, 256]) {
    if (!tag.includes(`module-icon-${slug}-${width}.webp ${width}w`)) throw new Error(`${label} ${slug} icon is missing its ${width}px WebP candidate.`);
  }
  for (const attribute of [`sizes="${sizes}"`, `width="${image.width}"`, `height="${image.height}"`, 'alt=""', `loading="${loading}"`, 'decoding="async"']) {
    if (!tag.includes(attribute)) throw new Error(`${label} ${slug} icon is missing required image behavior: ${attribute}`);
  }
  if (tag.includes("fetchpriority=")) throw new Error(`${label} ${slug} icon must not set fetchpriority.`);
};

const assertModuleCardStructure = ({ card, item, label }) => {
  if ((card.match(/class="module-card-identity"/g) ?? []).length !== 1) throw new Error(`${label} ${item.slug} must render exactly one module-card identity wrapper.`);
  if ((card.match(/class="module-card-icon"/g) ?? []).length !== 1) throw new Error(`${label} ${item.slug} must render exactly one module-card icon wrapper.`);

  const metadataStart = card.indexOf('<div class="card-meta">');
  const metadataEnd = card.indexOf("</div>", metadataStart);
  const identityMatch = /<div class="module-card-identity">\s*<div class="module-card-icon" aria-hidden="true">([\s\S]*?)<\/div>\s*<h3>([\s\S]*?)<\/h3>\s*<\/div>/.exec(card);
  if (!identityMatch) throw new Error(`${label} ${item.slug} identity must contain its decorative icon before its heading.`);
  const identityStart = identityMatch.index;
  const identityEnd = identityStart + identityMatch[0].length;
  if (metadataStart < 0 || metadataEnd < metadataStart || metadataEnd > identityStart) throw new Error(`${label} ${item.slug} metadata must remain outside and above its identity wrapper.`);
  if (!identityMatch[2].includes(item.name) || !identityMatch[2].includes(item.productName)) throw new Error(`${label} ${item.slug} identity heading no longer matches its catalog names.`);

  const descriptionStart = card.indexOf("<p>", identityEnd);
  const descriptionEnd = card.indexOf("</p>", descriptionStart);
  const actionStart = item.detailAvailable
    ? card.indexOf('<a class="text-link"', descriptionEnd)
    : card.indexOf('<span class="phase-note">', descriptionEnd);
  if (descriptionStart < identityEnd || descriptionEnd < descriptionStart || actionStart < descriptionEnd) {
    throw new Error(`${label} ${item.slug} description and action must remain full-width below its identity wrapper.`);
  }

  assertModuleIconTag({
    tag: moduleIconTag(identityMatch[1], item.slug),
    slug: item.slug,
    loading: "lazy",
    sizes: "(max-width: 640px) 56px, 64px",
    label
  });
};

const assertRelatedModuleIcons = ({ pagePath, slugs, label }) => {
  const html = fs.readFileSync(fromRoot(pagePath), "utf8");
  const section = html.match(/<section[^>]*aria-labelledby="related-modules"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  if (!section) throw new Error(`${label} is missing its related-modules section.`);
  const cards = [...section.matchAll(/<a class="related-card related-module-card" href="([^"]+)">([\s\S]*?)<\/a>/g)]
    .map((match) => ({ href: match[1], body: match[2] }));
  if (cards.length !== slugs.length) throw new Error(`${label} rendered ${cards.length} related-module cards for ${slugs.length} declared slugs.`);
  if (new Set(cards.map((card) => card.href)).size !== cards.length) throw new Error(`${label} rendered duplicate related-module card URLs.`);
  for (const slug of slugs) {
    const item = moduleCatalog.get(slug);
    if (!item) throw new Error(`${label} declares unknown related module slug: ${slug}.`);
    const expectedHref = item.detailAvailable ? `/modules/${slug}/` : `/modules/#module-${slug}`;
    const matches = cards.filter((card) => card.href === expectedHref);
    if (matches.length !== 1) throw new Error(`${label} must render related module ${slug} exactly once.`);
    const card = matches[0].body;
    const structure = /<div class="related-module-icon" aria-hidden="true">([\s\S]*?)<\/div>\s*<div class="related-module-content">([\s\S]*?)<\/div>/.exec(card);
    if (!structure || (card.match(/class="related-module-icon"/g) ?? []).length !== 1 || (card.match(/class="related-module-content"/g) ?? []).length !== 1) {
      throw new Error(`${label} related module ${slug} must render one decorative icon wrapper before one content wrapper.`);
    }
    if (!structure[2].includes(`<strong>${item.name} / ${item.productName}</strong>`) || !structure[2].includes(`<small>${item.description}</small>`)) {
      throw new Error(`${label} related module ${slug} no longer matches its catalog name and description.`);
    }
    assertModuleIconTag({ tag: moduleIconTag(structure[1], slug), slug, loading: "lazy", sizes: "(max-width: 640px) 48px, 56px", label: `${label} related card` });
  }
};

const expectations = [
  ["dist/index.html", ["Keeping communities connected", "Built for the people who keep communities moving", "Citizens", "Barangays", "Businesses and CSR partners", "LGUs", "Health centers", "Utilities", "Schools and youth", "Donors and NGOs", "Platform integration", "9/10", "Pilot-ready foundation"]],
  ["dist/modules/index.html", ["Emergency and operations", "Community engagement", "PBB Games", "Health and welfare"]],
  ["dist/modules/hotline/index.html", ["PBB Hotline", "No durable browser-side citizen report outbox", "Editable incident records are not broadly synchronized"]],
  ["dist/modules/natalium/index.html", ["PBB Natalium", "No Relay outbox", "privacy, retention, backup"]],
  ["dist/modules/support/index.html", ["PBB Support System", "designated support node", "universal database replication"]],
  ["dist/modules/salus/index.html", ["PBB Salus", "active development", "evacuation"]],
  ["dist/modules/chat/index.html", ["PBB Chat", "LAN-local", "public gateway"]],
  ["dist/modules/games/index.html", ["PBB Games", "emergency-mode", "operational API"]],
  ["dist/modules/library/index.html", ["PBB Library", "signed Cloud releases", "Relay"]],
  ["dist/modules/learning/index.html", ["PBB Learning", "local learning gateway", "V1"]],
  ["dist/modules/utility/index.html", ["PBB Utility", "inbound-only", "mission"]],
  ["dist/infrastructure/index.html", ["Seven shared services", "not imply full OIDC", "Wizaya Server Suite components"]],
  ["dist/infrastructure/account/index.html", ["PBB Account", "not a claim of complete OpenID Connect", "OAuth-style"]],
  ["dist/infrastructure/relay/index.html", ["PBB Relay", "not universal database replication", "store-and-forward"]],
  ["dist/infrastructure/realtime/index.html", ["PBB Realtime", "in process memory", "one shared process per node"]],
  ["dist/infrastructure/mapserver/index.html", ["PBB MapServer", "cache miss", "prepared tiles"]],
  ["dist/infrastructure/maestro/index.html", ["PBB Maestro", "observer-only", "remote administration"]],
  ["dist/infrastructure/landing/index.html", ["PBB Landing", "distinct from this public", "safe node-metadata"]],
  ["dist/infrastructure/kit-setup/index.html", ["PBB Kit Setup", "Windows-oriented", "FRP"]],
  ["dist/deployment/index.html", ["Baseline, optional, and specialized", "city or municipal support node", "humanitarian or field node", "Hardware and field costs are explicit", "redirects here for compatibility", "original source remains archived in the repository"]],
  ["dist/status/index.html", ["Overall readiness: 7/10", "Security and governance", "Controlled vocabulary"]],
  ["dist/briefing/index.html", ["Request a PBB briefing", "Understand the platform before choosing a next step", "Intended audience", "Topics to cover"]],
  ["dist/pilot/index.html", ["Discuss a PBB pilot", "Start with the locality, owners, and continuity problem", "Locality or service area", "Community or institutional need"]],
  ["dist/partnerships/index.html", ["Explore a PBB partnership", "Connect an accountable contribution to a practical outcome", "Partnership type", "Proposed contribution"]],
  ["dist/gallery/index.html", ["PBB gallery", "Gallery filters", "/assets/gallery-route.js"]],
  ["dist/404.html", ["noindex,follow", "complete module catalog", "View infrastructure"]],
  ["dist/gallery.html", ["url=/gallery/", "window.location.replace(\"/gallery/\"", "https://pbb.ph/gallery/"]],
  ["dist/deployment-model.html", ["url=/deployment/", "window.location.replace(\"/deployment/\"", "https://pbb.ph/deployment/"]]
];

for (const [file, needles] of expectations) {
  const html = fs.readFileSync(fromRoot(file), "utf8");
  for (const needle of needles) {
    if (!html.includes(needle)) throw new Error(`${file} is missing expected pre-rendered content: ${needle}`);
  }
  if (/maximum-scale|user-scalable/i.test(html)) throw new Error(`${file} disables or restricts browser zoom.`);
}

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const assertSharedHeaderBreadcrumb = ({ pagePath, items, structuredItems = null, label }) => {
  const html = fs.readFileSync(fromRoot(pagePath), "utf8");
  const breadcrumbNavigations = [...html.matchAll(/<nav class="breadcrumbs" aria-label="Breadcrumb">([\s\S]*?)<\/nav>/g)];
  if (breadcrumbNavigations.length !== 1) throw new Error(`${label} must render exactly one breadcrumb navigation; received ${breadcrumbNavigations.length}.`);

  const headerStart = html.indexOf('<header class="site-header" data-site-header>');
  const headerEnd = html.indexOf("</header>", headerStart);
  const breadcrumbStart = breadcrumbNavigations[0].index;
  const mainStart = html.indexOf('<main id="main" tabindex="-1">');
  if (headerStart < 0 || headerEnd < 0 || mainStart < 0 || breadcrumbStart < headerStart || breadcrumbStart > headerEnd || headerEnd > mainStart) {
    throw new Error(`${label} breadcrumb must be inside the shared site header and before main.`);
  }

  const header = html.slice(headerStart, headerEnd);
  const mobileNavigationStart = header.indexOf('<nav id="mobile-navigation"');
  const breadcrumbBarStart = header.indexOf('<div class="breadcrumb-bar">');
  if (mobileNavigationStart < 0 || breadcrumbBarStart < 0 || mobileNavigationStart > breadcrumbBarStart) {
    throw new Error(`${label} mobile navigation must remain inside the shared header and precede the breadcrumb bar.`);
  }
  const main = html.slice(mainStart, html.indexOf("</main>", mainStart));
  if (main.includes('class="breadcrumbs"') || main.includes('class="breadcrumb-bar"') || main.includes('class="breadcrumb-wrap"')) {
    throw new Error(`${label} must not retain page-level breadcrumb markup inside main.`);
  }

  const breadcrumb = breadcrumbNavigations[0][0];
  if ((breadcrumb.match(/<ol>/g) ?? []).length !== 1 || (breadcrumb.match(/aria-current="page"/g) ?? []).length !== 1 || /\sid=/.test(breadcrumb)) {
    throw new Error(`${label} breadcrumb must contain one ordered list, one current item, and no duplicate-prone IDs.`);
  }
  const renderedItems = [...breadcrumb.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => match[1].trim());
  if (renderedItems.length !== items.length) throw new Error(`${label} breadcrumb rendered ${renderedItems.length} items for ${items.length} declared levels.`);
  items.forEach((item, index) => {
    const expected = item.url
      ? `<a href="${item.url}">${escapeHtml(item.label)}</a>`
      : `<span aria-current="page">${escapeHtml(item.label)}</span>`;
    if (renderedItems[index] !== expected) throw new Error(`${label} breadcrumb level ${index + 1} must remain ${expected}.`);
  });

  const breadcrumbLists = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
    .filter((entry) => entry["@type"] === "BreadcrumbList");
  if (structuredItems) {
    if (breadcrumbLists.length !== 1) throw new Error(`${label} must render exactly one BreadcrumbList JSON-LD record.`);
    const renderedStructuredItems = breadcrumbLists[0].itemListElement;
    if (JSON.stringify(renderedStructuredItems) !== JSON.stringify(structuredItems)) throw new Error(`${label} BreadcrumbList JSON-LD no longer matches its visible trail and route.`);
  } else if (breadcrumbLists.length !== 0) {
    throw new Error(`${label} unexpectedly gained BreadcrumbList JSON-LD.`);
  }
};

const staticBreadcrumbExpectations = [
  ["dist/modules/index.html", [{ label: "Home", url: "/" }, { label: "Modules" }], "Modules overview"],
  ["dist/infrastructure/index.html", [{ label: "Home", url: "/" }, { label: "Infrastructure" }], "Infrastructure overview"],
  ["dist/deployment/index.html", [{ label: "Home", url: "/" }, { label: "Deployment" }], "Deployment"],
  ["dist/status/index.html", [{ label: "Home", url: "/" }, { label: "Status" }], "Status"],
  ["dist/briefing/index.html", [{ label: "Home", url: "/" }, { label: "Request a briefing" }], "Briefing"],
  ["dist/pilot/index.html", [{ label: "Home", url: "/" }, { label: "Discuss a pilot" }], "Pilot"],
  ["dist/partnerships/index.html", [{ label: "Home", url: "/" }, { label: "Partnership inquiries" }], "Partnerships"],
  ["dist/gallery/index.html", [{ label: "Home", url: "/" }, { label: "Gallery" }], "Gallery"]
];
for (const [pagePath, items, label] of staticBreadcrumbExpectations) assertSharedHeaderBreadcrumb({ pagePath, items, label });

for (const item of productCatalog.modules) {
  assertSharedHeaderBreadcrumb({
    pagePath: `dist/modules/${item.slug}/index.html`,
    items: [{ label: "Home", url: "/" }, { label: "Modules", url: "/modules/" }, { label: item.productName }],
    structuredItems: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pbb.ph/" },
      { "@type": "ListItem", position: 2, name: "Modules", item: "https://pbb.ph/modules/" },
      { "@type": "ListItem", position: 3, name: item.productName, item: `https://pbb.ph/modules/${item.slug}/` }
    ],
    label: `Module ${item.slug}`
  });
}

for (const item of productCatalog.infrastructure) {
  assertSharedHeaderBreadcrumb({
    pagePath: `dist/infrastructure/${item.slug}/index.html`,
    items: [{ label: "Home", url: "/" }, { label: "Infrastructure", url: "/infrastructure/" }, { label: item.name }],
    structuredItems: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pbb.ph/" },
      { "@type": "ListItem", position: 2, name: "Infrastructure", item: "https://pbb.ph/infrastructure/" },
      { "@type": "ListItem", position: 3, name: item.name, item: `https://pbb.ph/infrastructure/${item.slug}/` }
    ],
    label: `Infrastructure component ${item.slug}`
  });
}

for (const [pagePath, label] of [["dist/index.html", "Homepage"], ["dist/404.html", "404 page"]]) {
  const html = fs.readFileSync(fromRoot(pagePath), "utf8");
  if (html.includes('class="breadcrumbs"') || html.includes('class="breadcrumb-bar"') || html.includes('class="breadcrumb-wrap"')) {
    throw new Error(`${label} must remain free of unintended breadcrumb markup.`);
  }
}

const explicitIconMappings = {
  hotline: "moduleHotlineIcon",
  natalium: "moduleNataliumIcon",
  games: "moduleGamesIcon",
  utility: "moduleUtilityIcon"
};
for (const [slug, key] of Object.entries(explicitIconMappings)) {
  if (moduleCatalog.get(slug)?.iconImageKey !== key) throw new Error(`Module ${slug} received another module's icon key.`);
}
if (images.moduleAccountIcon || Object.values(images).some((image) => image.source === "assets/website/module-icons/account.png")) {
  throw new Error("PBB Account must not be introduced as an infrastructure icon.");
}

for (const item of productCatalog.modules) {
  const image = images[item.iconImageKey];
  for (const width of [96, 192, 256]) {
    const outputPath = fromRoot(`dist/assets/generated/module-icon-${item.slug}-${width}.webp`);
    if (!fs.existsSync(outputPath)) throw new Error(`Generated module icon is missing: ${item.slug} ${width}px.`);
    const metadata = await sharp(outputPath).metadata();
    if (metadata.format !== "webp" || metadata.width !== width || metadata.height !== width) {
      throw new Error(`Generated module icon has invalid format or dimensions: ${item.slug} ${width}px.`);
    }
    if (!metadata.hasAlpha) throw new Error(`Generated module icon lost transparency: ${item.slug} ${width}px.`);
  }
  if (!image || image.outputBase !== `module-icon-${item.slug}`) throw new Error(`Catalog module ${item.slug} has an invalid icon manifest mapping.`);
}

for (const file of walk(fromRoot("dist"), (entry) => entry.endsWith(".html"))) {
  const html = fs.readFileSync(file, "utf8");
  if (/module-(?:icon|icons)[^"']*\.(?:png|jpe?g)/i.test(html) || /assets\/website\/module-icons/i.test(html)) {
    throw new Error(`${file} contains a source raster module-icon reference.`);
  }
}
if (walk(fromRoot("dist"), (entry) => /(?:module-icons[/\\][^/\\]+|module-icon-[^/\\]+)\.(?:png|jpe?g)$/i.test(entry)).length) {
  throw new Error("Source module icon PNG/JPEG files must not be deployed.");
}

const hotlineIndex = fs.readFileSync(fromRoot("dist/modules/hotline/index.html"), "utf8");
const hotlineEvidence = [
  ["hotline-citizen-home-378.webp", 378, 668],
  ["hotline-citizen-operators-available-377.webp", 377, 668],
  ["hotline-operator-dashboard-current-1600.webp", 1917, 941],
  ["hotline-operator-workbench-1600.webp", 1915, 938],
  ["hotline-command-dashboard-1600.webp", 1915, 939],
  ["hotline-command-sitrep-viewer-1057.webp", 1057, 722],
  ["hotline-command-support-request-797.webp", 797, 657]
];
for (const [fileName, width, height] of hotlineEvidence) {
  if (!hotlineIndex.includes(fileName)) throw new Error(`Hotline page is missing generated evidence image ${fileName}.`);
  if (!hotlineIndex.includes(`width=\"${width}\"`) || !hotlineIndex.includes(`height=\"${height}\"`)) {
    throw new Error(`Hotline evidence dimensions are missing for ${fileName}.`);
  }
}

for (const item of productCatalog.modules) {
  const record = moduleRecords.get(item.slug);
  assertEvidenceSection({
    pagePath: `dist/modules/${item.slug}/index.html`,
    screenshots: record.screenshots,
    heading: "Validated product evidence",
    label: `Module ${item.slug}`
  });
}
for (const item of productCatalog.infrastructure) {
  const record = infrastructureRecords.get(item.slug);
  assertEvidenceSection({
    pagePath: `dist/infrastructure/${item.slug}/index.html`,
    screenshots: record.diagramsOrScreenshots,
    heading: "Validated implementation evidence",
    label: `Infrastructure component ${item.slug}`
  });
}
for (const slug of ["support", "natalium"]) {
  const html = fs.readFileSync(fromRoot(`dist/modules/${slug}/index.html`), "utf8");
  if (html.includes("Validated product evidence") || html.includes("screenshot-placeholder") || html.includes('aria-labelledby="screenshots"')) {
    throw new Error(`Module ${slug} must completely omit placeholder-only evidence.`);
  }
}
if ((hotlineIndex.match(/Validated product evidence/g) ?? []).length !== 1 || (hotlineIndex.match(/class="screenshot-card"/g) ?? []).length !== hotlineEvidence.length) {
  throw new Error(`Hotline / Vox must retain one approved evidence section with ${hotlineEvidence.length} screenshot cards.`);
}
if ((hotlineIndex.match(/data-screenshot-open/g) ?? []).length !== hotlineEvidence.length || !hotlineIndex.includes("data-screenshot-track") || !hotlineIndex.includes("data-screenshot-viewer") || !hotlineIndex.includes('data-screenshot-zoom="in"')) {
  throw new Error("Hotline / Vox evidence must provide a horizontal screenshot rail and a fullscreen pan-and-zoom viewer.");
}

const homeIndex = fs.readFileSync(fromRoot("dist/index.html"), "utf8");

const engagementPages = [
  { pagePath: "dist/index.html", route: "/", configKey: "homepage", h1: "Keeping communities connected, informed, served, and coordinated — online or offline.", contactName: null },
  { pagePath: "dist/briefing/index.html", route: "/briefing/", configKey: "briefing", h1: "Request a PBB briefing", contactName: "Request a PBB briefing" },
  { pagePath: "dist/pilot/index.html", route: "/pilot/", configKey: "pilot", h1: "Discuss a PBB pilot", contactName: "Discuss a PBB pilot" },
  { pagePath: "dist/partnerships/index.html", route: "/partnerships/", configKey: "partnership", h1: "Explore a PBB partnership", contactName: "Explore a PBB partnership" }
];
const decodedContactEmail = Buffer.from(site.contactEmailBase64, "base64").toString("utf8");
for (const engagement of engagementPages) {
  const config = engagementForms[engagement.configKey];
  const html = fs.readFileSync(fromRoot(engagement.pagePath), "utf8");
  const forms = [...html.matchAll(/<form class="briefing-form"[^>]*data-interest-form[^>]*>([\s\S]*?)<\/form>/g)];
  if (forms.length !== 1 || (html.match(/<form\b/g) ?? []).length !== 1) throw new Error(`${engagement.pagePath} must render exactly one shared engagement form.`);
  const formTag = forms[0][0].slice(0, forms[0][0].indexOf(">") + 1);
  const formBody = forms[0][1];
  for (const attribute of [`id="interestForm"`, `data-inquiry-type="${config.inquiryType}"`, `data-endpoint="${site.formEndpoint}"`, `data-email="${site.contactEmailBase64}"`, "novalidate"]) {
    if (!formTag.includes(attribute)) throw new Error(`${engagement.pagePath} form is missing shared configuration: ${attribute}`);
  }
  if (html.includes(decodedContactEmail)) throw new Error(`${engagement.pagePath} exposes the decoded fallback recipient.`);
  for (const name of ["role", "name", "org", "email", "updates"]) {
    if (!new RegExp(`name="${name}"`).test(formBody)) throw new Error(`${engagement.pagePath} is missing the shared ${name} field.`);
  }
  if (!formBody.includes("Send me Project Bantay Bayan updates")) throw new Error(`${engagement.pagePath} is missing the shared PBB updates label.`);
  if (formBody.includes("Send me pilot updates")) throw new Error(`${engagement.pagePath} retains the route-specific pilot updates label.`);
  for (const name of ["role", "name", "email"]) {
    if (!new RegExp(`(?:select|input|textarea)[^>]*name="${name}"[^>]*required`).test(formBody)) throw new Error(`${engagement.pagePath} ${name} must remain required.`);
    if (!formBody.includes(`aria-describedby="${name}-error"`) || !formBody.includes(`id="${name}-error" data-error-for="${name}"`)) throw new Error(`${engagement.pagePath} ${name} field lost its accessible error target.`);
  }
  const renderedFields = [...formBody.matchAll(/<(div|fieldset) class="field[^"]*" data-summary-field data-summary-label="([^"]+)" data-field-type="([^"]+)" data-field-name="([^"]+)"([^>]*)>/g)]
    .map((match) => ({ element: match[1], summaryLabel: match[2], type: match[3], name: match[4], attributes: match[5], index: match.index }));
  if (renderedFields.length !== config.fields.length) throw new Error(`${engagement.pagePath} rendered ${renderedFields.length} configured fields; expected ${config.fields.length}.`);
  config.fields.forEach((field, index) => {
    const rendered = renderedFields[index];
    if (!rendered || rendered.name !== field.name || rendered.type !== field.type || rendered.summaryLabel !== field.summaryLabel) throw new Error(`${engagement.pagePath} field ${index + 1} does not match configured order and metadata.`);
    if ((rendered.attributes.includes('data-required="true"')) !== field.required) throw new Error(`${engagement.pagePath} ${field.name} has the wrong configured required metadata.`);
    const endToken = field.type === "checkbox-group" ? "</fieldset>" : "</div>";
    const fieldMarkup = formBody.slice(rendered.index, formBody.indexOf(endToken, rendered.index) + endToken.length);
    if (!fieldMarkup.includes(`id="${field.id}-error" data-error-for="${field.name}"`) || !fieldMarkup.includes(`aria-describedby="${field.id}-error"`)) throw new Error(`${engagement.pagePath} ${field.name} lost its accessible error target.`);
    if (field.type === "checkbox-group") {
      if (rendered.element !== "fieldset" || !fieldMarkup.includes(`<legend>${field.label}</legend>`)) throw new Error(`${engagement.pagePath} ${field.name} must use fieldset and legend semantics.`);
      for (const [optionIndex, option] of field.options.entries()) {
        if (!fieldMarkup.includes(`id="${field.id}-${optionIndex + 1}" name="${field.name}" type="checkbox" value="${option}"`) || !fieldMarkup.includes(`<span>${option}</span>`)) throw new Error(`${engagement.pagePath} ${field.name} is missing configured checkbox option ${option}.`);
      }
    } else {
      if (!fieldMarkup.includes(`<label for="${field.id}">${field.label}</label>`)) throw new Error(`${engagement.pagePath} ${field.name} is missing its configured label.`);
      const control = fieldMarkup.match(new RegExp(`<(?:input|select|textarea)[^>]*id="${field.id}"[^>]*name="${field.name}"[^>]*>`))?.[0];
      if (!control) throw new Error(`${engagement.pagePath} ${field.name} is missing its configured control.`);
      if (control.includes(" required") !== field.required) throw new Error(`${engagement.pagePath} ${field.name} required attribute does not match configuration.`);
    }
  });
  if (engagement.configKey === "homepage") {
    if (!formBody.includes('name="messageInput"') || !formBody.includes('id="messageInput"') || !formBody.includes('data-summary-label="Message"')) throw new Error("Homepage must retain its compact required message field.");
  } else if (formBody.includes('name="message"') || formBody.includes('name="messageInput"')) {
    throw new Error(`${engagement.pagePath} must not render the generic message textarea.`);
  }
  if (!formBody.includes(`<button class="button" type="submit">${config.submitLabel}</button>`)) throw new Error(`${engagement.pagePath} has the wrong configured submit label.`);
  for (const warning of ["emergency reports", "patient or health records", "operational feeds", "credentials", "sensitive case material", "protected or confidential information", "not an emergency-response channel", "deployment-specific", "security, privacy, governance, field acceptance, or owner approval"]) {
    if (!html.includes(warning)) throw new Error(`${engagement.pagePath} is missing shared safety language: ${warning}`);
  }
  if (!html.includes(`<h1 id="page-title">${engagement.h1}</h1>`) && !html.includes(`<h1 id="home-title">${engagement.h1}</h1>`)) throw new Error(`${engagement.pagePath} has the wrong H1.`);
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const contactPages = jsonLd.filter((entry) => entry["@type"] === "ContactPage");
  if (engagement.contactName) {
    if (contactPages.length !== 1 || contactPages[0].name !== engagement.contactName || contactPages[0].url !== `${site.url}${engagement.route}`) throw new Error(`${engagement.pagePath} has invalid ContactPage structured data.`);
  } else if (contactPages.length) throw new Error("Homepage must retain Organization structured data rather than gaining ContactPage data.");
}

const formSource = fs.readFileSync(fromRoot("src/templates/components/ui.njk"), "utf8");
if ((formSource.match(/<form class="briefing-form"/g) ?? []).length !== 1) throw new Error("The shared UI component must own the only engagement form implementation.");
for (const pageFile of walk(fromRoot("src/pages"), (entry) => entry.endsWith(".njk"))) {
  if (fs.readFileSync(pageFile, "utf8").includes('<form class="briefing-form"')) throw new Error(`${pageFile} duplicates the shared engagement form markup.`);
}
const clientSource = fs.readFileSync(fromRoot("src/assets/site.js"), "utf8");
for (const contract of ["const summaryFields", "const buildMessage", "values.message = buildMessage(data)", "inquiryType,", "page: window.location.href", "ts: new Date().toISOString()", "Briefing request", "Pilot discussion", "Partnership inquiry", "Inquiry type: ${fallbackLabels[inquiryType]}", "PBB updates: ${values.updates}"]) {
  if (!clientSource.includes(contract)) throw new Error(`Shared form client lost required intent behavior: ${contract}`);
}
if (clientSource.includes("Pilot updates: ${values.updates}")) throw new Error("Shared form fallback retains the route-specific pilot updates label.");
const submitImplementations = walk(fromRoot("src/assets"), (entry) => entry.endsWith(".js")).reduce((count, file) => count + (fs.readFileSync(file, "utf8").match(/addEventListener\("submit"/g) ?? []).length, 0);
if (submitImplementations !== 1) throw new Error(`The site must contain one engagement validation/submission implementation; received ${submitImplementations}.`);
const validationFocusImplementations = clientSource.match(/const focusFirstInvalidField =/g) ?? [];
if (validationFocusImplementations.length !== 1) throw new Error(`The site must contain one shared validation-focus implementation; received ${validationFocusImplementations.length}.`);
for (const contract of [
  'form.querySelector(\'input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]\')',
  "target.focus({ preventScroll: true })",
  'getPropertyValue("--sticky-header-offset")',
  'root.style.scrollBehavior = "auto"',
  'behavior: "auto"',
  "root.style.scrollBehavior = previousScrollBehavior",
  "if (honeypot.value.trim()) return;",
  "focusFirstInvalidField();"
]) {
  if (!clientSource.includes(contract)) throw new Error(`Shared validation-focus behavior is missing: ${contract}`);
}
if ((clientSource.match(/focusFirstInvalidField\(\);/g) ?? []).length !== 1) throw new Error("Shared validation focus must be invoked exactly once.");
const footerContract = '<nav aria-label="Connect"><strong>Connect</strong><a href="/briefing/">Request a briefing</a><a href="/pilot/">Discuss a pilot</a><a href="/partnerships/">Partnership inquiries</a></nav>';
if (!homeIndex.includes(footerContract)) throw new Error("Footer Connect links must use the three distinct engagement routes.");
if (!homeIndex.includes('<a href="/briefing/" class="button button-small">Request briefing</a>')) throw new Error("Primary Request briefing navigation must remain on /briefing/.");
const stakeholderImages = ["citizens", "barangays", "businesses", "lgus", "health", "utilities", "schools", "donors"];
for (const image of stakeholderImages) {
  const tag = homeIndex.match(new RegExp(`<img[^>]*stakeholder-${image}-320\\.webp[^>]*>`))?.[0];
  if (!tag) throw new Error(`Homepage is missing the generated stakeholder WebP: ${image}.`);
  for (const attribute of ['width="1254"', 'height="1254"', 'alt=""', 'loading="lazy"', 'decoding="async"']) {
    if (!tag.includes(attribute)) throw new Error(`Homepage stakeholder image ${image} is missing required image behavior: ${attribute}`);
  }
}
for (const slug of ["hotline", "natalium", "salus", "chat", "library", "learning", "utility", "support"]) {
  const card = homeIndex.match(new RegExp(`<article class="module-card" id="module-${slug}">([\\s\\S]*?)<\\/article>`))?.[1];
  if (!card) throw new Error(`Homepage is missing featured module card ${slug}.`);
  assertModuleCardStructure({ card, item: moduleCatalog.get(slug), label: "Homepage featured card" });
}

const modulesIndex = fs.readFileSync(fromRoot("dist/modules/index.html"), "utf8");
const modulesHeroTag = modulesIndex.match(/<img[^>]*modules-overview-hero-1774\.webp[^>]*>/)?.[0];
if (!modulesHeroTag) throw new Error("Modules overview is missing its generated decorative hero WebP.");
for (const width of [640, 960, 1440, 1774]) {
  if (!modulesHeroTag.includes(`modules-overview-hero-${width}.webp ${width}w`)) throw new Error(`Modules overview hero is missing its ${width}px responsive WebP candidate.`);
}
for (const attribute of ['sizes="100vw"', 'width="1774"', 'height="887"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
  if (!modulesHeroTag.includes(attribute)) throw new Error(`Modules overview hero is missing required image behavior: ${attribute}`);
}
if (!modulesIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !modulesIndex.includes('class="page-hero-media" aria-hidden="true"')) {
  throw new Error("Modules overview is missing the reusable decorative page-hero layer.");
}
if (!modulesIndex.includes("<h1 id=\"page-title\">PBB modules</h1>") || !modulesIndex.includes("Explore the services communities can use locally for emergencies, health, communication, engagement, learning, utilities, and node operations.")) {
  throw new Error("Modules overview hero lost its pre-rendered heading or description.");
}
if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|\")/i.test(modulesIndex)) throw new Error("Modules overview contains a PNG/JPEG img reference.");
if (modulesIndex.includes("module-hero-identity") || modulesIndex.includes("module-hero-copy")) throw new Error("Modules overview must not receive module-detail identity markup.");
for (const item of productCatalog.modules) {
  const card = modulesIndex.match(new RegExp(`<article class="module-card" id="module-${item.slug}">([\\s\\S]*?)<\\/article>`))?.[1];
  if (!card) throw new Error(`Modules overview is missing module card ${item.slug}.`);
  assertModuleCardStructure({ card, item, label: "Modules overview card" });
}
for (const item of productCatalog.infrastructure) {
  const card = modulesIndex.match(new RegExp(`<article class="infrastructure-card" id="infrastructure-${item.slug}">([\\s\\S]*?)<\\/article>`))?.[1];
  if (!card) throw new Error(`Modules overview is missing infrastructure card ${item.slug}.`);
  if (card.includes("module-icon-image") || card.includes("module-card-icon") || card.includes("module-card-identity")) throw new Error(`Infrastructure card ${item.slug} must remain free of module identity and icon markup.`);
}

const partnershipsIndex = fs.readFileSync(fromRoot("dist/partnerships/index.html"), "utf8");
const partnershipsHeroTag = partnershipsIndex.match(/<img[^>]*partnerships-hero-1774\.webp[^>]*>/)?.[0];
if (!partnershipsHeroTag) throw new Error("Partnerships is missing its generated decorative hero WebP.");
for (const width of [640, 960, 1440, 1774]) {
  if (!partnershipsHeroTag.includes(`partnerships-hero-${width}.webp ${width}w`)) throw new Error(`Partnerships hero is missing its ${width}px responsive WebP candidate.`);
}
for (const attribute of ['sizes="100vw"', 'width="1774"', 'height="887"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
  if (!partnershipsHeroTag.includes(attribute)) throw new Error(`Partnerships hero is missing required image behavior: ${attribute}`);
}
if (!partnershipsIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !partnershipsIndex.includes('class="page-hero-media" aria-hidden="true"')) {
  throw new Error("Partnerships is missing the reusable right-focal decorative page-hero layer.");
}
if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|")/i.test(partnershipsIndex) || partnershipsIndex.includes("assets/website/page-heroes/partnerships.png")) {
  throw new Error("Partnerships references its source PNG instead of generated WebP output.");
}
if (fs.existsSync(fromRoot("dist/assets/website/page-heroes/partnerships.png"))) throw new Error("Partnerships source PNG must not be deployed.");
const partnershipHeroPages = walk(fromRoot("dist"), (entry) => entry.endsWith(".html"))
  .filter((file) => fs.readFileSync(file, "utf8").includes("partnerships-hero-1774.webp"));
if (partnershipHeroPages.length !== 1 || path.resolve(partnershipHeroPages[0]) !== path.resolve(fromRoot("dist/partnerships/index.html"))) {
  throw new Error("Partnerships hero must render only on /partnerships/.");
}

const briefingIndex = fs.readFileSync(fromRoot("dist/briefing/index.html"), "utf8");
const briefingHeroTag = briefingIndex.match(/<img[^>]*briefing-hero-1672\.webp[^>]*>/)?.[0];
if (!briefingHeroTag) throw new Error("Briefing is missing its generated decorative hero WebP.");
for (const width of [640, 960, 1440, 1672]) {
  if (!briefingHeroTag.includes(`briefing-hero-${width}.webp ${width}w`)) throw new Error(`Briefing hero is missing its ${width}px responsive WebP candidate.`);
}
for (const attribute of ['sizes="100vw"', 'width="1672"', 'height="941"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
  if (!briefingHeroTag.includes(attribute)) throw new Error(`Briefing hero is missing required image behavior: ${attribute}`);
}
if (!briefingIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !briefingIndex.includes('class="page-hero-media" aria-hidden="true"')) {
  throw new Error("Briefing is missing the reusable right-focal decorative page-hero layer.");
}
if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|")/i.test(briefingIndex) || briefingIndex.includes("assets/website/page-heroes/briefing.png")) {
  throw new Error("Briefing references its source PNG instead of generated WebP output.");
}
if (fs.existsSync(fromRoot("dist/assets/website/page-heroes/briefing.png"))) throw new Error("Briefing source PNG must not be deployed.");
const briefingHeroPages = walk(fromRoot("dist"), (entry) => entry.endsWith(".html"))
  .filter((file) => fs.readFileSync(file, "utf8").includes("briefing-hero-1672.webp"));
if (briefingHeroPages.length !== 1 || path.resolve(briefingHeroPages[0]) !== path.resolve(fromRoot("dist/briefing/index.html"))) {
  throw new Error("Briefing hero must render only on /briefing/.");
}

const pilotIndex = fs.readFileSync(fromRoot("dist/pilot/index.html"), "utf8");
const pilotHeroTag = pilotIndex.match(/<img[^>]*pilot-hero-1672\.webp[^>]*>/)?.[0];
if (!pilotHeroTag) throw new Error("Pilot is missing its generated decorative hero WebP.");
for (const width of [640, 960, 1440, 1672]) {
  if (!pilotHeroTag.includes(`pilot-hero-${width}.webp ${width}w`)) throw new Error(`Pilot hero is missing its ${width}px responsive WebP candidate.`);
}
for (const attribute of ['sizes="100vw"', 'width="1672"', 'height="941"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
  if (!pilotHeroTag.includes(attribute)) throw new Error(`Pilot hero is missing required image behavior: ${attribute}`);
}
if (!pilotIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !pilotIndex.includes('class="page-hero-media" aria-hidden="true"')) {
  throw new Error("Pilot is missing the reusable right-focal decorative page-hero layer.");
}
if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|")/i.test(pilotIndex) || pilotIndex.includes("assets/website/page-heroes/pilot.png")) {
  throw new Error("Pilot references its source PNG instead of generated WebP output.");
}
if (fs.existsSync(fromRoot("dist/assets/website/page-heroes/pilot.png"))) throw new Error("Pilot source PNG must not be deployed.");
const pilotHeroPages = walk(fromRoot("dist"), (entry) => entry.endsWith(".html"))
  .filter((file) => fs.readFileSync(file, "utf8").includes("pilot-hero-1672.webp"));
if (pilotHeroPages.length !== 1 || path.resolve(pilotHeroPages[0]) !== path.resolve(fromRoot("dist/pilot/index.html"))) {
  throw new Error("Pilot hero must render only on /pilot/.");
}

const deploymentIndex = fs.readFileSync(fromRoot("dist/deployment/index.html"), "utf8");
const deploymentHeroTag = deploymentIndex.match(/<img[^>]*deployment-hero-1906\.webp[^>]*>/)?.[0];
if (!deploymentHeroTag) throw new Error("Deployment is missing its generated decorative hero WebP.");
for (const width of [640, 960, 1440, 1906]) {
  if (!deploymentHeroTag.includes(`deployment-hero-${width}.webp ${width}w`)) throw new Error(`Deployment hero is missing its ${width}px responsive WebP candidate.`);
}
for (const attribute of ['sizes="100vw"', 'width="1906"', 'height="825"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
  if (!deploymentHeroTag.includes(attribute)) throw new Error(`Deployment hero is missing required image behavior: ${attribute}`);
}
if (!deploymentIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !deploymentIndex.includes('class="page-hero-media" aria-hidden="true"')) {
  throw new Error("Deployment is missing the reusable right-focal decorative page-hero layer.");
}
if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|")/i.test(deploymentIndex) || deploymentIndex.includes("assets/website/page-heroes/deployment.png")) {
  throw new Error("Deployment references its source PNG instead of generated WebP output.");
}
if (fs.existsSync(fromRoot("dist/assets/website/page-heroes/deployment.png"))) throw new Error("Deployment source PNG must not be deployed.");
const deploymentHeroPages = walk(fromRoot("dist"), (entry) => entry.endsWith(".html"))
  .filter((file) => fs.readFileSync(file, "utf8").includes("deployment-hero-1906.webp"));
if (deploymentHeroPages.length !== 1 || path.resolve(deploymentHeroPages[0]) !== path.resolve(fromRoot("dist/deployment/index.html"))) {
  throw new Error("Deployment hero must render only on /deployment/.");
}

const statusHeroIndex = fs.readFileSync(fromRoot("dist/status/index.html"), "utf8");
const statusHeroTag = statusHeroIndex.match(/<img[^>]*status-hero-1886\.webp[^>]*>/)?.[0];
if (!statusHeroTag) throw new Error("Status is missing its generated decorative hero WebP.");
for (const width of [640, 960, 1440, 1886]) {
  if (!statusHeroTag.includes(`status-hero-${width}.webp ${width}w`)) throw new Error(`Status hero is missing its ${width}px responsive WebP candidate.`);
}
for (const attribute of ['sizes="100vw"', 'width="1886"', 'height="834"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
  if (!statusHeroTag.includes(attribute)) throw new Error(`Status hero is missing required image behavior: ${attribute}`);
}
if (!statusHeroIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !statusHeroIndex.includes('class="page-hero-media" aria-hidden="true"')) {
  throw new Error("Status is missing the reusable right-focal decorative page-hero layer.");
}
if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|")/i.test(statusHeroIndex) || statusHeroIndex.includes("assets/website/page-heroes/status.png")) {
  throw new Error("Status references its source PNG instead of generated WebP output.");
}
if (fs.existsSync(fromRoot("dist/assets/website/page-heroes/status.png"))) throw new Error("Status source PNG must not be deployed.");
const statusHeroPages = walk(fromRoot("dist"), (entry) => entry.endsWith(".html"))
  .filter((file) => fs.readFileSync(file, "utf8").includes("status-hero-1886.webp"));
if (statusHeroPages.length !== 1 || path.resolve(statusHeroPages[0]) !== path.resolve(fromRoot("dist/status/index.html"))) {
  throw new Error("Status hero must render only on /status/.");
}

const galleryHeroIndex = fs.readFileSync(fromRoot("dist/gallery/index.html"), "utf8");
const galleryHeroTag = galleryHeroIndex.match(/<img[^>]*gallery-hero-1915\.webp[^>]*>/)?.[0];
if (!galleryHeroTag) throw new Error("Gallery is missing its generated decorative hero WebP.");
for (const width of [640, 960, 1440, 1915]) {
  if (!galleryHeroTag.includes(`gallery-hero-${width}.webp ${width}w`)) throw new Error(`Gallery hero is missing its ${width}px responsive WebP candidate.`);
}
for (const attribute of ['sizes="100vw"', 'width="1915"', 'height="821"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
  if (!galleryHeroTag.includes(attribute)) throw new Error(`Gallery hero is missing required image behavior: ${attribute}`);
}
if (!galleryHeroIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !galleryHeroIndex.includes('class="page-hero-media" aria-hidden="true"')) {
  throw new Error("Gallery is missing the reusable right-focal decorative page-hero layer.");
}
if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|")/i.test(galleryHeroIndex) || galleryHeroIndex.includes("assets/website/page-heroes/gallery.png")) {
  throw new Error("Gallery references its source PNG instead of generated WebP output.");
}
if (fs.existsSync(fromRoot("dist/assets/website/page-heroes/gallery.png"))) throw new Error("Gallery source PNG must not be deployed.");
const galleryHeroPages = walk(fromRoot("dist"), (entry) => entry.endsWith(".html"))
  .filter((file) => fs.readFileSync(file, "utf8").includes("gallery-hero-1915.webp"));
if (galleryHeroPages.length !== 1 || path.resolve(galleryHeroPages[0]) !== path.resolve(fromRoot("dist/gallery/index.html"))) {
  throw new Error("Gallery hero must render only on /gallery/.");
}

const infrastructureIndex = fs.readFileSync(fromRoot("dist/infrastructure/index.html"), "utf8");
const infrastructureHeroTag = infrastructureIndex.match(/<img[^>]*infrastructure-overview-hero-1774\.webp[^>]*>/)?.[0];
if (!infrastructureHeroTag) throw new Error("Infrastructure overview is missing its generated decorative hero WebP.");
for (const width of [640, 960, 1440, 1774]) {
  if (!infrastructureHeroTag.includes(`infrastructure-overview-hero-${width}.webp ${width}w`)) throw new Error(`Infrastructure overview hero is missing its ${width}px responsive WebP candidate.`);
}
for (const attribute of ['sizes="100vw"', 'width="1774"', 'height="887"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
  if (!infrastructureHeroTag.includes(attribute)) throw new Error(`Infrastructure overview hero is missing required image behavior: ${attribute}`);
}
if (!infrastructureIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !infrastructureIndex.includes('class="page-hero-media" aria-hidden="true"')) {
  throw new Error("Infrastructure overview is missing the reusable decorative page-hero layer.");
}
if (!infrastructureIndex.includes("<h1 id=\"page-title\">PBB infrastructure</h1>") || !infrastructureIndex.includes("Seven shared services make PBB modules operate as one local platform. They are deployment infrastructure, not separate citizen applications.")) {
  throw new Error("Infrastructure overview hero lost its pre-rendered heading or description.");
}
if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|\")/i.test(infrastructureIndex)) throw new Error("Infrastructure overview contains a PNG/JPEG img reference.");
if (infrastructureIndex.includes("module-hero-identity") || infrastructureIndex.includes("module-hero-copy")) throw new Error("Infrastructure overview must not receive module identity markup.");
for (const item of productCatalog.infrastructure) {
  const card = infrastructureIndex.match(new RegExp(`<article class="infrastructure-card" id="infrastructure-${item.slug}">([\\s\\S]*?)<\\/article>`))?.[1];
  if (!card) throw new Error(`Infrastructure overview is missing infrastructure card ${item.slug}.`);
  if (card.includes("module-icon-image") || card.includes("module-card-icon") || card.includes("module-card-identity")) throw new Error(`Infrastructure overview card ${item.slug} must remain free of module identity and icon markup.`);
}

for (const slug of ["chat", "games", "hotline", "learning", "library", "natalium", "salus", "support", "utility"]) {
  const moduleIndex = fs.readFileSync(fromRoot(`dist/modules/${slug}/index.html`), "utf8");
  const heroTag = moduleIndex.match(new RegExp(`<img[^>]*module-${slug}-hero-1774\\.webp[^>]*>`))?.[0];
  if (!heroTag) throw new Error(`Module ${slug} is missing its generated decorative hero WebP.`);
  for (const width of [640, 960, 1440, 1774]) {
    if (!heroTag.includes(`module-${slug}-hero-${width}.webp ${width}w`)) throw new Error(`Module ${slug} hero is missing its ${width}px responsive WebP candidate.`);
  }
  for (const attribute of ['sizes="100vw"', 'width="1774"', 'height="887"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
    if (!heroTag.includes(attribute)) throw new Error(`Module ${slug} hero is missing required image behavior: ${attribute}`);
  }
  if (!moduleIndex.includes('class="page-hero module-hero page-hero-with-image page-hero-focal-right"') || !moduleIndex.includes('class="page-hero-media" aria-hidden="true"')) {
    throw new Error(`Module ${slug} is missing the reusable decorative page-hero layer.`);
  }
  const heroSection = moduleIndex.match(/<section class="page-hero module-hero[^>]*>([\s\S]*?)<\/section>/)?.[1];
  if ((heroSection?.match(/class="module-hero-icon"/g) ?? []).length !== 1) throw new Error(`Module ${slug} must render exactly one hero icon.`);
  if ((heroSection?.match(/class="module-hero-identity"/g) ?? []).length !== 1 || (heroSection?.match(/class="module-hero-copy"/g) ?? []).length !== 1) {
    throw new Error(`Module ${slug} is missing its module identity or copy wrapper.`);
  }
  if (!/<div class="module-hero-identity">[\s\S]*<div class="module-hero-copy">[\s\S]*<\/div>\s*<\/div>\s*<dl class="hero-facts">/.test(heroSection ?? "")) {
    throw new Error(`Module ${slug} fact cards must remain outside and below the identity wrapper.`);
  }
  assertModuleIconTag({ tag: moduleIconTag(heroSection ?? "", slug), slug, loading: "eager", sizes: "(max-width: 640px) 72px, (max-width: 1024px) 96px, 120px", label: `Module ${slug} hero` });
  if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|\")/i.test(moduleIndex)) throw new Error(`Module ${slug} contains a PNG/JPEG img reference.`);
}

for (const slug of ["account", "kit-setup", "landing", "maestro", "mapserver", "realtime", "relay"]) {
  const componentIndex = fs.readFileSync(fromRoot(`dist/infrastructure/${slug}/index.html`), "utf8");
  const heroTag = componentIndex.match(new RegExp(`<img[^>]*infrastructure-${slug}-hero-1774\\.webp[^>]*>`))?.[0];
  if (!heroTag) throw new Error(`Infrastructure component ${slug} is missing its generated decorative hero WebP.`);
  for (const width of [640, 960, 1440, 1774]) {
    if (!heroTag.includes(`infrastructure-${slug}-hero-${width}.webp ${width}w`)) throw new Error(`Infrastructure component ${slug} hero is missing its ${width}px responsive WebP candidate.`);
  }
  for (const attribute of ['sizes="100vw"', 'width="1774"', 'height="887"', 'alt=""', 'loading="eager"', 'decoding="async"', 'fetchpriority="high"']) {
    if (!heroTag.includes(attribute)) throw new Error(`Infrastructure component ${slug} hero is missing required image behavior: ${attribute}`);
  }
  if (!componentIndex.includes('class="page-hero page-hero-with-image page-hero-focal-right"') || !componentIndex.includes('class="page-hero-media" aria-hidden="true"')) {
    throw new Error(`Infrastructure component ${slug} is missing the reusable decorative page-hero layer.`);
  }
  if (componentIndex.includes("module-hero-identity") || componentIndex.includes("module-hero-copy")) throw new Error(`Infrastructure component ${slug} must not receive module identity markup.`);
  if (/<img[^>]+\.(?:png|jpe?g)(?:[?#]|\")/i.test(componentIndex)) throw new Error(`Infrastructure component ${slug} contains a PNG/JPEG img reference.`);
}

for (const file of walk(fromRoot("src/content/modules"), (entry) => entry.endsWith("module.json"))) {
  const module = JSON.parse(fs.readFileSync(file, "utf8"));
  assertRelatedInfrastructureCards({
    pagePath: `dist/modules/${module.slug}/index.html`,
    sectionId: "related-infrastructure",
    slugs: module.relatedInfrastructure,
    label: `Module ${module.slug}`
  });
  assertRelatedModuleIcons({ pagePath: `dist/modules/${module.slug}/index.html`, slugs: module.relatedModules, label: `Module ${module.slug}` });
}

for (const file of walk(fromRoot("src/content/infrastructure"), (entry) => entry.endsWith("component.json"))) {
  const component = JSON.parse(fs.readFileSync(file, "utf8"));
  assertRelatedInfrastructureCards({
    pagePath: `dist/infrastructure/${component.slug}/index.html`,
    sectionId: "related-components",
    slugs: component.relatedComponents,
    label: `Infrastructure component ${component.slug}`
  });
  assertRelatedModuleIcons({ pagePath: `dist/infrastructure/${component.slug}/index.html`, slugs: component.relatedModules, label: `Infrastructure component ${component.slug}` });
}

assertRelatedInfrastructureCards({
  pagePath: "dist/modules/hotline/index.html",
  sectionId: "related-infrastructure",
  slugs: ["relay", "realtime", "mapserver", "account"],
  label: "Hotline"
});
assertRelatedInfrastructureCards({
  pagePath: "dist/modules/natalium/index.html",
  sectionId: "related-infrastructure",
  slugs: ["account", "landing", "kit-setup"],
  label: "Natalium"
});
assertRelatedInfrastructureCards({
  pagePath: "dist/infrastructure/account/index.html",
  sectionId: "related-components",
  slugs: ["landing", "relay", "kit-setup"],
  label: "PBB Account"
});

const pageHeroMacroSource = fs.readFileSync(fromRoot("src/templates/components/ui.njk"), "utf8");
if (!pageHeroMacroSource.includes('{% if heroImage %} page-hero-with-image page-hero-focal-{{ heroFocalPosition }}{% endif %}') ||
    !pageHeroMacroSource.includes('{% if heroImage %}<div class="page-hero-media" aria-hidden="true">')) {
  throw new Error("The shared page-hero macro no longer keeps image classes and media conditional, which would break its gradient-only fallback path.");
}

for (const staticFile of ["CNAME", "robots.txt", ".well-known/pbb.json"]) {
  if (!fs.existsSync(fromRoot("dist", staticFile))) throw new Error(`Required static output is missing: ${staticFile}`);
}

const sitemap = fs.readFileSync(fromRoot("dist/sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length !== 25) throw new Error(`Sitemap should contain 25 preferred public URLs, received ${sitemapUrls.length}.`);
for (const route of ["/briefing/", "/pilot/", "/partnerships/"]) {
  const url = `${site.url}${route}`;
  if (sitemapUrls.filter((entry) => entry === url).length !== 1) throw new Error(`Sitemap must contain ${url} exactly once.`);
}
for (const forbidden of ["/gallery.html", "/deployment-model.html", "/404.html"]) {
  if (sitemap.includes(forbidden)) throw new Error(`Sitemap must not include compatibility or error route: ${forbidden}`);
}

const generatedHtmlPages = walk(fromRoot("dist"), (entry) => entry.endsWith(".html"));
if (generatedHtmlPages.length !== 28) throw new Error(`Generated output should contain 28 HTML pages, received ${generatedHtmlPages.length}.`);

console.log("Phase 3 output assertions passed: public content, metadata routes, sitemap, 404, and legacy compatibility pages are present with required boundaries.");
