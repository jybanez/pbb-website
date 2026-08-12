# Project Bantay Bayan Website Refactor Brief

Status: Approved planning baseline
Website: https://pbb.ph
Repository: C:\wamp64\www\pbb\website
Primary audience: implementation agent, reviewer, and future website maintainers

## 1. Purpose

Refactor the current Project Bantay Bayan public website from a primarily one-page static presentation into a modular, data-driven static website.

The finished site must explain the complete PBB ecosystem without presenting it as a disconnected catalog of apps. Each major module and infrastructure component will have a dedicated, pre-rendered detail page generated from structured content.

The homepage must remain concise and executive-friendly. Detailed workflows, deployment placement, offline behavior, screenshots, FAQs, and readiness qualifications belong on detail pages.

## 2. Core positioning

Project Bantay Bayan is an offline-first, local-node-first community resilience infrastructure platform. It helps barangays, LGUs, health centers, responders, schools, NGOs, donors, utilities, and underserved communities keep essential local services available when internet access is weak, intermittent, or unavailable.

Preserve these core messages:

- Keeping communities connected, informed, served, and coordinated — online or offline.
- Local services should not stop just because the internet stops.
- Cloud where available. Local where necessary. Sync when possible. Continue operating when disconnected.
- Daily use creates habit. Habit creates adoption. Adoption creates readiness.

PBB is not a single emergency app. It is a modular local digital resilience platform anchored in public-service continuity, daily usefulness, and selective store-and-forward coordination.

## 3. Evidence and truthfulness rules

Public content must remain grounded in the selected PBB documentation:

- C:\wamp64\www\pbb\documentations\PBB_SELECTED_APPS_CODEX_FINDINGS.md
- C:\wamp64\www\pbb\documentations\PBB_SELECTED_APPS_ECOSYSTEM_MAP.md
- C:\wamp64\www\pbb\documentations\PBB_SELECTED_APPS_TECHNICAL_BRIEFING.md

Use the most recent current-state corrections over older historical statements. The July 24 current-state descriptions supersede earlier proposal-only descriptions where implementation was later confirmed.

Do not invent or imply:

- confirmed deployments that are not documented;
- national deployment or government adoption;
- production readiness where only implementation or pilot foundations exist;
- certifications, approvals, partnerships, or integrations not confirmed in evidence;
- security, privacy, retention, encryption, or backup guarantees that remain policy work;
- pricing, hardware inclusion, connectivity inclusion, or deployment terms not established;
- synchronization behavior that is not implemented or confirmed;
- planned responder/mobile or FRP functionality as already deployed.

When a capability is incomplete or unconfirmed, use qualified wording such as:

- intended deployment;
- designed to support;
- implementation in progress;
- integration point;
- planned;
- not yet confirmed;
- requires pilot policy or production hardening.

Each page should distinguish among:

1. Implemented capability
2. Intended deployment role
3. Confirmed integration
4. Planned integration
5. Pilot or production hardening still required

## 4. Product and ecosystem hierarchy

The website must communicate PBB as coordinated layers rather than one flat list.

### 4.1 Citizen-facing services

- PBB Library / Libria
- PBB Learning / Lumaria
- PBB Chat / Civitas
- PBB Games / Tabulus
- PBB Natalium

### 4.2 Auxilus Mos operational services

- PBB Hotline / Vox
- PBB Support System / Imperium
- PBB Utility / Vena
- PBB Salus

### 4.3 Wizaya Server Suite

Core services:

- PBB Account
- PBB Relay
- PBB Realtime
- PBB Maestro
- PBB MapServer

Deployment modules:

- PBB Landing
- PBB Kit Setup

### 4.4 Control plane and non-public tooling

- Hub HQ is the cloud/control-plane application and should be explained where topology requires it, but it is not a peer citizen module.
- PBB Helper is a shared frontend UI library, not a responder application.
- PBB Chatviewer / Syndicatum is development coordination tooling, not a public operational module.

Do not create public module cards that make Helper or Syndicatum look like citizen or deployment services.

