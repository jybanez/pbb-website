if (typeof galleryItems !== "undefined" && Array.isArray(galleryItems)) {
  const rootAsset = (value) => {
    if (!value || /^(?:https?:|data:|\/)/i.test(value)) return value;
    return `/${value.replace(/^\.\//, "")}`;
  };
  galleryItems.forEach((item) => {
    if (item.fullWebp) item.fullFallback = item.fullWebp;
    const dimensions = window.PBBGalleryDimensions?.[item.fullWebp];
    if (dimensions) Object.assign(item, dimensions);
    ["thumb", "full", "fullWebp", "fullFallback", "full2x", "video"].forEach((field) => {
      if (item[field]) item[field] = rootAsset(item[field]);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let lastPreviewTrigger = null;
  let viewerWasOpen = false;
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-preview-modal]");
    if (trigger) lastPreviewTrigger = trigger;
  }, true);

  const applyViewerDimensions = () => {
    document.querySelectorAll('[role="dialog"] img:not([width])').forEach((image) => {
      const key = new URL(image.currentSrc || image.src, window.location.href).pathname.replace(/^\//, "");
      const dimensions = window.PBBGalleryDimensions?.[key];
      if (!dimensions) return;
      image.width = dimensions.fullWidth;
      image.height = dimensions.fullHeight;
    });
  };
  const observer = new MutationObserver(() => {
    applyViewerDimensions();
    const viewerIsOpen = Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
    if (viewerWasOpen && !viewerIsOpen && lastPreviewTrigger?.isConnected) {
      lastPreviewTrigger.focus();
    }
    viewerWasOpen = viewerIsOpen;
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "open", "aria-hidden"] });
});
