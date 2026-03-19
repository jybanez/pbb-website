import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  className: "",
  title: "",
  ariaLabel: "Modal dialog",
  content: null,
  headerActions: null,
  footer: null,
  showHeader: true,
  showCloseButton: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  busy: false,
  busyMessage: "",
  closeWhileBusy: false,
  backdropCloseWhileBusy: false,
  escapeCloseWhileBusy: false,
  trapFocus: true,
  lockScroll: true,
  size: "md", // sm | md | lg | xl | full
  position: "center", // center | top
  animationMs: 180,
  initialFocus: null, // selector | HTMLElement | function(panel) => HTMLElement
  parent: null,
  onOpen: null,
  onClose: null,
  onBeforeClose: null,
};

const tabbableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

let bodyLockCount = 0;
let previousBodyOverflow = "";
let modalIdSeed = 0;

export function createModal(options = {}) {
  const events = createEventBag();
  let currentOptions = normalizeOptions(options);
  let open = false;
  let destroyed = false;
  let closeTimer = null;
  let lastResult = null;
  let lastFocusedElement = null;
  const titleId = `ui-modal-title-${++modalIdSeed}`;

  const root = createElement("div", { className: "ui-modal-root", attrs: { "aria-hidden": "true" } });
  const backdrop = createElement("div", { className: "ui-modal-backdrop" });
  const panel = createElement("section", {
    className: "ui-modal",
    attrs: { role: "dialog", "aria-modal": "true", tabindex: "-1" },
  });
  const header = createElement("header", { className: "ui-modal-header" });
  const titleEl = createElement("h3", { className: "ui-title ui-modal-title" });
  const headerActions = createElement("div", { className: "ui-modal-header-actions" });
  const closeButton = createElement("button", {
    className: "ui-button ui-modal-close",
    attrs: { type: "button", "aria-label": "Close modal", title: "Close" },
    html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  });
  const body = createElement("div", { className: "ui-modal-body" });
  const footer = createElement("footer", { className: "ui-modal-footer" });
  const busyLayer = createElement("div", {
    className: "ui-modal-busy",
    attrs: { hidden: "hidden", "aria-hidden": "true" },
  });
  const busyOverlay = createElement("div", { className: "ui-modal-busy-overlay" });
  const busySpinner = createElement("span", {
    className: "ui-modal-busy-spinner",
    attrs: { "aria-hidden": "true" },
  });
  const busyMessage = createElement("div", {
    className: "ui-modal-busy-message",
    attrs: { role: "status", "aria-live": "polite" },
  });

  header.append(titleEl, headerActions, closeButton);
  busyLayer.append(busyOverlay, busySpinner, busyMessage);
  panel.append(header, body, footer, busyLayer);
  root.append(backdrop, panel);

  events.on(backdrop, "click", () => {
    if (!open || !currentOptions.closeOnBackdrop) {
      return;
    }
    if (isBusy() && !currentOptions.backdropCloseWhileBusy) {
      return;
    }
    close({ reason: "backdrop" });
  });
  events.on(closeButton, "click", () => {
    if (!open) {
      return;
    }
    if (isBusy() && !currentOptions.closeWhileBusy) {
      return;
    }
    close({ reason: "close-button" });
  });

  function normalizeOptions(nextOptions) {
    return {
      ...DEFAULT_OPTIONS,
      ...(nextOptions || {}),
    };
  }

  function applyClasses() {
    const rootState = {
      mounted: root.classList.contains("is-mounted"),
      open: root.classList.contains("is-open"),
      closing: root.classList.contains("is-closing"),
    };
    root.className = `ui-modal-root ${currentOptions.className || ""}`.trim();
    root.classList.toggle("is-mounted", rootState.mounted);
    root.classList.toggle("is-open", rootState.open);
    root.classList.toggle("is-closing", rootState.closing);

    panel.className = "ui-modal";
    panel.classList.add(`is-size-${normalizeSize(currentOptions.size)}`);
    panel.classList.add(`is-pos-${normalizePosition(currentOptions.position)}`);
  }

  function applySlots() {
    const showHeader = Boolean(currentOptions.showHeader);
    const showCloseButton = Boolean(currentOptions.showCloseButton);
    const titleText = currentOptions.title == null ? "" : String(currentOptions.title);
    titleEl.textContent = titleText;
    titleEl.id = titleId;
    setSlot(headerActions, currentOptions.headerActions);
    headerActions.hidden = !headerActions.childNodes.length;

    header.hidden = !showHeader;
    closeButton.hidden = !showHeader || !showCloseButton;
    header.classList.toggle("is-empty", !titleText && headerActions.hidden && (!showCloseButton || closeButton.hidden));
    if (titleText) {
      panel.setAttribute("aria-labelledby", titleId);
      panel.removeAttribute("aria-label");
    } else {
      panel.removeAttribute("aria-labelledby");
      panel.setAttribute("aria-label", String(currentOptions.ariaLabel || "Modal dialog"));
    }

    setSlot(body, currentOptions.content);
    setSlot(footer, currentOptions.footer);
    footer.hidden = !footer.childNodes.length;
    syncBusyState();
  }

  function setSlot(target, value) {
    clearNode(target);
    if (value == null) {
      return;
    }
    if (typeof value === "function") {
      setSlot(target, value(panel));
      return;
    }
    if (value instanceof HTMLElement) {
      target.appendChild(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry) => setSlot(target, entry));
      return;
    }
    target.appendChild(document.createTextNode(String(value)));
  }

  function mount(parent = currentOptions.parent || document.body) {
    if (root.parentNode || !parent) {
      return;
    }
    parent.appendChild(root);
  }

  function unmount() {
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
  }

  function attachDocumentListeners() {
    document.addEventListener("keydown", onDocumentKeyDown, true);
  }

  function detachDocumentListeners() {
    document.removeEventListener("keydown", onDocumentKeyDown, true);
  }

  function onDocumentKeyDown(event) {
    if (!open) {
      return;
    }
    if (event.key === "Escape" && currentOptions.closeOnEscape) {
      if (isBusy() && !currentOptions.escapeCloseWhileBusy) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      close({ reason: "escape" });
      return;
    }
    if (event.key === "Tab" && currentOptions.trapFocus) {
      trapFocusInPanel(event);
    }
  }

  function trapFocusInPanel(event) {
    const focusable = getFocusable(panel);
    if (!focusable.length) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !panel.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  function getFocusable(node) {
    return Array.from(node.querySelectorAll(tabbableSelector)).filter((el) => {
      if (!(el instanceof HTMLElement)) {
        return false;
      }
      if (el.hasAttribute("disabled")) {
        return false;
      }
      if (el.getAttribute("aria-hidden") === "true") {
        return false;
      }
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function focusInitial() {
    const nextFocus = resolveInitialFocus();
    if (nextFocus) {
      nextFocus.focus();
      return;
    }
    const focusable = getFocusable(panel);
    if (focusable.length) {
      focusable[0].focus();
      return;
    }
    panel.focus();
  }

  function resolveInitialFocus() {
    const value = currentOptions.initialFocus;
    if (!value) {
      return null;
    }
    if (typeof value === "function") {
      const resolved = value(panel);
      return resolved instanceof HTMLElement ? resolved : null;
    }
    if (typeof value === "string") {
      const match = panel.querySelector(value);
      return match instanceof HTMLElement ? match : null;
    }
    return value instanceof HTMLElement ? value : null;
  }

  function lockBodyScroll() {
    if (!currentOptions.lockScroll) {
      return;
    }
    if (bodyLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow || "";
      document.body.style.overflow = "hidden";
      document.body.classList.add("ui-modal-body-lock");
    }
    bodyLockCount += 1;
  }

  function unlockBodyScroll() {
    if (!currentOptions.lockScroll) {
      return;
    }
    bodyLockCount = Math.max(0, bodyLockCount - 1);
    if (bodyLockCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
      document.body.classList.remove("ui-modal-body-lock");
    }
  }

  function restoreFocus() {
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      try {
        lastFocusedElement.focus();
      } catch (error) {
        // Ignore focus restore failures.
      }
    }
    lastFocusedElement = null;
  }

  function update(nextOptions = {}) {
    if (destroyed) {
      return;
    }
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    applyClasses();
    applySlots();
  }

  function isBusy() {
    return Boolean(currentOptions.busy);
  }

  function syncBusyState() {
    const busy = isBusy();
    const message = String(currentOptions.busyMessage || "").trim();
    panel.classList.toggle("is-busy", busy);
    panel.setAttribute("aria-busy", busy ? "true" : "false");
    busyLayer.hidden = !busy;
    busyLayer.setAttribute("aria-hidden", busy ? "false" : "true");
    busyMessage.textContent = message;
    syncBusyInteractivity(busy);
    if (busy && open) {
      panel.focus();
    }
  }

  function syncBusyInteractivity(busy) {
    toggleBusyDisabled(headerActions.querySelectorAll("button, input, select, textarea"), busy);
    toggleBusyDisabled(footer.querySelectorAll("button, input, select, textarea"), busy);
    toggleBusyDisabled(body.querySelectorAll("button, input, select, textarea"), busy);

    if (busy && !currentOptions.closeWhileBusy) {
      setBusyDisabled(closeButton, true);
    } else {
      setBusyDisabled(closeButton, false);
    }
  }

  function toggleBusyDisabled(nodes, busy) {
    Array.from(nodes || []).forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }
      setBusyDisabled(node, busy);
    });
  }

  function setBusyDisabled(node, busy) {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    if (!("disabled" in node)) {
      return;
    }
    if (busy) {
      if (!node.hasAttribute("data-ui-busy-managed")) {
        node.setAttribute("data-ui-busy-managed", "true");
        node.setAttribute("data-ui-busy-prev-disabled", node.disabled ? "true" : "false");
      }
      node.disabled = true;
      return;
    }
    if (!node.hasAttribute("data-ui-busy-managed")) {
      return;
    }
    const prevDisabled = node.getAttribute("data-ui-busy-prev-disabled") === "true";
    node.disabled = prevDisabled;
    node.removeAttribute("data-ui-busy-managed");
    node.removeAttribute("data-ui-busy-prev-disabled");
  }

  function openModal(content = undefined, nextOptions = undefined) {
    if (destroyed) {
      return false;
    }
    if (nextOptions && typeof nextOptions === "object") {
      currentOptions = normalizeOptions({ ...currentOptions, ...nextOptions });
    }
    if (content !== undefined) {
      currentOptions.content = content;
    }
    applyClasses();
    applySlots();

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    mount();
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    root.setAttribute("aria-hidden", "false");
    root.classList.remove("is-closing");
    root.classList.add("is-mounted");
    lockBodyScroll();
    attachDocumentListeners();

    open = true;
    requestAnimationFrame(() => {
      if (!open) {
        return;
      }
      root.classList.add("is-open");
      focusInitial();
    });
    currentOptions.onOpen?.({ panel, body, footer, header, headerActions, closeButton });
    return true;
  }

  async function close(meta = {}) {
    if (!open || destroyed) {
      return false;
    }
    const beforeClose = currentOptions.onBeforeClose;
    if (typeof beforeClose === "function") {
      const allowed = await beforeClose(meta);
      if (allowed === false) {
        return false;
      }
    }

    open = false;
    lastResult = meta?.result ?? null;
    root.classList.remove("is-open");
    root.classList.add("is-closing");
    root.setAttribute("aria-hidden", "true");
    detachDocumentListeners();
    unlockBodyScroll();

    const finalize = () => {
      if (open || destroyed) {
        return;
      }
      root.classList.remove("is-closing");
      root.classList.remove("is-mounted");
      unmount();
      restoreFocus();
      currentOptions.onClose?.(meta);
    };

    const onTransitionEnd = (event) => {
      if (event.target !== root) {
        return;
      }
      root.removeEventListener("transitionend", onTransitionEnd);
      finalize();
    };
    root.addEventListener("transitionend", onTransitionEnd);
    closeTimer = setTimeout(() => {
      root.removeEventListener("transitionend", onTransitionEnd);
      finalize();
      closeTimer = null;
    }, Math.max(120, Number(currentOptions.animationMs) || 180) + 120);
    return true;
  }

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    detachDocumentListeners();
    unlockBodyScroll();
    events.clear();
    unmount();
  }

  function getState() {
    return {
      open,
      options: { ...currentOptions },
      lastResult,
    };
  }

  update(currentOptions);

  return {
    open: openModal,
    close,
    update,
    setContent(content) {
      update({ content });
    },
    setFooter(nextFooter) {
      update({ footer: nextFooter });
    },
    setHeaderActions(nextHeaderActions) {
      update({ headerActions: nextHeaderActions });
    },
    setTitle(nextTitle) {
      update({ title: nextTitle });
    },
    setBusy(nextBusy, nextOptions = {}) {
      const busy = Boolean(nextBusy);
      const patch = { busy };
      if (nextOptions && Object.prototype.hasOwnProperty.call(nextOptions, "message")) {
        patch.busyMessage = nextOptions.message == null ? "" : String(nextOptions.message);
      }
      update(patch);
    },
    isBusy,
    destroy,
    getState,
    refs: {
      root,
      backdrop,
      panel,
      header,
      headerActions,
      title: titleEl,
      body,
      footer,
      closeButton,
      busyLayer,
      busyOverlay,
      busySpinner,
      busyMessage,
    },
  };
}

