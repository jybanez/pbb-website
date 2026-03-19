# PBB Helpers Vendored Copy

Source: https://github.com/jybanez/helpers.pbb.ph.git
Vendored paths:
- vendor/helpers.pbb.ph
- helper_repo

Pinned commit: 9c29d41073ab09a79acf20500cd7ced68088fbb5
Pinned from: local helper repo copy at `helper_repo`
Verified on: 2026-03-20

Notes:
- `vendor/helpers.pbb.ph/js/ui/ui.form.modal.js` matches the async submit listener path from the pinned helper repo copy.
- `vendor/helpers.pbb.ph/js/ui/ui.media.viewer.js` includes the upstream single-item viewer fix and the newer media viewer regression coverage landed in the helper repo.
- Keep the vendored `vendor/helpers.pbb.ph` files and the local `helper_repo` reference copy in sync when refreshing helpers.

Files included:
- repo-copy vendoring of the upstream helper library, including `js/ui/*` and `css/ui/*`

Usage in preview site:
- Load vendor/helpers.pbb.ph/js/ui/ui.loader.js before app scripts
