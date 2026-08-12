import { createHash } from "node:crypto";

export const IMAGE_PIPELINE_VERSION = 2;

export const imageTransformSignature = ({ image, width, sourceHash, engineVersion }) => createHash("sha256")
  .update(JSON.stringify({
    pipelineVersion: IMAGE_PIPELINE_VERSION,
    engineVersion,
    sourceHash,
    source: image.source,
    outputBase: image.outputBase,
    width,
    resize: { withoutEnlargement: true, autoRotate: true },
    format: "webp",
    webp: {
      quality: image.quality,
      nearLossless: image.nearLossless === true,
      smartSubsample: true
    }
  }))
  .digest("hex");

export const galleryTransformSignature = ({ sourceHash, engineVersion, variant, quality, nearLossless }) => createHash("sha256")
  .update(JSON.stringify({
    pipelineVersion: IMAGE_PIPELINE_VERSION,
    engineVersion,
    sourceHash,
    variant,
    format: "webp",
    webp: { quality, nearLossless, smartSubsample: true }
  }))
  .digest("hex");
