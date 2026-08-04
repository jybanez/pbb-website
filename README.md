# Project Bantay Bayan public website

This repository contains the public-facing website for Project Bantay Bayan (PBB), an offline-first, local-node-first community resilience platform. The site uses Eleventy to produce ordinary, pre-rendered HTML that can be served by GitHub Pages, Apache, or another static host.

The three-phase refactor establishes the shared architecture, structured public content, and production-verification contracts. The implementation includes:

- the executive homepage;
- the Modules overview and formal category hierarchy;
- all nine module detail pages;
- the infrastructure overview and seven Wizaya Server Suite component pages;
- clean Deployment, Status, Briefing, and Gallery routes;
- shared Nunjucks layouts and components for module and infrastructure content;
- controlled JSON data and JSON Schema validation;
- a cached responsive WebP pipeline for shared imagery and the complete Gallery;
- generated metadata, structured data, sitemap, 404, and legacy compatibility pages;
- output, metadata, image, sitemap, and internal-link validation.

Project-owner approval of launch claims and post-deployment verification on the production host remain release controls rather than build tasks.

## Requirements

- Node.js 22
- npm 10 or newer

Dependencies are pinned exactly in `package.json` and locked in `package-lock.json`.

## Commands

```powershell
npm ci
npm run dev
npm run validate
npm run build
npm run check:links
npm test
```

`npm run dev` generates WebP assets and starts Eleventy's local server. `npm run build` removes only the disposable `dist/` directory, refreshes changed image variants, validates structured content, builds the static site, and checks generated links, metadata, sitemap membership, and assets. `npm test` repeats the semantic and production-build checks and asserts the required Phase 3 routes, public boundaries, 404, sitemap, and compatibility pages.

## Source structure

```text
src/
  content/modules/{slug}/module.json
  content/infrastructure/{slug}/component.json
  data/                         controlled vocabularies, catalog, site and image data
  templates/layouts/            shared base, module and infrastructure layouts
  templates/components/         navigation, cards, badges, workflow, gallery, FAQ, related items, CTA
  pages/                        Eleventy entry templates
  assets/                       new site CSS/JS and generated WebP cache
schemas/                        module, infrastructure component and shared JSON Schemas
scripts/                        image, content, output and regression checks
dist/                           disposable generated output
```

The legacy root HTML, CSS, JavaScript, gallery data, gallery source assets, vendored Helper runtime, `.well-known`, `CNAME`, and `robots.txt` remain in the repository. The generated artifact uses `/gallery/` and `/deployment/` as preferred routes and emits lightweight `/gallery.html` and `/deployment-model.html` compatibility redirects. `/index.html` is the generated homepage and canonically identifies `/`.

## Editing a module

Each implemented module has one `src/content/modules/{slug}/module.json`. The module schema requires:

- a controlled category, readiness status, optional qualifier, and deployment classification;
- plain text only—raw HTML is rejected;
- explicit local capabilities, required local services, connectivity-dependent behavior, confirmed selective synchronization, and what is not synchronized;
- unique workflow, screenshot, and FAQ IDs;
- five to eight practical FAQs;
- validated module and infrastructure references;
- a unique SEO title and description.

Run `npm run validate` after every content change. The build fails on unknown vocabulary values, missing fields, duplicate identifiers, missing image sources or alt text, unresolved relationships, unsupported raw HTML, incorrect image dimensions, or drift between module detail metadata and the catalog's name, product name, family, category, or primary readiness status.

To add a new module, add its controlled entry to `src/data/product-catalog.json`, create `src/content/modules/{slug}/module.json`, use only values defined in the category/readiness/deployment data, and add any approved image source to `src/data/images.json`. The paginated module template creates the clean detail route automatically. Run `npm run validate` and `npm test`; do not publish a new readiness or integration claim without evidence review.

## Adding an infrastructure component

Each infrastructure service has one `src/content/infrastructure/{slug}/component.json` that conforms to `schemas/infrastructure-component.schema.json` and matches its controlled catalog entry. Validation requires catalog membership and name consistency, known supported/related module and component slugs, unique screenshot and FAQ IDs, image-manifest/source consistency, and SEO metadata unique across every module and infrastructure detail record. The schema keeps component content focused on node role, supported modules, local and connectivity-dependent behavior, operational considerations, security boundaries, and careful readiness wording.

