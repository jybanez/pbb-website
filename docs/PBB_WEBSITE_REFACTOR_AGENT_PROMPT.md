# Prompt for the PBB Website Implementation Agent

You are the implementation agent for the Project Bantay Bayan public website refactor.

Repository:

C:\wamp64\www\pbb\website

Your authoritative implementation documents are:

1. C:\wamp64\www\pbb\website\docs\PBB_WEBSITE_REFACTOR_BRIEF.md
2. C:\wamp64\www\pbb\website\docs\PBB_WEBSITE_REFACTOR_IMPLEMENTATION_CHECKLIST.md

Required PBB product evidence:

1. C:\wamp64\www\pbb\documentations\PBB_SELECTED_APPS_CODEX_FINDINGS.md
2. C:\wamp64\www\pbb\documentations\PBB_SELECTED_APPS_ECOSYSTEM_MAP.md
3. C:\wamp64\www\pbb\documentations\PBB_SELECTED_APPS_TECHNICAL_BRIEFING.md

Read all five documents completely before changing files. Use the latest current-state corrections over older historical statements.

Objective:

Refactor the current mostly one-page static PBB website into a maintainable, data-driven static website. Use Eleventy with pre-rendered HTML, reusable templates, one module.json file per module, one component.json file per infrastructure component, schema validation, clean directory URLs, and automated WebP generation for normal on-page raster assets.

Critical product rule:

Present PBB as one integrated offline-first local-node platform, not as a disconnected application catalog. Preserve its civic-tech, public-service, practical, and credible tone. Do not overclaim deployment, production readiness, synchronization, security, privacy, or planned capabilities.

Critical repository rules:

- Inspect the worktree before editing.
- Preserve unrelated changes and untracked files.
- Do not remove .well-known or helper_repo.
- Preserve the existing gallery, briefing form behavior, Formspree submission, mailto fallback, honeypot, current visual identity, readiness snapshot, CNAME, robots.txt, and useful existing assets.
- Do not migrate to a different framework without stopping and documenting a concrete blocker.
- Do not make primary content depend on client-side rendering.
- Do not create screenshots or claims that are not supported by actual assets or PBB evidence.

Implementation sequence:

Phase 1 — Foundation and review gate

1. Inspect the current repository, deployment assumptions, legacy URLs, assets, and form behavior.
2. Introduce Eleventy incrementally with pinned dependencies and documented commands.
3. Create module and infrastructure JSON Schemas and controlled data files.
4. Create the shared base layout, header, footer, navigation, metadata, breadcrumbs, cards, workflow, gallery, FAQ, badges, related-items, and CTA templates.
5. Implement the homepage, Modules overview, Hotline/Vox page, and Natalium page.
6. Implement the initial WebP pipeline and representative responsive imagery.
7. Run validation, build, link checking, and representative desktop/mobile/accessibility checks.
8. Stop and report the Gate 1 result. Do not multiply the templates across all remaining pages until the planner/reviewer has inspected the foundation.

Phase 2 — Content expansion

After Gate 1 approval:

1. Implement the remaining module JSON files and generated pages.
2. Implement the Infrastructure overview and all component JSON files/pages.
3. Implement Deployment, Status, and Briefing pages.
4. Preserve or migrate Gallery.
5. Implement footer-level Powered by Wizaya navigation and optional /wizaya/ page only when content is sufficient.

Phase 3 — Production verification

1. Complete WebP conversion while preserving source originals and compatibility exceptions.
2. Generate metadata, canonical URLs, structured data, sitemap.xml, and 404.html.
3. Preserve legacy URL behavior for gallery.html and deployment-model.html.
4. Run all build, schema, link, asset, accessibility, keyboard, responsive, and content-accuracy checks.
5. Confirm no unrelated files were removed.

Expected handoff:

- Summarize architecture and files changed.
- Report every command/test run and its result.
- Identify any incomplete checklist items.
- Identify any claims or content that need project-owner confirmation.
- Request planner/reviewer approval at Gate 1 and again before final completion.

Do not mark the refactor complete merely because pages build. Completion requires the acceptance criteria in the brief and the verification sections of the checklist.
