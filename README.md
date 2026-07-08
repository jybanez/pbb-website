# Project Bantay Bayan Website

Static public-facing website for Project Bantay Bayan. This repo currently contains:

- a landing page in `index.html`
- a gallery page in `gallery.html`
- a deployment model clarification page in `deployment-model.html`
- site behavior in `main.js` and `pbb-gallery.js`
- shared styling in `styles.css`
- static image assets in `assets/`
- homepage-specific generated/curated visuals in `assets/website/`
- a vendored `helpers.pbb.ph` copy in `vendor/helpers.pbb.ph`
- a local helper reference repo copy in `helper_repo`

## Current Purpose

This site is a static public-facing surface for PBB. It presents:

- PBB as offline-first community resilience infrastructure
- community benefits and local-service continuity
- stakeholder outcomes for citizens, barangays, LGUs, operators, health centers, utilities, schools, donors, and partners
- the software-first managed local-node resilience service model, including hardware and support boundaries
- pilot-readiness status, safeguards, and contact/briefing intake
- a gallery for screenshots, field visuals, hardware, and team context

The site is designed to run as a static deployment such as GitHub Pages or any basic web host.

## Service Boundary

PBB is presented as a software-first managed digital resilience platform. The website should not imply that physical node hardware is automatically included in the monthly managed service fee. PBB provides the software ecosystem and managed support layer; hardware, connectivity, power backup, installation logistics, training, travel, and field equipment are deployment-specific unless explicitly included in a sponsored or bundled deployment package.

## Repo Structure

```text
assets/                  Static site images
assets/website/          Homepage visuals mapped to refactor-brief placeholders, with WebP files plus PNG fallbacks
assets/gallery/          Gallery originals retained with same-name WebP preview variants and WebP thumbnails
helper_repo/             Local reference copy of helpers.pbb.ph
vendor/helpers.pbb.ph/   Vendored helper assets used by the site
gallery-data.js          Gallery content data
gallery.html             Public gallery page
deployment-model.html    Software, hardware, support, and deployment boundary page
index.html               Public landing page
main.js                  Shared site behavior and contact form logic
pbb-gallery.js           Gallery rendering and filtering logic
styles.css               Site styles
README.md                Project documentation
```

## Local Preview

Serve the repo with a local static server from the project root. Example:

```powershell
python -m http.server 8000
```

Then open:

- `http://localhost:8000/index.html`
- `http://localhost:8000/gallery.html`

Do not rely on opening the HTML files directly from disk because module loading and asset resolution should be tested through HTTP.

## Helper Vendoring

This site requires the PBB helper library. There is no fallback path when helper assets are missing.

Current pattern in this repo:

- runtime helper assets are served from `vendor/helpers.pbb.ph`
- a local reference/source copy is kept in `helper_repo`
- helper vendoring metadata is recorded in `vendor/helpers.pbb.ph/VENDORED.md`
- critical public imagery has local `.webp` variants for lighter page delivery while retaining `.png` originals as fallbacks

When refreshing helpers:

1. Update the local reference copy in `helper_repo`.
2. Sync the files into `vendor/helpers.pbb.ph`.
3. Verify key runtime files still load correctly, especially `js/ui/ui.loader.js`.
4. Update `vendor/helpers.pbb.ph/VENDORED.md` with the source repo and pinned commit.

Recommended habit:

- When PBB Helper announces a fix or shared-component update in the chat log, pull the official upstream helper repo into `helper_repo` first, then refresh the vendored runtime copy from that local source.
- Do not refresh from ad hoc file copies; use the official helper repository as the source of truth.

## Contact Form

The contact form is handled in `main.js`.

Current behavior:

- primary submission path posts JSON to Formspree
- fallback path opens a `mailto:` link if the endpoint fails
- a honeypot field is injected dynamically to reduce bot submissions
- raw contact email addresses are not embedded directly in the HTML

Current configured endpoint:

```js
const FORM_ENDPOINT = 'https://formspree.io/f/xpqprldj';
```

If this endpoint changes, update it in `main.js`.

## Gallery Content

Gallery items are defined in `gallery-data.js` as `galleryItems`. Image entries keep their original JPG/PNG `full` path and are automatically enriched with a same-name WebP preview path plus the original fallback path.

Supported item types:

- `image`
- `video`
- `card`

Supported categories:

- `field`
- `screenshots`
- `behind`
- `team`

For image items, provide:

- `thumb`
- `full`
- `alt`

For video items, provide:

- `thumb`
- `video`
- `alt`

For all items, keep `id`, `title`, `caption`, and `category` stable and accurate.

## Deployment Notes

The site is static and can be deployed directly from the repo root.

Before deployment, verify:

1. `index.html` and `gallery.html` load without console errors.
2. all referenced files exist under `assets/` or `vendor/`
3. helper assets are present and match the vendored metadata
4. the contact form endpoint is correct for the target environment
5. metadata and public copy still reflect the current PBB positioning

## Known Production Considerations

- The contact form depends on an external Formspree endpoint for successful hosted submissions.
- Original PNG/JPG assets are still kept alongside lighter WebP variants in `assets/` for compatibility and source retention.
- Social metadata still points to PNG assets for broad crawler compatibility.
