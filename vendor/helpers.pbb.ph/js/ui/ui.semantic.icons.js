export const SEMANTIC_STATUS_ICONS = {
  success: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.05 13.4-3.2-3.2 1.4-1.4 1.8 1.8 4.85-4.85 1.4 1.4-6.25 6.25Z" fill="currentColor"></path></svg>`,
  info: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 10h2v7h-2v-7Zm0-3h2v2h-2V7Zm1-5a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z" fill="currentColor"></path></svg>`,
  warning: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 1.8 20.5h20.4L12 3Zm1 13h-2v-2h2v2Zm0-4h-2V8h2v4Z" fill="currentColor"></path></svg>`,
  error: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm3.7 13.3-1.4 1.4L12 13.4l-2.3 2.3-1.4-1.4 2.3-2.3-2.3-2.3 1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3Z" fill="currentColor"></path></svg>`,
  neutral: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1 5h2v6h-2V7Zm0 8h2v2h-2v-2Z" fill="currentColor"></path></svg>`,
};

export function getSemanticStatusIcon(type) {
  const normalized = normalizeSemanticStatusType(type);
  return SEMANTIC_STATUS_ICONS[normalized] || "";
}

function normalizeSemanticStatusType(type) {
  const value = String(type || "").trim().toLowerCase();
  if (value === "warn") {
    return "warning";
  }
  return value;
}