## 5. Important technical distinctions for public copy

### 5.1 Meaning of offline-first

For PBB, offline-first usually means local-server and LAN continuity. It does not automatically mean that every browser has a durable offline queue or that every app is a PWA.

Describe offline behavior precisely:

- what continues through the local node and LAN;
- what requires a local supporting service such as Account, Realtime, or MapServer;
- what waits for Relay or upstream connectivity;
- what is not currently synchronized.

### 5.2 Selective synchronization

Relay does not indiscriminately replicate every application database.

Confirmed examples include:

- Hotline SITREPs and support requests;
- Support consolidated SITREPs and support lifecycle updates;
- Relay source-heartbeat operational webhooks;
- Vena inbound Hotline incident snapshots.

Important exclusions and qualifications:

- editable incident records are not broadly replicated between nodes;
- nodes consolidate and send periodic SITREPs upstream;
- Chat has no confirmed Relay message synchronization;
- Natalium health-data upstream synchronization is not confirmed;
- Salus keeps person-level evacuation records local and exposes privacy-safe aggregates to Vox;
- Library uses its own signed Cloud-to-Node release and object-download process for large content;
- Learning consumes Library locally and is not part of the Library release-transfer path.

### 5.3 Planned capabilities

The following are owner-confirmed designs but must not be represented as completed production capabilities:

- the offline-capable responder/helper mobile companion;
- the PBB-managed FRP tunnel control plane and node-client lifecycle.

## 6. Primary site structure

Generate clean directory URLs with index.html output.

~~~text
/
/modules/
/modules/hotline/
/modules/support/
/modules/salus/
/modules/natalium/
/modules/chat/
/modules/learning/
/modules/library/
/modules/utility/
/modules/games/
/infrastructure/
/infrastructure/account/
/infrastructure/relay/
/infrastructure/realtime/
/infrastructure/mapserver/
/infrastructure/maestro/
/infrastructure/landing/
/infrastructure/kit-setup/
/deployment/
/status/
/briefing/
/gallery/
/wizaya/                 optional dedicated page if sufficient content exists
/404.html
~~~

If /wizaya/ is not implemented initially, the footer link may target /#wizaya. Prefer a dedicated page once content is sufficient.

## 7. Navigation

Primary navigation:

- Home
- Modules
- Infrastructure
- Deployment
- Status
- Request briefing

Do not include Powered by Wizaya in the primary navigation.

Footer navigation:

Explore:

- Modules
- Infrastructure
- Deployment
- Status
- Gallery

Platform:

- About Project Bantay Bayan
- Powered by Wizaya
- Readiness and safeguards

Connect:

- Request a briefing
- Discuss a pilot
- Partnership inquiries

Requirements:

- Organize module navigation by category rather than one long flat list.
- Add breadcrumbs to detail pages.
- Add related modules or related components to the bottom of detail pages.
- Provide an accessible mobile navigation pattern with Escape handling, keyboard operation, visible focus, and correct expanded states.

## 8. Module categories

Use these formal categories:

1. Emergency and operations
2. Health and welfare
3. Community communication
4. Community engagement
5. Learning and knowledge
6. Utility and public service coordination
7. Local-node infrastructure

PBB Games / Tabulus belongs under Community engagement.

Health continuity must appear before education and learning in homepage and overview hierarchy.

## 9. Homepage requirements

The homepage is an executive overview, not a complete technical inventory.

Recommended sections:

1. Hero and primary promise
2. Core continuity promise
3. Who benefits
4. Daily-use adoption
5. How PBB works when connectivity is uncertain
6. Featured modules
7. Deployment model summary
8. Readiness snapshot
9. Powered by Wizaya summary
10. Briefing and pilot CTA

Featured module cards:

- Hotline / Vox
- Natalium
- Salus
- Library / Libria
- Learning / Lumaria
- Chat / Civitas
- Utility / Vena
- Support / Imperium

Games / Tabulus may appear on the Modules overview rather than the featured homepage set.

Feature-order emphasis:

