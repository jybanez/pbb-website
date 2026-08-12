# PBB Website Refactor Implementation Checklist

Use this checklist with PBB_WEBSITE_REFACTOR_BRIEF.md. Check an item only after it has been implemented and verified.

## A. Preparation and repository safety

- [ ] Read PBB_WEBSITE_REFACTOR_BRIEF.md completely.
- [ ] Read the three selected PBB documentation files identified in the brief.
- [ ] Inspect README.md, index.html, gallery.html, deployment-model.html, styles.css, main.js, gallery-data.js, and pbb-gallery.js.
- [ ] Inspect current Git status and preserve unrelated work.
- [ ] Do not remove .well-known or helper_repo.
- [ ] Identify the current hosting and deployment source.
- [ ] Record the current public URL behavior for index.html, gallery.html, and deployment-model.html.
- [ ] Inventory image sources and all current references.
- [ ] Inventory the briefing form and its Formspree/mailto/honeypot behavior.

## B. Architecture

- [ ] Add package.json with pinned development dependencies.
- [ ] Commit package-lock.json.
- [ ] Configure Eleventy source and dist directories.
- [ ] Configure CNAME, robots.txt, required .well-known content, and static assets as passthrough files.
- [ ] Add local development command.
- [ ] Add production build command.
- [ ] Add content/schema validation command.
- [ ] Add link/output validation command.
- [ ] Document the build in README.md.
- [ ] Ensure generated dist is reproducible.
- [ ] Ensure the public site does not require client-side rendering for primary content.

## C. Content schemas and controlled vocabularies

- [ ] Create module JSON Schema.
- [ ] Create infrastructure-component JSON Schema.
- [ ] Create shared schema definitions.
- [ ] Define readiness-status enum and display labels.
- [ ] Define formal categories.
- [ ] Include Community engagement.
- [ ] Assign Games / Tabulus to Community engagement.
- [ ] Define deployment placement identifiers.
- [ ] Define baseline, optional, and special deployment classifications.
- [ ] Define product families and aliases.
- [ ] Validate unique slugs.
- [ ] Validate workflow and screenshot IDs.
- [ ] Validate related module/component references.
- [ ] Reject missing real-image sources or alt text.
- [ ] Reject unsupported raw HTML.
- [ ] Require unique SEO title and description fields.

## D. Shared templates and components

- [ ] Base layout
- [ ] Site header
- [ ] Accessible desktop navigation
- [ ] Accessible mobile navigation
- [ ] Site footer
- [ ] Breadcrumbs
- [ ] Page hero
- [ ] Module card
- [ ] Infrastructure card
- [ ] Workflow steps
- [ ] Screenshot gallery
- [ ] FAQ section
- [ ] Status badge
- [ ] Deployment badge
- [ ] Related modules
- [ ] Related components
- [ ] CTA section
- [ ] Empty/placeholder screenshot state
- [ ] Shared SEO metadata include
- [ ] Structured-data include

## E. Navigation and routing

- [ ] Primary navigation includes Home.
- [ ] Primary navigation includes Modules.
- [ ] Primary navigation includes Infrastructure.
- [ ] Primary navigation includes Deployment.
- [ ] Primary navigation includes Status.
- [ ] Primary navigation includes Request briefing.
- [ ] Powered by Wizaya is removed from the primary navigation.
- [ ] Powered by Wizaya remains visible in the homepage and footer.
- [ ] Module navigation is grouped by category.
- [ ] Footer Explore group is implemented.
- [ ] Footer Platform group is implemented.
- [ ] Footer Connect group is implemented.
- [ ] Breadcrumbs work on detail pages.
- [ ] Related cards resolve to valid pages.
- [ ] Add custom 404 page.

## F. Gate 1 — foundation pages

