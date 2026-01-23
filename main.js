(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ===== Configuration =====
  // If you create a Formspree form, paste the endpoint here, e.g.:
  // https://formspree.io/f/xxxxxx
  // Leave empty to use mailto fallback (still spam-resistant: address is obfuscated).
  const FORM_ENDPOINT = 'https://formspree.io/f/xpqprldj';

  // Base64-encoded emails to reduce scraping
  const EMAILS_B64 = {
  "partnerships": "cGFydG5lcnNoaXBzQGJhbnRheWJheWFuLm9yZw==",
  "pilots": "cGlsb3RzQGJhbnRheWJheWFuLm9yZw==",
  "media": "bWVkaWFAYmFudGF5YmF5YW4ub3Jn",
  "security": "c2VjdXJpdHlAYmFudGF5YmF5YW4ub3Jn"
};

  const decodeEmail = (key) => {
    const val = EMAILS_B64[key];
    if (!val) return '';
    try { return atob(val); } catch { return ''; }
  };

  // ===== Mobile nav toggle =====
  const btn = document.querySelector('.menu-btn');
  const mobileNav = document.getElementById('mobileNav');
  if (btn && mobileNav) {
    const close = () => {
      btn.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
    };
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      mobileNav.hidden = isOpen;
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  // ===== Email reveal pills =====
  const pills = document.querySelectorAll('[data-email]');
  pills.forEach((pill) => {
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('role', 'button');

    const key = pill.getAttribute('data-email');
    const reveal = () => {
      const email = decodeEmail(key);
      if (!email) return;
      // Render as clickable mail link (created dynamically)
      const a = document.createElement('a');
      a.href = `mailto:${email}`;
      a.textContent = email;
      a.rel = 'nofollow';
      a.className = 'email-link';
      pill.replaceWith(a);
    };

    pill.addEventListener('click', reveal);
    pill.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        reveal();
      }
    });
  });

  // ===== Form handling =====
  const form = document.getElementById('interestForm');
  if (!form) return;

  const getErrorEl = (name) => form.querySelector(`.error[data-for="${name}"]`);
  const setError = (name, msg) => {
    const el = getErrorEl(name);
    if (el) el.textContent = msg || '';
  };

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const setSubmitting = (isSubmitting) => {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = isSubmitting;
    btn.textContent = isSubmitting ? 'Sending…' : 'Send';
  };

  const showInlineStatus = (msg) => {
    let el = form.querySelector('[data-status]');
    if (!el) {
      el = document.createElement('p');
      el.className = 'small muted';
      el.setAttribute('data-status', '1');
      form.querySelector('.actions')?.appendChild(el);
    }
    el.textContent = msg;
  };

  // Honeypot field (anti-bot) created dynamically so it doesn't appear in HTML source
  const hp = document.createElement('input');
  hp.type = 'text';
  hp.name = 'company';
  hp.autocomplete = 'off';
  hp.tabIndex = -1;
  hp.setAttribute('aria-hidden', 'true');
  hp.style.position = 'absolute';
  hp.style.left = '-9999px';
  hp.style.height = '1px';
  hp.style.width = '1px';
  form.appendChild(hp);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const role = form.role.value.trim();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const org = (form.org.value || '').trim();
    const updates = form.updates.checked ? 'Yes' : 'No';

    let ok = true;
    ['role','name','email','message'].forEach(k => setError(k, ''));

    if (!role) { setError('role', 'Please select one.'); ok = false; }
    if (!name) { setError('name', 'Please enter your name.'); ok = false; }
    if (!email || !validateEmail(email)) { setError('email', 'Please enter a valid email.'); ok = false; }
    if (!message) { setError('message', 'Please enter a short message.'); ok = false; }

    // Honeypot filled => likely bot
    if (hp.value && hp.value.trim().length > 0) ok = false;

    if (!ok) return;

    const payload = {
      role, name, organization: org || '-', email, updates, message,
      page: window.location.href,
      ts: new Date().toISOString()
    };

    // Preferred: send to form endpoint
    if (FORM_ENDPOINT) {
      try {
        setSubmitting(true);
        showInlineStatus('Sending…');

        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showInlineStatus('Sent. Thank you — we will get back to you.');
          form.reset();
          return;
        }

        // Fall back if endpoint fails
        showInlineStatus('Could not send via endpoint. Opening email composer…');
      } catch (err) {
        showInlineStatus('Could not send via endpoint. Opening email composer…');
      } finally {
        setSubmitting(false);
      }
    }

    // Fallback: mailto (address assembled at runtime)
    const to = decodeEmail('partnerships');
    const subject = encodeURIComponent(`Project Bantay Bayan — Briefing / Partnership (${role})`);
    const body = encodeURIComponent(
`Role: ${role}
Name: ${name}
Organization: ${org || '-'}
Email: ${email}
Pilot updates: ${updates}

Message:
${message}
`
    );
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
})();