1. Emergency response
2. Health continuity
3. Communication
4. Public knowledge and learning
5. Evacuation, relief, utilities, support operations, and engagement

Preserve the current readiness snapshot:

- Platform integration: 9/10
- Feature implementation: 8/10
- Deployment preparation: 6/10
- Security and governance: 5/10
- Pilot readiness: 7/10
- Overall readiness: 7/10

Use this wording:

Pilot-ready foundation

PBB has a strong integrated software foundation and is ready for structured pilot discussions. The next phase focuses on deployment hardening, security policy, data retention, field runbooks, and production-scale operations.

## 10. Module detail-page layout

Every module page must use a shared template and contain:

1. Hero
   - Module name
   - Product alias
   - Product family where applicable
   - One-line value proposition
   - Primary readiness badge
   - Optional readiness qualifier
   - Primary deployment placement
   - Primary users

2. What it is
   - Plain-language explanation
   - Avoid excessive technical jargon

3. Problem it solves
   - Practical operational pain

4. Core workflow
   - Short vertical or horizontal workflow
   - Accessible ordered-list fallback

5. Who uses it

6. Screenshots or prototypes
   - Flexible gallery
   - Validated screenshots only
   - Placeholder blocks when unavailable
   - Title, caption, and alt text for each real image

7. Offline-first behavior
   - What works locally
   - What local services it requires
   - What synchronizes when connectivity returns
   - What requires upstream connectivity
   - What is not currently synchronized

8. Deployment placement
   - Intended node placement
   - Baseline, optional, or special deployment classification

9. FAQs
   - Five to eight practical questions where evidence supports answers
   - Do not pad with invented policy claims

10. Status and readiness
   - Primary enum
   - Optional qualifier
   - Plain-language evidence note
   - Remaining hardening work

11. Related modules

12. Briefing CTA

## 11. Infrastructure component layout

Every infrastructure component page must use a shared component template and contain:

1. Hero and readiness
2. What it is
3. Role in a PBB node
4. Modules and services it supports
5. Local/offline behavior
6. Connectivity-dependent behavior
7. Deployment placement
8. Operational considerations
9. Security boundary and careful caveats
10. Screenshots or diagrams
11. FAQs
12. Related infrastructure components
13. Related PBB modules
14. Briefing CTA

Do not force citizen-style workflows onto infrastructure when a service interaction or provisioning flow is more accurate.

## 12. Module-specific content boundaries

### Hotline / Vox

- Category: Emergency and operations
- Placement: Barangay node or local command node
- Confirmed: emergency intake, operator workbench, incident handling, command/SITREP, SITREP Relay handoff, support requests, Realtime, MapServer
- Caveat: no confirmed durable browser-side citizen outbox
- Caveat: editable incidents are not broadly synchronized across nodes

### Support / Imperium

- Category: Emergency and operations
- Placement: city, municipal, provincial, designated support, or HQ-side support node
- Confirmed: Relay SITREP/support intake, consolidation, upstream SITREP, support lifecycle, source-heartbeat webhook, map context
- Caveat: exact operational placement remains deployment-specific
- Caveat: authorization and credential hardening remain important

### Salus

- Category: Emergency and operations
- Placement: local barangay/evacuation node
- Confirmed implementation in progress: multiple centers, registration, tags/QR, movement/occupancy, relief batches and receipts, citizen QR, Realtime notifications, Account integration, Vox aggregate summary
- Caveat: release and Kit Setup packaging are not complete
- Caveat: full relief inventory is deferred from V1
- Caveat: person-level records remain local; only privacy-safe aggregates go to Vox

### Natalium

- Category: Health and welfare
- Placement: health-center, barangay, city/municipal health, or field health node
- Confirmed: patient registry, programs, care workflow, maternal/child health, birth-defect surveillance, referrals, prescriptions, citizen/staff surfaces, reports/exports, Account integration
- Caveat: health-data upstream synchronization is not confirmed
- Caveat: privacy, retention, backup, access, and live-deployment policy require hardening

### Chat / Civitas

