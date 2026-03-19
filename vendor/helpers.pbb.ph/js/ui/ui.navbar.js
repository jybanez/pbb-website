import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";
import { createMenu } from "./ui.menu.js";

const DEFAULT_OPTIONS = {
  className: "",
  ariaLabel: "Primary navigation",
  brandText: "App",
  items: [],
  actions: [],
  sticky: false,
  activeId: "",
  iconPosition: "start", // start | end
  iconOnly: false,
  onNavigate: null,
  onAction: null,
  onActionMenuSelect: null,
  onActionMenuOpenChange: null,
};

export function createNavbar(container, data = {}, options = {}) {
  const events = createEventBag();
  let currentOptions = { ...DEFAULT_OPTIONS, ...(options || {}) };
  let actionMenus = [];

  function destroyActionMenus() {
    actionMenus.forEach((menuApi) => menuApi?.destroy?.());
    actionMenus = [];
  }

  function appendIconLabel(target, item = {}) {
    const label = item?.label ?? String(item?.id ?? "");
    const hasIcon = Boolean(item?.icon);
    const iconPosition = String(item?.iconPosition || currentOptions.iconPosition || "start").toLowerCase() === "end" ? "end" : "start";
    const iconOnly = Boolean(item?.iconOnly ?? currentOptions.iconOnly);

    target.classList.toggle("is-icon-only", iconOnly && hasIcon);
    if (iconOnly && hasIcon) {
      target.setAttribute("aria-label", String(label || item?.ariaLabel || item?.id || "menu item"));
      target.setAttribute("title", String(label || ""));
    }

    const content = createElement("span", {
      className: `ui-nav-content${iconPosition === "end" ? " is-end" : ""}`,
    });
    if (hasIcon) {
      content.appendChild(createElement("span", { className: "ui-nav-icon", html: String(item.icon) }));
    }
    if (!iconOnly || !hasIcon) {
      content.appendChild(createElement("span", { className: "ui-nav-label", text: label }));
    }
    target.appendChild(content);
  }

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    destroyActionMenus();
    events.clear();
    clearNode(container);

    const root = createElement("nav", {
      className: `ui-navbar ${currentOptions.className || ""}`.trim(),
      attrs: { role: "navigation", "aria-label": currentOptions.ariaLabel },
    });
    if (currentOptions.sticky) {
      root.classList.add("is-sticky");
    }

    const brand = createElement("button", {
      className: "ui-navbar-brand",
      text: currentOptions.brandText,
      attrs: { type: "button" },
    });
    events.on(brand, "click", () => currentOptions.onNavigate?.({ id: "brand", label: currentOptions.brandText }));

    const list = createElement("div", { className: "ui-navbar-items" });
    (currentOptions.items || []).forEach((item) => {
      const btn = createElement("button", {
        className: `ui-navbar-item${String(item?.id) === String(currentOptions.activeId) ? " is-active" : ""}`,
        attrs: {
          type: "button",
          ...(item?.disabled ? { disabled: "disabled" } : {}),
          ...(String(item?.id) === String(currentOptions.activeId) ? { "aria-current": "page" } : {}),
        },
      });
      appendIconLabel(btn, item);
      events.on(btn, "click", () => currentOptions.onNavigate?.(item));
      list.appendChild(btn);
    });

    const actions = createElement("div", { className: "ui-navbar-actions" });
    (currentOptions.actions || []).forEach((action) => {
      const btn = createElement("button", {
        className: "ui-button ui-navbar-action",
        attrs: { type: "button", ...(action?.disabled ? { disabled: "disabled" } : {}) },
      });
      appendIconLabel(btn, action);
      const menuItems = Array.isArray(action?.menuItems) ? action.menuItems : [];
      if (menuItems.length) {
        const menuApi = createMenu(btn, menuItems, {
          placement: "bottom-end",
          ...((action?.menuOptions && typeof action.menuOptions === "object") ? action.menuOptions : {}),
          onSelect: (item, meta) => {
            currentOptions.onActionMenuSelect?.(action, item, meta);
          },
          onOpenChange: (open) => {
            currentOptions.onActionMenuOpenChange?.(action, open);
          },
        });
        actionMenus.push(menuApi);
      } else {
        events.on(btn, "click", () => currentOptions.onAction?.(action));
      }
      actions.appendChild(btn);
    });

    root.append(brand, list, actions);
    container.appendChild(root);
  }

  function update(_nextData = {}, nextOptions = {}) {
    currentOptions = { ...currentOptions, ...(nextOptions || {}) };
    render();
  }

  function destroy() {
    destroyActionMenus();
    events.clear();
    clearNode(container);
  }

  function getState() {
    return {
      options: { ...currentOptions },
    };
  }

  render();
  return { destroy, update, getState };
}
