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

  // ===== Preview modal (zoom/pan) =====
  const previewTrigger = document.querySelector('[data-preview-modal]');
  const imageModal = document.getElementById('imageModal');
  const imageModalStage = document.getElementById('imageModalStage');
  const imageModalImg = document.getElementById('imageModalImg');

  if (previewTrigger && imageModal && imageModalStage && imageModalImg) {
    const zoomInBtn = imageModal.querySelector('[data-zoom-in]');
    const zoomOutBtn = imageModal.querySelector('[data-zoom-out]');
    const zoomResetBtn = imageModal.querySelector('[data-zoom-reset]');
    const closeBtns = imageModal.querySelectorAll('[data-close]');

    let scale = 1;
    let minScale = 1;
    let translateX = 0;
    let translateY = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    const pointers = new Map();
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let pinchCenter = { x: 0, y: 0 };
    let lastFocus = null;
    let raf = 0;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const applyTransform = () => {
      imageModalImg.style.transform =
        `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${scale})`;
      raf = 0;
    };

    const setTransform = () => {
      if (raf) return;
      raf = requestAnimationFrame(applyTransform);
    };

    const clampTranslate = () => {
      const stageRect = imageModalStage.getBoundingClientRect();
      const imgW = imageModalImg.naturalWidth || 1;
      const imgH = imageModalImg.naturalHeight || 1;
      const maxX = Math.max(0, (imgW * scale - stageRect.width) / 2);
      const maxY = Math.max(0, (imgH * scale - stageRect.height) / 2);
      translateX = clamp(translateX, -maxX, maxX);
      translateY = clamp(translateY, -maxY, maxY);
    };

    const resetView = () => {
      scale = minScale;
      translateX = 0;
      translateY = 0;
      setTransform();
    };

    const fitToStage = () => {
      const stageRect = imageModalStage.getBoundingClientRect();
      const imgW = imageModalImg.naturalWidth || 1;
      const imgH = imageModalImg.naturalHeight || 1;
      const scaleX = stageRect.width / imgW;
      const scaleY = stageRect.height / imgH;
      minScale = Math.min(scaleX, scaleY, 1);
      resetView();
    };

    const openModal = () => {
      const full = previewTrigger.getAttribute('data-full');
      const full2x = previewTrigger.getAttribute('data-full-2x');
      if (full) imageModalImg.src = full;
      if (full && full2x) imageModalImg.srcset = `${full2x} 2x, ${full} 4x`;
      imageModal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (imageModalImg.complete) {
        fitToStage();
      } else {
        imageModalImg.onload = fitToStage;
      }
      lastFocus = document.activeElement;
      (zoomResetBtn || imageModal).focus();
    };

    const closeModal = () => {
      imageModal.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    const zoomAt = (clientX, clientY, delta) => {
      const stageRect = imageModalStage.getBoundingClientRect();
      const prevScale = scale;
      const nextScale = clamp(scale + delta, minScale, 6);
      if (nextScale === prevScale) return;

      const offsetX = clientX - (stageRect.left + stageRect.width / 2);
      const offsetY = clientY - (stageRect.top + stageRect.height / 2);
      const ratio = nextScale / prevScale;

      translateX = translateX - offsetX * (ratio - 1);
      translateY = translateY - offsetY * (ratio - 1);
      scale = nextScale;
      clampTranslate();
      setTransform();
    };

    const zoomBy = (delta) => {
      const stageRect = imageModalStage.getBoundingClientRect();
      zoomAt(
        stageRect.left + stageRect.width / 2,
        stageRect.top + stageRect.height / 2,
        delta
      );
    };

    previewTrigger.addEventListener('click', openModal);

    closeBtns.forEach((btn) => btn.addEventListener('click', closeModal));

    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) closeModal();
    });

    imageModalStage.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Normalize wheel across mouse/trackpad and delta modes
      const lineHeight = 16;
      const pageHeight = window.innerHeight || 800;
      let deltaY = e.deltaY;
      if (e.deltaMode === 1) deltaY *= lineHeight;
      if (e.deltaMode === 2) deltaY *= pageHeight;

      const sensitivity = e.ctrlKey ? 1400 : 900;
      const delta = Math.max(-0.05, Math.min(0.05, -deltaY / sensitivity));
      zoomAt(e.clientX, e.clientY, delta);
    }, { passive: false });

    const updatePinchCenter = () => {
      const pts = Array.from(pointers.values());
      pinchCenter = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2
      };
    };

    imageModalStage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      imageModalStage.setPointerCapture(e.pointerId);

      if (pointers.size === 1) {
        isPanning = true;
        panStartX = e.clientX - translateX;
        panStartY = e.clientY - translateY;
      }

      if (pointers.size === 2) {
        isPanning = false;
        const pts = Array.from(pointers.values());
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartScale = scale;
        updatePinchCenter();
      }
    });

    imageModalStage.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const nextScale = clamp(pinchStartScale * (dist / Math.max(1, pinchStartDist)), minScale, 6);
        const delta = nextScale - scale;
        updatePinchCenter();
        zoomAt(pinchCenter.x, pinchCenter.y, delta);
        return;
      }

      if (!isPanning) return;
      translateX = e.clientX - panStartX;
      translateY = e.clientY - panStartY;
      clampTranslate();
      setTransform();
    });

    const stopPan = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) {
        pinchStartDist = 0;
      }
      if (pointers.size === 0) {
        isPanning = false;
      }
      imageModalStage.releasePointerCapture(e.pointerId);
    };
    imageModalStage.addEventListener('pointerup', stopPan);
    imageModalStage.addEventListener('pointercancel', stopPan);

    zoomInBtn?.addEventListener('click', () => zoomBy(0.05));
    zoomOutBtn?.addEventListener('click', () => zoomBy(-0.05));
    zoomResetBtn?.addEventListener('click', resetView);

    document.addEventListener('keydown', (e) => {
      if (imageModal.hidden) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === '+' || e.key === '=') zoomBy(0.2);
      if (e.key === '-' || e.key === '_') zoomBy(-0.2);
      if (e.key === '0') resetView();
    });

    window.addEventListener('resize', () => {
      if (!imageModal.hidden) fitToStage();
    });
  }

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