- Category: Community communication
- Placement: local daily-apps server / barangay LAN
- Confirmed: rooms, direct messages, requests, moderation, reports/blocks, Realtime, Hotline handoff
- Caveat: LAN-local; public gateway disabled
- Caveat: Hotline escalation is a handoff, not confirmed direct incident creation
- Caveat: Relay synchronization and durable browser offline queue are not confirmed

### Games / Tabulus

- Category: Community engagement
- Placement: optional daily-apps server
- Confirmed: local static/PHP game registry and emergency mode policy
- Caveat: no operational API dependencies in V1
- Caveat: games are hidden or disabled during active-incident/emergency modes

### Library / Libria

- Category: Learning and knowledge
- Placement: Library Cloud plus local Library Node; optional dedicated large-storage node
- Confirmed: Cloud governance/ingestion/signing/releases; Node offline catalog/search/resource serving, release/trust/storage state, SDK/embed, Account administration hooks
- Caveat: large releases use Library-specific distribution, not Relay
- Caveat: installer and operational release runbook require hardening
- Public reading should not require mandatory login

### Learning / Lumaria

- Category: Learning and knowledge
- Placement: local node learning gateway or dedicated learning server
- Confirmed: Laravel gateway, Account integration, provider/catalog/instance APIs, diagnostics, emergency state
- Caveat: V1 remains incomplete
- Caveat: deep LMS adapters, full Library adapter, Kit/Data Prep, and some admin workflows remain incomplete or unconfirmed

### Utility / Vena

- Category: Utility and public service coordination
- Placement: utility-company or designated utility operations node
- Confirmed: inbound Relay Hotline incident snapshots, normalized incidents, quarantine/stale handling, assets, teams, missions, responder acknowledgement, map config
- Caveat: inbound-only in current V1
- Caveat: no confirmed outbound utility lifecycle or mobile offline helper implementation

## 13. Infrastructure-specific content boundaries

### Account

Local canonical identity and OAuth-style SSO for PBB apps. Apps retain app-local sessions and roles linked through pbb_user_id. Do not describe it as full OIDC unless later implemented.

### Relay

Store-and-forward message infrastructure with local persistence, retries, peer delivery, handlers, receipts, attachments, relationship resolution, and operational webhooks. Do not claim universal database synchronization.

### Realtime

One shared local WebSocket gateway instance per node for supported live events. Rooms and presence are in process memory; do not imply horizontally shared live state.

### MapServer

Local tile cache/proxy and boundary service. Offline coverage depends on successful tile and boundary preparation; cache misses may need upstream providers.

### Maestro

Observer-only worker telemetry and health visibility. It does not own service restart or recovery.

### Landing

Local node launcher, safe public hub metadata projection, Kit-managed app registry, and controlled Relay gateway. Clearly distinguish PBB Landing from this public marketing website.

### Kit Setup

Windows/Electron/PHP provisioning and service-orchestration tool. It handles packages, WAMP and Technitium checks, DNS, vhosts/TLS, services, Data Prep, smoke checks, and additive update policy. It requires administrative privileges.

## 14. Readiness model

Use one primary status enum:

- concept
- in-development
- prototype
- integrated
- pilot-ready-foundation
- production-hardening

Map these values to display labels centrally.

Each record may include:

~~~json
{
  "status": "integrated",
  "qualifier": "pilot-ready-foundation",
  "note": "Core workflows are implemented; deployment and governance hardening continue."
}
~~~

Do not combine multiple statuses into one uncontrolled string.

The final per-module assignments should be based on documentation evidence and reviewed before publication.

## 15. Implementation architecture

### 15.1 Preferred generator

Use Eleventy as a lightweight static-site generator.

Reasons:

- incremental migration from current HTML/CSS/JS;
- pre-rendered crawlable HTML;
- no client-side framework required;
- reusable layouts and partials;
- structured JSON data;
- ordinary static output suitable for GitHub Pages or a basic web server.

Use Nunjucks or another clearly documented Eleventy-compatible template language. Pin exact dependency versions in package-lock.json.