- [ ] Homepage generated through the new layout.
- [ ] Homepage remains concise.
- [ ] Homepage retains core PBB positioning.
- [ ] Homepage retains who-benefits and daily-use sections.
- [ ] Homepage explains local continuity and selective synchronization accurately.
- [ ] Homepage featured modules implemented.
- [ ] Homepage prioritizes health before learning.
- [ ] Homepage readiness snapshot preserved exactly.
- [ ] Homepage Powered by Wizaya summary retained.
- [ ] Modules overview generated.
- [ ] Modules overview includes all categories.
- [ ] Hotline / Vox module.json created and validated.
- [ ] Hotline / Vox page generated.
- [ ] Natalium module.json created and validated.
- [ ] Natalium page generated.
- [ ] Initial WebP image pipeline works.
- [ ] Stop for planner/reviewer approval before expanding all pages.

## G. Remaining module content

- [ ] Support / Imperium module.json
- [ ] Support / Imperium generated page
- [ ] Salus module.json
- [ ] Salus generated page
- [ ] Chat / Civitas module.json
- [ ] Chat / Civitas generated page
- [ ] Games / Tabulus module.json
- [ ] Games / Tabulus generated page
- [ ] Library / Libria module.json
- [ ] Library / Libria generated page
- [ ] Learning / Lumaria module.json
- [ ] Learning / Lumaria generated page
- [ ] Utility / Vena module.json
- [ ] Utility / Vena generated page
- [ ] Every module has five to eight evidence-grounded FAQs or an explicitly reviewed smaller set.
- [ ] Every module has precise offline/local behavior.
- [ ] Every module states connectivity-dependent behavior.
- [ ] Every module distinguishes missing/unconfirmed sync.
- [ ] Every module has deployment classification.
- [ ] Every module has readiness status, qualifier, evidence note, and remaining work.
- [ ] Every module has related links.
- [ ] No module claims an undocumented live deployment.

## H. Infrastructure content

- [ ] Infrastructure overview generated.
- [ ] Account component.json and page
- [ ] Relay component.json and page
- [ ] Realtime component.json and page
- [ ] MapServer component.json and page
- [ ] Maestro component.json and page
- [ ] Landing component.json and page
- [ ] Kit Setup component.json and page
- [ ] Account is not described as full OIDC.
- [ ] Relay is not described as universal database replication.
- [ ] Realtime documents the one-instance-per-node expectation.
- [ ] MapServer documents cache/preparation limitations.
- [ ] Maestro is described as observer-only.
- [ ] Landing is distinguished from the public marketing website.
- [ ] Kit Setup documents Windows/WAMP/Technitium and administrative requirements.
- [ ] Infrastructure related links resolve.

## I. Deployment, status, briefing, gallery, and Wizaya

- [ ] Deployment overview page generated.
- [ ] Barangay node explained.
- [ ] City/municipal support node explained.
- [ ] Health-center node explained.
- [ ] School/learning node explained.
- [ ] Library/knowledge node explained.
- [ ] Humanitarian/field node explained.
- [ ] Utility-company node explained.
- [ ] Hardware and field costs remain deployment-specific.
- [ ] Status page generated.
- [ ] Status definitions match controlled vocabulary.
- [ ] Status page preserves the platform readiness snapshot.
- [ ] Status page distinguishes software implementation from deployment/governance readiness.
- [ ] Briefing page generated.
- [ ] Formspree submission preserved.
- [ ] Mailto fallback preserved.
- [ ] Honeypot preserved.
- [ ] Success and failure feedback preserved.
- [ ] Gallery content preserved.
- [ ] Gallery filters and viewer remain functional.
- [ ] Powered by Wizaya footer link points to valid content.
- [ ] Implement /wizaya/ only if content is sufficient; otherwise link to /#wizaya.

## J. Image conversion and optimization

