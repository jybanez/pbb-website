# Project Bantay Bayan — One-page Preview Site (GitHub Pages)

## Hosting on GitHub Pages
1. Create a GitHub repo (public or private).
2. Upload these files to the repo root.
3. Go to **Settings → Pages** and set:
   - Source: **Deploy from a branch**
   - Branch: **main** (or master), folder **/(root)**
4. Your site will be available at the GitHub Pages URL.

## Spam protection (current baseline)
- Raw email addresses are **not** present in HTML.
- Emails are revealed only on click and are stored as **base64** in JavaScript.
- The contact form includes a **honeypot** field to reduce bot submissions.

## Best protection: use a form endpoint
GitHub Pages is static, so the best approach is to send form submissions to a hosted endpoint.

### Option A: Formspree (recommended)
1. Create a form in Formspree and get your endpoint URL (example):
   `https://formspree.io/f/xxxxxx`
2. Open `main.js` and set:
   `const FORM_ENDPOINT = 'https://formspree.io/f/xxxxxx';`
3. Commit and deploy. The form will POST to Formspree instead of mailto.

### Option B: Netlify / Cloudflare Pages
If you later move hosting, you can use built-in forms/functions and add Turnstile + rate limiting.
