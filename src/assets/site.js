(() => {
  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();

  const menuButton = document.querySelector("[data-menu-button]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  if (menuButton && mobileNav) {
    const label = menuButton.querySelector(".sr-only");
    const closeMenu = ({ restoreFocus = false } = {}) => {
      menuButton.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
      if (label) label.textContent = "Open navigation";
      if (restoreFocus) menuButton.focus();
    };
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMenu();
      } else {
        menuButton.setAttribute("aria-expanded", "true");
        mobileNav.hidden = false;
        if (label) label.textContent = "Close navigation";
        mobileNav.querySelector("a")?.focus();
      }
    });
    mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !mobileNav.hidden) closeMenu({ restoreFocus: true });
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });
  }

  document.querySelectorAll("[data-screenshot-gallery]").forEach((gallery) => {
    const track = gallery.querySelector("[data-screenshot-track]");
    const triggers = [...gallery.querySelectorAll("[data-screenshot-open]")];
    const viewer = gallery.querySelector("[data-screenshot-viewer]");
    if (!track || !viewer || triggers.length === 0) return;

    const railPrevious = gallery.querySelector('[data-screenshot-scroll="previous"]');
    const railNext = gallery.querySelector('[data-screenshot-scroll="next"]');
    const viewerImage = viewer.querySelector("[data-screenshot-viewer-image]");
    const viewerTitle = viewer.querySelector("[data-screenshot-viewer-title]");
    const viewerCaption = viewer.querySelector("[data-screenshot-viewer-caption]");
    const viewerCounter = viewer.querySelector("[data-screenshot-counter]");
    const viewerPrevious = viewer.querySelector('[data-screenshot-viewer-nav="previous"]');
    const viewerNext = viewer.querySelector('[data-screenshot-viewer-nav="next"]');
    const viewerClose = viewer.querySelector("[data-screenshot-close]");
    const viewerStage = viewer.querySelector("[data-screenshot-viewer-stage]");
    const zoomOut = viewer.querySelector('[data-screenshot-zoom="out"]');
    const zoomIn = viewer.querySelector('[data-screenshot-zoom="in"]');
    const zoomReset = viewer.querySelector('[data-screenshot-zoom="reset"]');
    const zoomLevel = viewer.querySelector("[data-screenshot-zoom-level]");
    let activeIndex = 0;
    let activeTrigger = null;
    let scrollFrame = 0;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let panPointer = null;
    let pointerX = 0;
    let pointerY = 0;

    const updateRailControls = () => {
      const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
      if (railPrevious) railPrevious.disabled = track.scrollLeft <= 2;
      if (railNext) railNext.disabled = track.scrollLeft >= maximum - 2;
    };
    const scrollRail = (direction) => {
      const firstCard = track.querySelector(".screenshot-card");
      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
      const distance = firstCard ? firstCard.getBoundingClientRect().width + gap : track.clientWidth * .82;
      track.scrollBy({ left: direction * distance, behavior: "smooth" });
    };
    railPrevious?.addEventListener("click", () => scrollRail(-1));
    railNext?.addEventListener("click", () => scrollRail(1));
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(updateRailControls);
    }, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(updateRailControls).observe(track);
    updateRailControls();

    const panLimits = () => {
      const stageWidth = viewerStage.clientWidth;
      const stageHeight = viewerStage.clientHeight;
      const sourceWidth = viewerImage.naturalWidth || viewerImage.width || 1;
      const sourceHeight = viewerImage.naturalHeight || viewerImage.height || 1;
      const imageRatio = sourceWidth / sourceHeight;
      const stageRatio = stageWidth / Math.max(1, stageHeight);
      const renderedWidth = imageRatio > stageRatio ? stageWidth : stageHeight * imageRatio;
      const renderedHeight = imageRatio > stageRatio ? stageWidth / imageRatio : stageHeight;
      return {
        x: Math.max(0, (renderedWidth * zoom - stageWidth) / 2),
        y: Math.max(0, (renderedHeight * zoom - stageHeight) / 2)
      };
    };
    const applyViewerTransform = () => {
      const limits = panLimits();
      panX = Math.max(-limits.x, Math.min(limits.x, panX));
      panY = Math.max(-limits.y, Math.min(limits.y, panY));
      viewerImage.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
      viewerStage.dataset.zoomed = String(zoom > 1);
      zoomLevel.value = `${Math.round(zoom * 100)}%`;
      zoomLevel.textContent = zoomLevel.value;
      zoomOut.disabled = zoom <= 1;
      zoomIn.disabled = zoom >= 4;
      zoomReset.disabled = zoom === 1 && panX === 0 && panY === 0;
    };
    const setZoom = (nextZoom, origin = null) => {
      const previousZoom = zoom;
      zoom = Math.max(1, Math.min(4, Math.round(nextZoom * 4) / 4));
      if (origin && zoom !== previousZoom) {
        const bounds = viewerStage.getBoundingClientRect();
        const pointX = origin.clientX - bounds.left - bounds.width / 2;
        const pointY = origin.clientY - bounds.top - bounds.height / 2;
        const ratio = zoom / previousZoom;
        panX = pointX - (pointX - panX) * ratio;
        panY = pointY - (pointY - panY) * ratio;
      }
      if (zoom === 1) {
        panX = 0;
        panY = 0;
      }
      applyViewerTransform();
    };
    const resetViewerTransform = () => {
      zoom = 1;
      panX = 0;
      panY = 0;
      applyViewerTransform();
    };

    const renderViewerItem = (index) => {
      activeIndex = Math.max(0, Math.min(index, triggers.length - 1));
      const trigger = triggers[activeIndex];
      resetViewerTransform();
      viewerImage.src = trigger.dataset.full || "";
      viewerImage.width = Number.parseInt(trigger.dataset.width, 10) || 1600;
      viewerImage.height = Number.parseInt(trigger.dataset.height, 10) || 900;
      viewerImage.alt = trigger.dataset.alt || "Product screenshot";
      viewerTitle.textContent = trigger.dataset.title || "Product screenshot";
      viewerCaption.textContent = trigger.dataset.caption || "";
      viewerCounter.textContent = `${activeIndex + 1} of ${triggers.length}`;
      viewerPrevious.disabled = activeIndex === 0;
      viewerNext.disabled = activeIndex === triggers.length - 1;
      const following = triggers[activeIndex + 1];
      if (following?.dataset.full) {
        const preload = new Image();
        preload.src = following.dataset.full;
      }
    };
    const openViewer = (trigger) => {
      activeTrigger = trigger;
      renderViewerItem(triggers.indexOf(trigger));
      if (typeof viewer.showModal === "function") {
        viewer.showModal();
        document.body.classList.add("screenshot-viewer-open");
        viewerClose?.focus();
      } else {
        window.open(trigger.dataset.full || "", "_blank", "noopener");
      }
    };
    const closeViewer = () => {
      if (viewer.open) viewer.close();
    };
    const navigateViewer = (direction) => renderViewerItem(activeIndex + direction);

    triggers.forEach((trigger) => trigger.addEventListener("click", () => openViewer(trigger)));
    viewerPrevious?.addEventListener("click", () => navigateViewer(-1));
    viewerNext?.addEventListener("click", () => navigateViewer(1));
    viewerClose?.addEventListener("click", closeViewer);
    zoomOut?.addEventListener("click", () => setZoom(zoom - .25));
    zoomIn?.addEventListener("click", () => setZoom(zoom + .25));
    zoomReset?.addEventListener("click", resetViewerTransform);
    viewerStage?.addEventListener("wheel", (event) => {
      event.preventDefault();
      setZoom(zoom + (event.deltaY < 0 ? .25 : -.25), event);
    }, { passive: false });
    viewerStage?.addEventListener("dblclick", (event) => {
      setZoom(zoom === 1 ? 2 : 1, event);
    });
    viewerStage?.addEventListener("pointerdown", (event) => {
      if (zoom <= 1 || panPointer !== null) return;
      event.preventDefault();
      panPointer = event.pointerId;
      pointerX = event.clientX;
      pointerY = event.clientY;
      viewerStage.classList.add("is-panning");
      viewerStage.setPointerCapture?.(event.pointerId);
    });
    viewerStage?.addEventListener("pointermove", (event) => {
      if (event.pointerId !== panPointer) return;
      panX += event.clientX - pointerX;
      panY += event.clientY - pointerY;
      pointerX = event.clientX;
      pointerY = event.clientY;
      applyViewerTransform();
    });
    const endPan = (event) => {
      if (event.pointerId !== panPointer) return;
      viewerStage.releasePointerCapture?.(event.pointerId);
      panPointer = null;
      viewerStage.classList.remove("is-panning");
    };
    viewerStage?.addEventListener("pointerup", endPan);
    viewerStage?.addEventListener("pointercancel", endPan);
    viewerImage.addEventListener("load", applyViewerTransform);
    viewer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer();
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom(zoom + .25);
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        setZoom(zoom - .25);
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        resetViewerTransform();
        return;
      }
      if (event.key === "ArrowLeft" && activeIndex > 0) {
        event.preventDefault();
        navigateViewer(-1);
      }
      if (event.key === "ArrowRight" && activeIndex < triggers.length - 1) {
        event.preventDefault();
        navigateViewer(1);
      }
    });
    viewer.addEventListener("close", () => {
      document.body.classList.remove("screenshot-viewer-open");
      resetViewerTransform();
      viewerImage.removeAttribute("src");
      activeTrigger?.focus();
    });
  });

  const form = document.querySelector("[data-interest-form]");
  if (!form) return;

  const inquiryTypes = new Set(["briefing", "pilot", "partnership"]);
  const inquiryType = inquiryTypes.has(form.dataset.inquiryType) ? form.dataset.inquiryType : "briefing";
  const fallbackLabels = {
    briefing: "Briefing request",
    pilot: "Pilot discussion",
    partnership: "Partnership inquiry"
  };

  const honeypot = document.createElement("input");
  honeypot.type = "text";
  honeypot.name = "company";
  honeypot.autocomplete = "off";
  honeypot.tabIndex = -1;
  honeypot.setAttribute("aria-hidden", "true");
  honeypot.className = "honeypot";
  form.appendChild(honeypot);

  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const summaryFields = [...form.querySelectorAll("[data-summary-field]")];
  const setError = (name, message) => {
    const field = form.elements.namedItem(name);
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (error) error.textContent = message;
    if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
  };
  const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const normalizeValue = (value) => String(value || "").replace(/\r\n?/g, "\n").trim();
  const readSummaryValue = (field, data = new FormData(form)) => {
    const name = field.dataset.fieldName;
    if (field.dataset.fieldType === "checkbox-group") {
      return [...field.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => normalizeValue(input.value)).filter(Boolean).join(", ");
    }
    return normalizeValue(data.get(name));
  };
  const setSummaryError = (field, message) => {
    const name = field.dataset.fieldName;
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    field.querySelectorAll("input, select, textarea").forEach((control) => control.setAttribute("aria-invalid", message ? "true" : "false"));
  };
  const requiredMessage = (field) => field.dataset.fieldType === "checkbox-group"
    ? "Please select at least one option."
    : `${field.dataset.fieldType === "select" ? "Please select" : "Please enter"} ${field.dataset.summaryLabel.toLowerCase()}.`;
  const focusFirstInvalidField = () => {
    const target = form.querySelector('input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]');
    if (!target) return;
    target.focus({ preventScroll: true });
    const stickyOffset = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sticky-header-offset")) || 0;
    const bounds = target.getBoundingClientRect();
    const bottomClearance = 16;
    if (bounds.top < stickyOffset || bounds.bottom > window.innerHeight - bottomClearance) {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: Math.max(0, window.scrollY + bounds.top - stickyOffset), behavior: "auto" });
      root.style.scrollBehavior = previousScrollBehavior;
    }
  };
  const buildMessage = (data) => {
    const sections = [`Inquiry type: ${fallbackLabels[inquiryType]}`];
    for (const field of summaryFields) {
      const value = readSummaryValue(field, data);
      if (value) sections.push(`${field.dataset.summaryLabel}:\n${value}`);
    }
    return sections.join("\n\n").trim();
  };
  const decodeEmail = () => {
    try { return atob(form.dataset.email || ""); } catch { return ""; }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const summaryValues = summaryFields.map((field) => ({ field, value: readSummaryValue(field, data) }));
    const values = {
      role: String(data.get("role") || "").trim(),
      name: String(data.get("name") || "").trim(),
      organization: String(data.get("org") || "").trim() || "-",
      email: String(data.get("email") || "").trim(),
      updates: data.get("updates") ? "Yes" : "No",
      inquiryType,
      page: window.location.href,
      ts: new Date().toISOString()
    };

    setError("role", values.role ? "" : "Please select one.");
    setError("name", values.name ? "" : "Please enter your name.");
    setError("email", validEmail(values.email) ? "" : "Please enter a valid email.");
    let configuredFieldsValid = true;
    for (const { field, value } of summaryValues) {
      const message = field.dataset.required === "true" && !value ? requiredMessage(field) : "";
      setSummaryError(field, message);
      if (message) configuredFieldsValid = false;
    }
    const formIsValid = values.role && values.name && validEmail(values.email) && configuredFieldsValid;
    if (honeypot.value.trim()) return;
    if (!formIsValid) {
      focusFirstInvalidField();
      return;
    }
    values.message = buildMessage(data);

    const endpoint = form.dataset.endpoint || "";
    if (endpoint) {
      const submitLabel = submitButton.textContent;
      try {
        submitButton.disabled = true;
        submitButton.textContent = "Sending…";
        status.textContent = "Sending your request…";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(values)
        });
        if (response.ok) {
          form.reset();
          status.textContent = "Sent. Thank you — we will get back to you.";
          return;
        }
        status.textContent = "Form delivery was unavailable. Opening your email application…";
      } catch {
        status.textContent = "Form delivery was unavailable. Opening your email application…";
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      }
    }

    const recipient = decodeEmail();
    const subject = encodeURIComponent(`Project Bantay Bayan — ${fallbackLabels[inquiryType]} (${values.role})`);
    const body = encodeURIComponent(`Role: ${values.role}\nName: ${values.name}\nOrganization: ${values.organization}\nEmail: ${values.email}\nPBB updates: ${values.updates}\n\n${values.message}\n`);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  });

  for (const name of ["role", "name", "email"]) {
    const field = form.elements.namedItem(name);
    field?.addEventListener(name === "role" ? "change" : "input", () => {
      const value = normalizeValue(field.value);
      if ((name === "email" && validEmail(value)) || (name !== "email" && value)) setError(name, "");
    });
  }
  for (const field of summaryFields) {
    field.querySelectorAll("input, select, textarea").forEach((control) => control.addEventListener(control.type === "checkbox" || control.tagName === "SELECT" ? "change" : "input", () => {
      if (readSummaryValue(field)) setSummaryError(field, "");
    }));
  }
})();
