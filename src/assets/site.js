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
