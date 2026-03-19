import { createElement } from "./ui.dom.js";
import { createActionModal } from "./ui.modal.js";
import { getSemanticStatusIcon } from "./ui.semantic.icons.js";

export function uiAlert(message, options = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const dialogVariant = normalizeDialogVariant(options.variant);
    const content = createDialogContent(message, options, dialogVariant);

    const modal = createActionModal({
      title: options.title || "Notice",
      content,
      actions: [
        {
          id: "ok",
          label: options.okText || "OK",
          variant: options.okVariant || getDefaultActionVariant(dialogVariant, "primary"),
          icon: options.okIcon || "",
          iconPosition: options.okIconPosition || "start",
          iconOnly: Boolean(options.okIconOnly),
          ariaLabel: options.okAriaLabel || "",
          autoFocus: true,
          onClick() {
            if (settled) {
              return;
            }
            settled = true;
            resolve(true);
          },
        },
      ],
      headerActions: Array.isArray(options.headerActions) ? options.headerActions : [],
      size: options.size || "sm",
      closeOnBackdrop: Boolean(options.allowBackdropClose),
      closeOnEscape: options.allowEscClose !== false,
      parent: options.parent || document.body,
      className: buildDialogClassName(options.className, dialogVariant),
      showCloseButton: options.showCloseButton !== false,
      onClose() {
        if (settled) {
          modal.destroy();
          return;
        }
        settled = true;
        resolve(true);
        modal.destroy();
      },
    });
    modal.open();
    speakDialog(options, {
      title: options.title || "Notice",
      message,
      description: options.description || "",
    });
  });
}

export function uiConfirm(message, options = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const dialogVariant = normalizeDialogVariant(options.variant);
    const content = createDialogContent(message, options, dialogVariant);

    const modal = createActionModal({
      title: options.title || "Confirm",
      content,
      actions: [
        {
          id: "cancel",
          label: options.cancelText || "Cancel",
          variant: "default",
          icon: options.cancelIcon || "",
          iconPosition: options.cancelIconPosition || "start",
          iconOnly: Boolean(options.cancelIconOnly),
          ariaLabel: options.cancelAriaLabel || "",
          onClick() {
            if (settled) {
              return;
            }
            settled = true;
            resolve(false);
          },
        },
        {
          id: "confirm",
          label: options.confirmText || "Confirm",
          variant: options.confirmVariant || getDefaultActionVariant(dialogVariant, "primary"),
          icon: options.confirmIcon || "",
          iconPosition: options.confirmIconPosition || "start",
          iconOnly: Boolean(options.confirmIconOnly),
          ariaLabel: options.confirmAriaLabel || "",
          autoFocus: true,
          onClick() {
            if (settled) {
              return;
            }
            settled = true;
            resolve(true);
          },
        },
      ],
      headerActions: Array.isArray(options.headerActions) ? options.headerActions : [],
      size: options.size || "sm",
      closeOnBackdrop: Boolean(options.allowBackdropClose),
      closeOnEscape: options.allowEscClose !== false,
      parent: options.parent || document.body,
      className: buildDialogClassName(options.className, dialogVariant),
      showCloseButton: options.showCloseButton !== false,
      onClose() {
        if (settled) {
          modal.destroy();
          return;
        }
        settled = true;
        resolve(false);
        modal.destroy();
      },
    });
    modal.open();
    speakDialog(options, {
      title: options.title || "Confirm",
      message,
      description: options.description || "",
    });
  });
}

export function uiPrompt(message, options = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const dialogVariant = normalizeDialogVariant(options.variant);
    const input = createElement("input", {
      className: "ui-input",
      attrs: { type: "text", placeholder: options.placeholder || "" },
    });
    input.value = String(options.defaultValue || "");
    const content = createDialogContent(message, options, dialogVariant, input);

    const modal = createActionModal({
      title: options.title || "Input",
      content,
      actions: [
        {
          id: "cancel",
          label: options.cancelText || "Cancel",
          variant: "default",
          icon: options.cancelIcon || "",
          iconPosition: options.cancelIconPosition || "start",
          iconOnly: Boolean(options.cancelIconOnly),
          ariaLabel: options.cancelAriaLabel || "",
          onClick() {
            if (settled) {
              return;
            }
            settled = true;
            resolve(null);
          },
        },
        {
          id: "submit",
          label: options.submitText || "Submit",
          variant: options.submitVariant || getDefaultActionVariant(dialogVariant, "primary"),
          icon: options.submitIcon || "",
          iconPosition: options.submitIconPosition || "start",
          iconOnly: Boolean(options.submitIconOnly),
          ariaLabel: options.submitAriaLabel || "",
          onClick() {
            if (settled) {
              return;
            }
            settled = true;
            resolve(input.value);
          },
        },
      ],
      headerActions: Array.isArray(options.headerActions) ? options.headerActions : [],
      size: options.size || "sm",
      closeOnBackdrop: Boolean(options.allowBackdropClose),
      closeOnEscape: options.allowEscClose !== false,
      parent: options.parent || document.body,
      className: buildDialogClassName(options.className, dialogVariant),
      showCloseButton: options.showCloseButton !== false,
      initialFocus: input,
      onClose() {
        if (settled) {
          modal.destroy();
          return;
        }
        settled = true;
        resolve(null);
        modal.destroy();
      },
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (settled) {
          return;
        }
        settled = true;
        resolve(input.value);
        modal.close({ reason: "prompt-enter", result: input.value }).then(() => modal.destroy());
      }
    });
    modal.open();
    speakDialog(options, {
      title: options.title || "Input",
      message,
      description: options.description || "",
    });
    input.focus();
    input.select();
  });
}