If the implementation agent finds a concrete Eleventy blocker, stop and document it before changing frameworks. Do not silently migrate to Astro, React, Next.js, or another architecture.

### 15.2 Source and output separation

Recommended structure:

~~~text
src/
  content/
    modules/{slug}/module.json
    infrastructure/{slug}/component.json
  data/
    categories.json
    readiness-statuses.json
    deployments.json
    site.json
  templates/
    layouts/
    components/
  pages/
  assets/
  assets-original/
schemas/
  module.schema.json
  infrastructure-component.schema.json
  shared.schema.json
scripts/
dist/
~~~

Generated dist content must be disposable and reproducible.

### 15.3 Required reusable templates or components

- BaseLayout
- PageHero
- Breadcrumbs
- ModuleCard
- InfrastructureCard
- WorkflowSteps
- ScreenshotGallery
- FAQSection
- StatusBadge
- DeploymentBadge
- RelatedModules
- RelatedComponents
- CTASection
- SiteHeader
- SiteFooter

Naming may follow the template language, but responsibilities must remain shared.

## 16. Data model requirements

Each module must have one module.json source file. Each infrastructure component must have one component.json source file.

Module fields should include:

- schemaVersion
- type
- slug
- name
- productName
- productFamily
- category
- shortDescription
- longDescription
- primaryUsers
- deployment
- readiness
- problemSolved
- workflowSteps
- offlineBehavior
- screenshots
- faqs
- relatedModules
- relatedInfrastructure
- seo

Infrastructure fields should include:

- schemaVersion
- type
- slug
- name
- suite
- shortDescription
- longDescription
- readiness
- nodeRole
- supportedModules
- localBehavior
- connectivityBehavior
- deployment
- operationalConsiderations
- securityBoundary
- diagramsOrScreenshots
- faqs
- relatedComponents
- relatedModules
- seo

Avoid raw HTML in JSON. Permit plain strings, arrays of paragraphs, and a documented safe Markdown subset where needed.

## 17. Schema and build validation

Use JSON Schema or equivalent build-time schema validation.

The build must fail for:

- missing required fields;
- unknown categories;
- unknown readiness statuses;
- unknown deployment classifications;
- duplicate slugs or IDs;
- invalid related-module/component references;
- circular relationships where the implementation disallows them;
- real screenshots without src or alt text;
- missing declared image files;
- placeholder screenshots that claim an unavailable image;
- missing SEO title or description;
- malformed internal URLs;
- unsupported raw HTML.

Also validate:

- every detail page appears in its overview;
- related links resolve;
- all generated pages have canonical URLs;
- all internal links and asset paths resolve;
- sitemap entries correspond to generated public pages.

## 18. Image policy

All normal on-page raster imagery must be served in WebP format.

Requirements:

- Preserve original high-quality PNG/JPEG sources under a source-only directory excluded from deployed output.
- Generate WebP automatically during the build.
- Do not recompress unchanged files on every build if caching is available.
- Generate responsive sizes for large photographs and banners.
- Use lossless or near-lossless WebP for screenshots containing small text.
- Emit explicit width and height.
- Use srcset and sizes where appropriate.
- Lazy-load below-the-fold images.
- Require meaningful alt text for informative images.
- Use empty alt text for genuinely decorative images.
- Do not convert SVG vector assets to WebP.
- Keep compatibility assets such as favicon formats and an Open Graph PNG/JPEG where appropriate.
- Real screenshot declarations must refer to files that exist.
- Placeholders must not generate false screenshots.

## 19. Accessibility requirements

- Remove viewport restrictions that prevent zoom, including maximum-scale=1 and user-scalable=no.
- Use semantic landmark elements and heading order.
- Provide a working skip link.
- Ensure readable contrast.
- Ensure visible keyboard focus.
- Make dropdowns, mobile navigation, FAQs, and galleries keyboard operable.
- Use buttons for actions and links for navigation.
- Preserve reduced-motion preferences.
- Ensure workflows are understandable as semantic lists without visual styling.
- Ensure status is not communicated by color alone.
- Give real images appropriate alt text.

