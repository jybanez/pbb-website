import { createElement, clearNode } from "./ui.dom.js";
import { getSemanticStatusIcon } from "./ui.semantic.icons.js";

const DEFAULT_OPTIONS = {
  className: "",
  position: "top-right", // top-right | top-left | bottom-right | bottom-left
  max: 5,
  defaultDuration: 3200,
  pauseOnHover: true,
  speak: false,
  speakTypes: ["error", "warn"],
  speakRate: 1,
  speakPitch: 1,
  speakVolume: 1,
  voiceName: "",
  speakFormatter: null, // (toast) => string
  speakCooldownMs: 0,
  waitForSpeechBeforeDismiss: true,
};

export function createToastStack(options = {}) {
  const currentOptions = normalizeOptions(options);
  const root = createElement("section", {
    className: [
      "ui-toast-stack",
      `ui-toast-stack--${normalizePosition(currentOptions.position)}`,
      currentOptions.className || "",
    ].filter(Boolean).join(" "),
    attrs: { "aria-live": "polite", "aria-atomic": "false" },
  });
  const timers = new Map();
  const states = [];
  let destroyed = false;
  let lastSpokenAt = 0;

  document.body.appendChild(root);

  function show(message, toastOptions = {}) {
    if (destroyed) {
      return null;
    }
    const type = normalizeType(toastOptions.type);
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = resolveDuration(toastOptions.duration, currentOptions.defaultDuration);
    const titleText = toastOptions.title == null ? "" : String(toastOptions.title);
    const row = createElement("article", {
      className: `ui-toast ui-toast--${type}`,
      attrs: { role: "status", "data-toast-id": id },
    });

    const iconMarkup = resolveVariantIcon(currentOptions, toastOptions, type);
    if (iconMarkup) {
      row.appendChild(createElement("div", {
        className: "ui-toast-icon",
        attrs: { "aria-hidden": "true" },
        html: iconMarkup,
      }));
    }
    const content = createElement("div", { className: "ui-toast-content" });
    if (titleText) {
      content.appendChild(createElement("h4", { className: "ui-toast-title", text: titleText }));
    }
    content.appendChild(createElement("p", {
      className: "ui-toast-message",
      text: String(message == null ? "" : message),
    }));
    const close = createElement("button", {
      className: "ui-toast-close",
      attrs: { type: "button", "aria-label": "Close notification", title: "Close" },
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    });
    close.addEventListener("click", () => dismiss(id));
    row.append(content, close);

    root.appendChild(row);
    const toast = { id, type, message: String(message ?? ""), title: titleText, createdAt: Date.now() };
    states.push(toast);
    trimToMax();
    const shouldWaitForSpeech =
      resolveSpeakEnabled(currentOptions, toastOptions) &&
      Boolean(currentOptions.waitForSpeechBeforeDismiss);
    let isHovering = false;
    let autoDismissReady = !shouldWaitForSpeech;
    let remaining = duration;
    let start = 0;

    const startAutoDismiss = () => {
      if (destroyed || !autoDismissReady || isHovering || remaining <= 0) {
        return;
      }
      const existingTimer = timers.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      start = Date.now();
      const timer = setTimeout(() => dismiss(id), remaining);
      timers.set(id, timer);
    };

    if (currentOptions.pauseOnHover && duration > 0) {
      const onEnter = () => {
        isHovering = true;
        const timer = timers.get(id);
        if (timer) {
          clearTimeout(timer);
          timers.delete(id);
          remaining = Math.max(0, remaining - (Date.now() - start));
        }
      };
      const onLeave = () => {
        isHovering = false;
        startAutoDismiss();
      };
      row.addEventListener("mouseenter", onEnter);
      row.addEventListener("mouseleave", onLeave);
    }

    if (duration > 0) {
      if (shouldWaitForSpeech) {
        speakToast(toast, toastOptions).finally(() => {
          if (destroyed) {
            return;
          }
          const exists = states.some((item) => String(item.id) === String(id));
          if (!exists) {
            return;
          }
          autoDismissReady = true;
          startAutoDismiss();
        });
      } else {
        speakToast(toast, toastOptions);
        startAutoDismiss();
      }
    } else {
      speakToast(toast, toastOptions);
    }
    return id;
  }

  function dismiss(id) {
    const key = String(id);
    const timer = timers.get(key);
    if (timer) {
      clearTimeout(timer);
      timers.delete(key);
    }
    const row = root.querySelector(`[data-toast-id="${cssEscape(key)}"]`);
    if (row && row.parentNode) {
      row.classList.add("is-closing");
      const cleanup = () => {
        row.removeEventListener("transitionend", cleanup);
        if (row.parentNode) {
          row.parentNode.removeChild(row);
        }
      };
      row.addEventListener("transitionend", cleanup);
      setTimeout(cleanup, 220);
    }
    const index = states.findIndex((item) => String(item.id) === key);
    if (index >= 0) {
      states.splice(index, 1);
    }
  }

  function trimToMax() {
    const max = Math.max(1, Number(currentOptions.max) || 5);
    while (states.length > max) {
      const oldest = states.shift();
      if (oldest) {
        dismiss(oldest.id);
      }
    }
  }

  function clear() {
    Array.from(states).forEach((item) => dismiss(item.id));
    states.length = 0;
    clearNode(root);
  }

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    states.length = 0;
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
  }

  function getState() {
    return {
      options: { ...currentOptions },
      items: states.map((item) => ({ ...item })),
    };
  }

  function speakToast(toast, toastOptions = {}) {
    const canSpeak = resolveSpeakEnabled(currentOptions, toastOptions);
    if (!canSpeak) {
      return Promise.resolve(false);
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
      return Promise.resolve(false);
    }
    const allowTypes = Array.isArray(currentOptions.speakTypes) ? currentOptions.speakTypes.map((item) => String(item).toLowerCase()) : [];
    if (allowTypes.length && !allowTypes.includes(String(toast.type).toLowerCase())) {
      return Promise.resolve(false);
    }
    const now = Date.now();
    const cooldown = Math.max(0, Number(currentOptions.speakCooldownMs) || 0);
    if (cooldown > 0 && now - lastSpokenAt < cooldown) {
      return Promise.resolve(false);
    }
    lastSpokenAt = now;

    const formatter = typeof currentOptions.speakFormatter === "function"
      ? currentOptions.speakFormatter
      : defaultSpeakFormatter;
    const text = String(formatter(toast) || "").trim();
    if (!text) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = clampNumber(currentOptions.speakRate, 0.5, 2, 1);
      utterance.pitch = clampNumber(currentOptions.speakPitch, 0, 2, 1);
      utterance.volume = clampNumber(currentOptions.speakVolume, 0, 1, 1);
      const voiceName = resolveVoiceName(currentOptions, toastOptions);
      if (voiceName) {
        const voice = window.speechSynthesis.getVoices().find((entry) => entry?.name === voiceName);
        if (voice) {
          utterance.voice = voice;
        }
      }
      let settled = false;
      const done = (result) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(result);
      };
      utterance.onend = () => done(true);
      utterance.onerror = () => done(false);
      window.speechSynthesis.speak(utterance);
    });
  }

  return {
    show,
    success(message, options = {}) {
      return show(message, { ...options, type: "success" });
    },
    info(message, options = {}) {
      return show(message, { ...options, type: "info" });
    },
    warn(message, options = {}) {
      return show(message, { ...options, type: "warn" });
    },
    error(message, options = {}) {
      return show(message, { ...options, type: "error" });
    },
    dismiss,
    clear,
    destroy,
    getState,
    getVoices,
  };
}

function getVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices().map((voice) => ({
    name: voice?.name || "",
    lang: voice?.lang || "",
    default: Boolean(voice?.default),
    localService: Boolean(voice?.localService),
    voiceURI: voice?.voiceURI || "",
  }));
}

function resolveVoiceName(stackOptions, toastOptions) {
  if (toastOptions && typeof toastOptions.voiceName === "string" && toastOptions.voiceName.trim()) {
    return toastOptions.voiceName.trim();
  }
  return String(stackOptions.voiceName || "").trim();
}

function resolveSpeakEnabled(stackOptions, toastOptions) {
  if (toastOptions && Object.prototype.hasOwnProperty.call(toastOptions, "speak")) {
    return Boolean(toastOptions.speak);
  }
  return Boolean(stackOptions.speak);
}

function defaultSpeakFormatter(toast) {
  const title = String(toast?.title || "").trim();
  const message = String(toast?.message || "").trim();
  if (title && message) {
    return `${title}. ${message}`;
  }
  return title || message;
}

function resolveVariantIcon(stackOptions, toastOptions, type) {
  if (toastOptions && Object.prototype.hasOwnProperty.call(toastOptions, "showVariantIcon")) {
    if (!toastOptions.showVariantIcon) {
      return "";
    }
  } else if (stackOptions && Object.prototype.hasOwnProperty.call(stackOptions, "showVariantIcon")) {
    if (!stackOptions.showVariantIcon) {
      return "";
    }
  }
  if (toastOptions && toastOptions.variantIcon) {
    return String(toastOptions.variantIcon);
  }
  if (stackOptions && stackOptions.variantIcon) {
    return String(stackOptions.variantIcon);
  }
  return getSemanticStatusIcon(type);
}

function clampNumber(value, min, max, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, next));
}

function normalizeOptions(options) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };
}

function normalizePosition(position) {
  const value = String(position || "").toLowerCase();
  const allowed = ["top-right", "top-left", "bottom-right", "bottom-left"];
  return allowed.includes(value) ? value : "top-right";
}

function normalizeType(type) {
  const value = String(type || "").toLowerCase();
  const allowed = ["neutral", "success", "info", "warn", "error"];
  return allowed.includes(value) ? value : "neutral";
}

function resolveDuration(duration, fallback) {
  const value = Number(duration);
  if (Number.isFinite(value) && value >= 0) {
    return value;
  }
  const nextFallback = Number(fallback);
  return Number.isFinite(nextFallback) && nextFallback >= 0 ? nextFallback : 3200;
}

function cssEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(String(value));
  }
  return String(value).replace(/["\\]/g, "\\$&");
}
