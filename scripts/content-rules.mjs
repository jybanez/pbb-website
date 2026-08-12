const valueAt = (record, path) => path.split(".").reduce((value, key) => value?.[key], record);

export const catalogConsistencyErrors = ({ kind, file, record, catalogItem }) => {
  if (!catalogItem) {
    return [`${file} is missing from the ${kind === "module" ? "module" : "infrastructure"} catalog.`];
  }

  const fields = kind === "module"
    ? [
        ["name", "name", "name"],
        ["productName", "productName", "product name"],
        ["productFamily", "family", "product family"],
        ["category", "category", "category"],
        ["readiness.status", "status", "primary readiness status"]
      ]
    : [["name", "name", "name"]];

  return fields.flatMap(([recordPath, catalogField, label]) =>
    valueAt(record, recordPath) === catalogItem[catalogField]
      ? []
      : [`${file} conflicts with catalog ${label}.`]
  );
};

export const duplicateIdErrors = (file, collections) => collections.flatMap(([label, items]) => {
  const ids = (items ?? []).map((item) => item.id);
  return new Set(ids).size === ids.length ? [] : [`${file} has duplicate ${label}.`];
});

export const relationshipErrors = (file, relationships) => relationships.flatMap(({ label, slugs, allowed }) =>
  (slugs ?? []).flatMap((slug) => allowed.includes(slug) ? [] : [`${file} references unknown ${label}: ${slug}`])
);

export const HERO_FOCAL_POSITIONS = ["left", "center", "right", "far-right"];

export const imageFocalPositionErrors = (key, image) =>
  image.heroFocalPosition === undefined || HERO_FOCAL_POSITIONS.includes(image.heroFocalPosition)
    ? []
    : [`Image manifest entry ${key} has unsupported heroFocalPosition: ${image.heroFocalPosition}.`];

export const heroImageReferenceErrors = ({ file, key, images }) => {
  const image = images[key];
  if (!image) return [`${file} references unknown hero image key: ${key}`];
  return image.alt === "" ? [] : [`${file} hero image ${key} must be decorative with empty alt text.`];
};

export const moduleIconCatalogErrors = ({ modules, images }) => {
  const errors = [];
  const keys = [];
  const outputBases = [];
  for (const module of modules) {
    const key = module.iconImageKey;
    if (typeof key !== "string" || !key) {
      errors.push(`Catalog module ${module.slug} is missing iconImageKey.`);
      continue;
    }
    keys.push(key);
    const image = images[key];
    if (!image) {
      errors.push(`Catalog module ${module.slug} references unknown icon image key: ${key}.`);
      continue;
    }
    outputBases.push(image.outputBase);
    if (image.source !== `assets/website/module-icons/${module.slug}.png`) {
      errors.push(`Catalog module ${module.slug} icon source does not match its approved source file.`);
    }
    if (image.outputBase !== `module-icon-${module.slug}`) {
      errors.push(`Catalog module ${module.slug} icon output basename is incorrect.`);
    }
    if (image.alt !== "") errors.push(`Catalog module ${module.slug} icon must have empty alt text.`);
    if (JSON.stringify(image.widths) !== JSON.stringify([96, 192, 256]) || image.largestWidth !== 256) {
      errors.push(`Catalog module ${module.slug} icon must declare 96, 192, and 256 pixel variants.`);
    }
    if (!Number.isInteger(image.width) || image.width < 256 || !Number.isInteger(image.height) || image.height < 256) {
      errors.push(`Catalog module ${module.slug} icon dimensions are invalid or would require upscaling.`);
    }
    if (image.nearLossless !== true) errors.push(`Catalog module ${module.slug} icon must use near-lossless WebP output.`);
  }
  if (new Set(keys).size !== keys.length) errors.push("Catalog module iconImageKey values must be unique.");
  if (new Set(outputBases).size !== outputBases.length) errors.push("Catalog module icon output basenames must be unique.");
  if (Object.values(images).some((image) => image.source === "assets/website/module-icons/account.png")) {
    errors.push("PBB Account must not be registered as an infrastructure icon yet.");
  }
  return errors;
};

export const screenshotErrors = ({ file, screenshots, images, sourceExists }) =>
  (screenshots ?? []).flatMap((screenshot) => {
    if (screenshot.type !== "image") return [];
    const errors = [];
    if (!sourceExists(screenshot.src)) errors.push(`${file} declares missing screenshot: ${screenshot.src}`);
    const configured = images[screenshot.imageKey];
    if (!configured) {
      errors.push(`${file} references unknown image key: ${screenshot.imageKey}`);
      return errors;
    }
    if (configured.source !== screenshot.src) errors.push(`${file} screenshot source conflicts with image manifest.`);
    if (configured.width !== screenshot.width || configured.height !== screenshot.height) {
      errors.push(`${file} screenshot dimensions conflict with image manifest.`);
    }
    return errors;
  });

export const approvedScreenshots = (screenshots, images) =>
  (Array.isArray(screenshots) ? screenshots : []).filter((screenshot) =>
    screenshot?.type === "image"
    && typeof screenshot.imageKey === "string"
    && screenshot.imageKey.length > 0
    && Boolean(images?.[screenshot.imageKey]));

export const seoUniquenessErrors = (records) => {
  const errors = [];
  for (const [field, label] of [["title", "title"], ["description", "description"]]) {
    const occurrences = new Map();
    for (const record of records) {
      const value = record.seo?.[field];
      if (typeof value !== "string") continue;
      occurrences.set(value, [...(occurrences.get(value) ?? []), record.file]);
    }
    for (const [value, files] of occurrences) {
      if (files.length > 1) errors.push(`SEO ${label} must be unique; ${files.join(", ")} share ${JSON.stringify(value)}.`);
    }
  }
  return errors;
};