## 20. SEO and metadata

Every public page must have:

- unique title;
- unique meta description;
- canonical URL;
- Open Graph title, description, URL, and appropriate image;
- Twitter/social metadata where retained;
- correct heading hierarchy.

Also:

- update sitemap.xml from generated routes;
- preserve robots.txt;
- preserve CNAME in deployed output;
- add breadcrumb structured data on detail pages;
- retain Organization structured data where appropriate;
- add a custom 404 page;
- ensure nested directory pages use correct asset URLs.

## 21. Existing behavior to preserve

Preserve or equivalently replace:

- the contact/briefing form;
- Formspree submission;
- mailto fallback;
- honeypot behavior;
- success feedback;
- the gallery and gallery content;
- vendored PBB Helper runtime dependency where still used;
- current visual identity and useful existing assets;
- the current readiness snapshot;
- current metadata and canonical-domain intent;
- the service boundary explaining that hardware and deployment logistics are deployment-specific.

Do not delete or overwrite unrelated untracked files. Current untracked .well-known and helper_repo content belongs to the workspace and must be preserved.

## 22. Legacy URL handling

The repository currently exposes:

- /index.html
- /gallery.html
- /deployment-model.html

Preferred new URLs:

- /
- /gallery/
- /deployment/

Preserve compatibility using retained lightweight legacy pages, redirects supported by the host, or safe canonical/refresh fallback pages. Do not create a redirect loop. Verify the actual hosting behavior before choosing the mechanism.

## 23. Build and deployment

Add documented commands such as:

- npm install or npm ci
- npm run dev
- npm run build
- npm run validate
- npm run check:links
- npm test, if tests are separated

Use a GitHub Pages custom workflow or equivalent static hosting workflow to:

1. check out the repository;
2. install pinned dependencies;
3. validate content and schemas;
4. build the site;
5. check links and output;
6. upload the generated static artifact;
7. deploy only after successful validation.

Keep local build instructions in README.md.

## 24. Review gates

### Gate 1: Foundation

Before generating every page, implement:

- Eleventy/build configuration;
- base layout;
- header/footer/navigation;
- schemas;
- homepage;
- modules overview;
- Hotline detail page;
- Natalium detail page;
- initial image pipeline.

Stop for review at this point.

### Gate 2: Content expansion

After Gate 1 approval:

- generate remaining module pages;
- implement infrastructure overview and component pages;
- implement deployment and status pages;
- preserve gallery and briefing flows.

### Gate 3: Production verification

- complete WebP conversion;
- validate metadata and sitemap;
- verify legacy URLs;
- run link checks;
- run accessibility checks;
- smoke-test desktop and mobile;
- review all public readiness and integration claims.

## 25. Acceptance criteria

The refactor is complete only when:

1. The homepage remains concise and executive-friendly.
2. Modules and infrastructure are presented as parts of one integrated PBB platform.
3. A Modules overview exists with all formal categories, including Community engagement.
4. Every major module has a generated detail page from module.json.
5. Every listed Wizaya infrastructure component has a generated page from component.json.
6. A Deployment overview and dedicated Status page exist.
7. A dedicated briefing page preserves the current contact workflow.
8. Gallery behavior and content are preserved or improved.
9. Health continuity appears before learning in homepage and overview hierarchy.
10. Readiness uses a normalized primary enum plus optional qualifier.
11. Offline behavior is precise and does not imply universal browser/PWA or database-sync capability.
12. Planned capabilities are clearly distinguished from implemented capabilities.
13. All normal on-page raster assets are served as WebP.
14. Every real image has dimensions and appropriate alt text.
15. Generated HTML contains primary content without requiring client-side rendering.
16. All internal links, related links, images, metadata, canonical URLs, and sitemap entries validate.
17. The site remains usable on mobile and by keyboard.
18. Browser zoom is not disabled.
19. Existing Formspree/mailto/honeypot contact behavior is preserved.
20. Legacy public URLs remain functional or safely redirect.
21. The build and validation commands pass.
22. No unrelated workspace files are removed.
