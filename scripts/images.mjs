import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { fromRoot, readJson } from "./lib.mjs";
import { IMAGE_PIPELINE_VERSION, galleryTransformSignature, imageTransformSignature } from "./image-cache.mjs";

const images = readJson("src/data/images.json");
const outputDirectory = fromRoot("src/assets/generated");
const cacheDirectory = fromRoot(".cache");
const cachePath = path.join(cacheDirectory, "image-pipeline.json");
await fs.mkdir(outputDirectory, { recursive: true });
await fs.mkdir(cacheDirectory, { recursive: true });

const cache = await fs.readFile(cachePath, "utf8")
  .then((contents) => JSON.parse(contents))
  .catch(() => ({ variants: {} }));
const nextCache = { pipelineVersion: IMAGE_PIPELINE_VERSION, variants: {} };

let generated = 0;
let cached = 0;

for (const [key, image] of Object.entries(images)) {
  const sourcePath = fromRoot(image.source);
  const sourceHash = createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex");

  for (const width of image.widths) {
    const outputName = `${image.outputBase}-${width}.webp`;
    const outputPath = path.join(outputDirectory, outputName);
    const outputStat = await fs.stat(outputPath).catch(() => null);
    const signature = imageTransformSignature({
      image, width, sourceHash, engineVersion: sharp.versions.sharp
    });
    nextCache.variants[outputName] = { signature };
    if (outputStat && cache.variants?.[outputName]?.signature === signature) {
      cached += 1;
      continue;
    }

    const webpOptions = image.nearLossless
      ? { quality: image.quality, nearLossless: true, smartSubsample: true }
      : { quality: image.quality, smartSubsample: true };

    await sharp(sourcePath)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp(webpOptions)
      .toFile(outputPath);
    generated += 1;
  }
  console.log(`Image ready: ${key}`);
}

const galleryRoot = fromRoot("assets/gallery");
const gallerySources = [];
const galleryDimensions = {};
const collectGallerySources = async (directory) => {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "thumbs") await collectGallerySources(entryPath);
    } else if (/\.(?:png|jpe?g)$/i.test(entry.name)) {
      gallerySources.push(entryPath);
    }
  }
};
await collectGallerySources(galleryRoot);

for (const sourcePath of gallerySources) {
  const relativeSource = path.relative(galleryRoot, sourcePath);
  const directory = path.dirname(relativeSource);
  const baseName = path.basename(relativeSource, path.extname(relativeSource));
  const sourceHash = createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex");
  const nearLossless = directory.split(path.sep).includes("screenshots");
  const quality = nearLossless ? 92 : 84;
  const webpOptions = { quality, nearLossless, smartSubsample: true };
  const variants = [
    {
      outputPath: path.join(galleryRoot, directory, `${baseName}.webp`),
      variant: { kind: "gallery-full", resize: null },
      transform: (pipeline) => pipeline
    },
    {
      outputPath: path.join(galleryRoot, "thumbs", directory, `${baseName}-thumb.webp`),
      variant: { kind: "gallery-thumb", resize: { width: 640, height: 640, fit: "inside", withoutEnlargement: true } },
      transform: (pipeline) => pipeline.resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
    }
  ];

  for (const entry of variants) {
    await fs.mkdir(path.dirname(entry.outputPath), { recursive: true });
    const cacheKey = path.relative(fromRoot("assets"), entry.outputPath).split(path.sep).join("/");
    const signature = galleryTransformSignature({
      sourceHash, engineVersion: sharp.versions.sharp, variant: entry.variant, quality, nearLossless
    });
    nextCache.variants[cacheKey] = { signature };
    const outputStat = await fs.stat(entry.outputPath).catch(() => null);
    if (outputStat && cache.variants?.[cacheKey]?.signature === signature) {
      cached += 1;
      continue;
    }
    await entry.transform(sharp(sourcePath).rotate()).webp(webpOptions).toFile(entry.outputPath);
    generated += 1;
  }
  const fullPath = variants[0].outputPath;
  const thumbPath = variants[1].outputPath;
  const [fullMetadata, thumbMetadata] = await Promise.all([sharp(fullPath).metadata(), sharp(thumbPath).metadata()]);
  const fullKey = path.relative(fromRoot(), fullPath).split(path.sep).join("/");
  galleryDimensions[encodeURI(fullKey)] = {
    fullWidth: fullMetadata.width,
    fullHeight: fullMetadata.height,
    thumbWidth: thumbMetadata.width,
    thumbHeight: thumbMetadata.height
  };
}
console.log(`Gallery ready: ${gallerySources.length} source images, ${gallerySources.length * 2} WebP outputs.`);

await fs.writeFile(
  path.join(outputDirectory, "gallery-dimensions.js"),
  `window.PBBGalleryDimensions = ${JSON.stringify(galleryDimensions, null, 2)};\n`,
  "utf8"
);

await fs.writeFile(cachePath, `${JSON.stringify(nextCache, null, 2)}\n`, "utf8");

console.log(`WebP pipeline complete: ${generated} generated, ${cached} reused from cache.`);