`supportedModules` means confirmed current integration only. Put broader architectural relationships in `relatedModules`; planned packaging or an unverified path must never be presented in the confirmed list.

## Images and WebP generation

Original PNG/JPEG files remain source-only inputs outside generated `dist/`. `src/data/images.json` records shared source files, verified dimensions, responsive widths, output basenames, quality, and alt text. `npm run images` writes shared variants to `src/assets/generated/` and creates a full WebP plus a bounded thumbnail WebP for every Gallery source. Its ignored `.cache/image-pipeline.json` records signatures derived from source bytes, transformation settings, Sharp version, and pipeline version; a variant is reused only when its file and exact signature remain valid. Screenshot text uses near-lossless settings; photographs and illustrations use high-quality lossy WebP. Templates emit `srcset`, `sizes`, explicit width/height, lazy loading below the fold, and manifest alt text.

Decorative page-hero images may set `heroFocalPosition` to the controlled values `left`, `center`, `right`, or `far-right`; omission defaults to `center`. Pass the manifest key as the optional fifth argument to the shared `pageHero` macro. Validation rejects arbitrary CSS positions, while the named classes map each token to reviewed desktop, tablet, and mobile crops.

To add a real module or infrastructure screenshot, preserve its PNG/JPEG source, add it to `src/data/images.json`, declare matching source, key, dimensions, caption, and alt text in the record, then run `npm run validate` and `npm run images`. Placeholder records may preserve future-approval context in source, but they are not public evidence and do not render an evidence section. Empty screenshot collections are also valid.

SVG files should remain SVG. The favicon PNGs and 1200×630 Open Graph PNG remain compatibility exceptions.

## Briefing form

The homepage and the `/briefing/`, `/pilot/`, and `/partnerships/` engagement routes use one shared Nunjucks form component and one client-side validation/submission implementation. Their controlled page-specific fields and display/summary order live in `src/data/engagement-forms.json`; validation rejects unknown field types, invalid intent mappings, duplicate IDs or names, invalid options, and malformed field definitions.

All four surfaces use the same configured Formspree endpoint. Common contact and routing properties remain separate in the JSON request: role, name, organization, email, pilot-update preference, controlled inquiry type, current page URL, and timestamp. The configured structured fields are merged in memory into one readable `message` value in configuration order. Empty optional values are omitted, checkbox labels are joined readably, and visible controls are not overwritten during message construction.

- JSON submission to `https://formspree.io/f/xpqprldj`;
- dynamically injected honeypot field;
- required-field and email validation;
- accessible inline status feedback;
- runtime-decoded `mailto:` fallback when Formspree is unavailable, with the selected intent and the same formatted message in its subject and body.

Automated browser checks mock Formspree success and failure responses and never send a real submission.

## Deployment

`.github/workflows/deploy-pages.yml` runs the complete `npm test` suite, uploads only `dist/`, and deploys only after every semantic, build, metadata, sitemap, image, link, and Phase 3 output assertion succeeds. `CNAME`, `robots.txt`, and `.well-known` are copied into the artifact.

`.well-known/pbb.json` is a required source file and is deliberately not ignored. Include it when staging the implementation; a checkout that omits it fails the output assertions before deployment.

The production baseline rechecked on 2026-08-03 resolves publicly to `74.208.89.64` and is served by nginx. The public host returns HTTP 200 for `/`, `/index.html`, `/gallery.html`, `/deployment-model.html`, and `/sitemap.xml`; the new `/gallery/` and `/deployment/` routes still return HTTP 404 because the refactor has not been deployed. This workstation separately overrides `pbb.ph` to `127.0.0.1` for WAMP, so production checks must bypass that local mapping or use external DNS. Public DNS does not currently point at GitHub Pages, so the owner must confirm whether DNS/hosting will switch to the configured workflow or whether `dist/` will be released to the existing nginx host. After deployment, repeat HTTP, canonical, redirect, sitemap, 404, form, and browser checks against the public address.

## Service and truthfulness boundary

PBB is presented as an integrated local digital resilience platform, not a disconnected app catalog. Offline-first normally means local-server and LAN continuity; it does not imply a durable queue in every browser or universal database synchronization. Planned capabilities, production hardening, privacy policy, retention rules, and unconfirmed deployment terms must remain visibly qualified.

Hardware, connectivity, power backup, installation logistics, training, travel, and field equipment remain deployment-specific unless a sponsored or bundled deployment explicitly includes them.