function normalizeDialogVariant(variant) {
  const value = String(variant || "default").toLowerCase();
  if (value === "success" || value === "info" || value === "warning" || value === "error" || value === "default") {
    return value;
  }
  return "default";
}

function buildDialogClassName(className, variant) {
  const classes = ["ui-dialog"];
  if (variant && variant !== "default") {
    classes.push(`ui-dialog--${variant}`);
  }
  if (className) {
    classes.push(String(className).trim());
  }
  return classes.join(" ").trim();
}

function getDefaultActionVariant(dialogVariant, fallback = "primary") {
  if (dialogVariant === "error" || dialogVariant === "warning") {
    return "danger";
  }
  if (dialogVariant === "success" || dialogVariant === "info") {
    return "primary";
  }
  return fallback;
}

function createDialogContent(message, options, variant, extraContent = null) {
  const content = createElement("div", { className: `ui-dialog-body${extraContent ? " ui-dialog-prompt-body" : ""}` });
  const iconMarkup = resolveVariantIcon(options, variant);
  const textStack = createElement("div", { className: "ui-dialog-text" });
  if (iconMarkup) {
    const iconEl = createElement("div", {
      className: "ui-dialog-variant-icon",
      attrs: { "aria-hidden": "true" },
      html: iconMarkup,
    });
    content.appendChild(iconEl);
  }
  const messageEl = createElement("p", { className: "ui-dialog-message", text: String(message || "") });
  textStack.appendChild(messageEl);
  const description = String(options.description || "").trim();
  if (description) {
    const descriptionEl = createElement("p", {
      className: "ui-dialog-description",
      text: description,
    });
    textStack.appendChild(descriptionEl);
  }
  content.appendChild(textStack);
  if (extraContent) {
    content.appendChild(extraContent);
  }
  return content;
}

function resolveVariantIcon(options, variant) {
  if (options.showVariantIcon === false) {
    return "";
  }
  if (options.variantIcon) {
    return String(options.variantIcon);
  }
  if (!variant || variant === "default") {
    return "";
  }
  return getSemanticStatusIcon(variant);
}

function speakDialog(options, payload) {
  if (!options || !options.speak) {
    return;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
    return;
  }
  const text = String(options.speakText || defaultDialogSpeakText(payload)).trim();
  if (!text) {
    return;
  }
  const utterance = new window.SpeechSynthesisUtterance(text);
  const voiceName = String(options.voiceName || "").trim();
  if (voiceName) {
    const voice = window.speechSynthesis.getVoices().find((entry) => entry?.name === voiceName);
    if (voice) {
      utterance.voice = voice;
    }
  }
  if (Number.isFinite(Number(options.speakRate))) {
    utterance.rate = Math.max(0.5, Math.min(2, Number(options.speakRate)));
  }
  if (Number.isFinite(Number(options.speakPitch))) {
    utterance.pitch = Math.max(0, Math.min(2, Number(options.speakPitch)));
  }
  if (Number.isFinite(Number(options.speakVolume))) {
    utterance.volume = Math.max(0, Math.min(1, Number(options.speakVolume)));
  }
  window.setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance);
    } catch (_error) {
      // Intentionally ignore speech synthesis failures.
    }
  }, 0);
}

function defaultDialogSpeakText(payload) {
  const parts = [
    String(payload?.title || "").trim(),
    String(payload?.message || "").trim(),
    String(payload?.description || "").trim(),
  ].filter(Boolean);
  return parts.join(". ");
}