export function createActionModal(options = {}) {
  const actionOptions = normalizeActionModalOptions(options);
  let modal = null;

  function buildActionNodes(actions, placement) {
    if (!actions.length) {
      return null;
    }
    return actions.map((action) => createActionButton(action, placement));
  }

function createActionButton(action, placement) {
    const button = createElement("button", {
      className: getActionButtonClass(action),
      attrs: {
        type: "button",
        "aria-label": action.iconOnly ? action.ariaLabel || action.label : null,
        title: action.iconOnly ? action.ariaLabel || action.label : null,
        ...(action.disabled ? { disabled: "disabled" } : {}),
      },
    });
    const content = createElement("span", {
      className: `ui-action-modal-button-content${action.iconPosition === "end" ? " is-end" : ""}`,
    });
    if (action.icon) {
      content.appendChild(createElement("span", {
        className: "ui-action-modal-button-icon",
        html: String(action.icon),
      }));
    }
    if (!action.iconOnly || !action.icon) {
      content.appendChild(createElement("span", {
        className: "ui-action-modal-button-label",
        text: action.label,
      }));
    }
    button.appendChild(content);
    if (action.autoFocus) {
      button.setAttribute("data-action-autofocus", "true");
    }
    button.addEventListener("click", async (event) => {
      if (modal?.isBusy?.()) {
        event.preventDefault();
        return;
      }
      const context = { action, modal, event, placement };
      let result;
      if (typeof action.onClick === "function") {
        result = action.onClick(context);
        if (actionOptions.autoBusy && isPromiseLike(result)) {
          modal?.setBusy(true, { message: action.busyMessage || actionOptions.busyMessage || "" });
          try {
            result = await result;
          } finally {
            if (modal && modal.getState().open) {
              modal.setBusy(false);
            }
          }
        } else {
          result = await result;
        }
      }
      if (action.closeOnClick !== false && result !== false) {
        await modal?.close({
          reason: "action",
          placement,
          actionId: action.id,
          actionLabel: action.label,
          result,
        });
      }
    });
    return button;
  }

  function buildFooter(actions) {
    if (!actions.length) {
      return null;
    }
    const footer = createElement("div", { className: "ui-dialog-footer-actions" });
    buildActionNodes(actions, "footer").forEach((node) => footer.appendChild(node));
    return footer;
  }

  function getInitialFocus() {
    if (typeof actionOptions.initialFocus !== "undefined" && actionOptions.initialFocus !== null) {
      return actionOptions.initialFocus;
    }
    return (panel) => panel.querySelector("[data-action-autofocus='true']");
  }

  modal = createModal({
    ...actionOptions,
    initialFocus: getInitialFocus(),
    headerActions: buildActionNodes(actionOptions.headerActions, "header"),
    footer: buildFooter(actionOptions.actions),
  });

  function setActions(nextActions = []) {
    const normalized = normalizeActions(nextActions);
    actionOptions.actions = normalized;
    modal.setFooter(buildFooter(normalized));
    return normalized;
  }

  function setHeaderActions(nextHeaderActions = []) {
    const normalized = normalizeActions(nextHeaderActions);
    actionOptions.headerActions = normalized;
    modal.setHeaderActions(buildActionNodes(normalized, "header"));
    return normalized;
  }

  const originalUpdate = modal.update;
  modal.update = (nextOptions = {}) => {
    if (nextOptions && Object.prototype.hasOwnProperty.call(nextOptions, "actions")) {
      setActions(nextOptions.actions);
    }
    if (nextOptions && Object.prototype.hasOwnProperty.call(nextOptions, "headerActions")) {
      setHeaderActions(nextOptions.headerActions);
    }
    if (
      nextOptions
      && (
        Object.prototype.hasOwnProperty.call(nextOptions, "actions")
        || Object.prototype.hasOwnProperty.call(nextOptions, "headerActions")
      )
    ) {
      const copy = { ...(nextOptions || {}) };
      delete copy.actions;
      delete copy.headerActions;
      originalUpdate(copy);
      return;
    }
    originalUpdate(nextOptions);
  };

  return {
    ...modal,
    setActions,
    setHeaderActions,
  };
}