- [ ] Inventory every on-page raster image.
- [ ] Preserve original PNG/JPEG sources outside dist.
- [ ] Generate WebP variants.
- [ ] Generate responsive widths for large banners and photographs.
- [ ] Use near-lossless or lossless settings for screenshot text.
- [ ] Update all on-page raster references to WebP.
- [ ] Add width and height to image output.
- [ ] Add srcset and sizes where beneficial.
- [ ] Lazy-load below-the-fold images.
- [ ] Validate informative alt text.
- [ ] Use empty alt for decorative images.
- [ ] Preserve SVG as vector.
- [ ] Preserve suitable favicon formats.
- [ ] Preserve a compatible Open Graph PNG/JPEG asset.
- [ ] Build fails for missing declared images.
- [ ] Placeholder screenshots do not reference nonexistent files.

## K. Accessibility

- [ ] Remove maximum-scale=1.
- [ ] Remove user-scalable=no.
- [ ] Skip link works.
- [ ] Heading hierarchy is valid.
- [ ] Landmarks are semantic.
- [ ] Keyboard focus is visible.
- [ ] Desktop dropdowns are keyboard operable.
- [ ] Mobile navigation is keyboard operable.
- [ ] Escape closes open navigation/dialogs where applicable.
- [ ] FAQ controls expose correct expanded states.
- [ ] Gallery controls are keyboard operable.
- [ ] Workflows remain readable as ordered lists.
- [ ] Status does not depend on color alone.
- [ ] Reduced-motion preferences are respected.
- [ ] Contrast is reviewed.
- [ ] Touch targets are adequate.

## L. SEO and output

- [ ] Unique page titles
- [ ] Unique descriptions
- [ ] Canonical URLs
- [ ] Open Graph metadata
- [ ] Social image compatibility
- [ ] Breadcrumb structured data
- [ ] Organization structured data where appropriate
- [ ] Generated sitemap.xml
- [ ] robots.txt preserved
- [ ] CNAME preserved
- [ ] 404 page emitted
- [ ] Nested asset paths resolve
- [ ] No duplicate canonical URLs
- [ ] Generated detail content is present in HTML source

## M. Legacy compatibility

- [ ] /index.html remains safe.
- [ ] /gallery.html remains functional or redirects safely.
- [ ] /deployment-model.html remains functional or redirects safely.
- [ ] New /gallery/ works.
- [ ] New /deployment/ works.
- [ ] No redirect loops.
- [ ] Canonical URLs point to preferred clean routes.

## N. Verification

- [ ] npm ci succeeds.
- [ ] Content/schema validation succeeds.
- [ ] Production build succeeds.
- [ ] Link check succeeds.
- [ ] All declared assets exist.
- [ ] No console errors on representative pages.
- [ ] Homepage desktop smoke test passes.
- [ ] Homepage mobile smoke test passes.
- [ ] Modules overview smoke test passes.
- [ ] Hotline page smoke test passes.
- [ ] Natalium page smoke test passes.
- [ ] One infrastructure page smoke test passes.
- [ ] Status page smoke test passes.
- [ ] Briefing form validation is tested without sending a real request.
- [ ] Gallery smoke test passes.
- [ ] Keyboard navigation smoke test passes.
- [ ] Automated accessibility checks pass or findings are documented.
- [ ] All module readiness claims receive final content review.
- [ ] All planned versus implemented distinctions receive final content review.
- [ ] Git diff contains no accidental unrelated deletions.

## O. Deployment workflow

- [ ] GitHub Pages or target-host workflow identified.
- [ ] Workflow installs pinned dependencies.
- [ ] Workflow validates before build.
- [ ] Workflow builds before deploy.
- [ ] Workflow checks links/output.
- [ ] Workflow uploads only generated public artifact.
- [ ] CNAME is present in the deployed artifact.
- [ ] Deployment is blocked on validation failure.
- [ ] Local deployment instructions are documented.

## P. Handoff

- [ ] Describe the final source/content structure.
- [ ] Explain how to edit module.json.
- [ ] Explain how to edit component.json.
- [ ] Explain how to add screenshots.
- [ ] Explain how WebP generation works.
- [ ] Explain how to add a new module.
- [ ] Explain status/category validation.
- [ ] List test/build commands run.
- [ ] List any remaining known limitations.
- [ ] Request planner/reviewer signoff.