function normalizeSize(size) {
  const value = String(size || "md").toLowerCase();
  if (value === "sm" || value === "md" || value === "lg" || value === "xl" || value === "full") {
    return value;
  }
  return "md";
}

function normalizePosition(position) {
  const value = String(position || "center").toLowerCase();
  return value === "top" ? "top" : "center";
}

function normalizeActionModalOptions(options = {}) {
  const next = { ...(options || {}) };
  next.actions = normalizeActions(options.actions);
  next.headerActions = normalizeActions(options.headerActions);
  next.autoBusy = options?.autoBusy !== false;
  return next;
}

function normalizeActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .map((action, index) => {
      if (!action || typeof action !== "object") {
        return null;
      }
      const label = String(action.label ?? "").trim();
      if (!label) {
        return null;
      }
      return {
        id: String(action.id ?? `action-${index}`),
        label,
        variant: normalizeActionVariant(action.variant),
        className: String(action.className || "").trim(),
        icon: action.icon ? String(action.icon) : "",
        iconPosition: String(action.iconPosition || "start").toLowerCase() === "end" ? "end" : "start",
        iconOnly: Boolean(action.iconOnly),
        ariaLabel: String(action.ariaLabel || "").trim(),
        busyMessage: String(action.busyMessage || "").trim(),
        onClick: typeof action.onClick === "function" ? action.onClick : null,
        closeOnClick: action.closeOnClick !== false,
        disabled: Boolean(action.disabled),
        autoFocus: Boolean(action.autoFocus),
      };
    })
    .filter(Boolean);
}

function normalizeActionVariant(variant) {
  const value = String(variant || "default").toLowerCase();
  if (value === "primary" || value === "danger" || value === "ghost" || value === "default") {
    return value;
  }
  return "default";
}

function getActionButtonClass(action) {
  const classes = ["ui-button", "ui-action-modal-button"];
  if (action.variant === "primary") {
    classes.push("ui-button-primary");
  } else if (action.variant === "danger") {
    classes.push("ui-button-danger");
  } else if (action.variant === "ghost") {
    classes.push("ui-button-ghost");
  }
  if (action.iconOnly && action.icon) {
    classes.push("is-icon-only");
  }
  if (action.className) {
    classes.push(action.className);
  }
  return classes.join(" ");
}

function isPromiseLike(value) {
  return Boolean(value) && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
}

