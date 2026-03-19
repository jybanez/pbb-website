const UI_TOKENS_CSS = "../../css/ui/ui.tokens.css";
const UI_COMPONENTS_CSS = "../../css/ui/ui.components.css";
const INCIDENT_BASE_CSS = "../../css/incident/incident.css";

export const DEFAULT_COMPONENT_REGISTRY = {
  "ui.dom": {
    js: "./ui.dom.js",
    css: [],
    deps: [],
    export: null,
  },
  "ui.dom.createElement": {
    js: "./ui.dom.js",
    css: [],
    deps: ["ui.dom"],
    export: "createElement",
  },
  "ui.dom.clearNode": {
    js: "./ui.dom.js",
    css: [],
    deps: ["ui.dom"],
    export: "clearNode",
  },
  "ui.events": {
    js: "./ui.events.js",
    css: [],
    deps: [],
    export: null,
  },
  "ui.events.createEventBag": {
    js: "./ui.events.js",
    css: [],
    deps: ["ui.events"],
    export: "createEventBag",
  },
  "ui.search": {
    js: "./ui.search.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS],
    deps: [],
    export: "createSearchField",
  },
  "ui.drawer": {
    js: "./ui.drawer.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS],
    deps: [],
    export: "createBottomDrawer",
  },
  "ui.window": {
    js: "./ui.window.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.window.css"],
    deps: [],
    export: "createWindowManager",
  },
  "ui.modal": {
    js: "./ui.modal.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css"],
    deps: [],
    export: "createModal",
  },
  "ui.action.modal": {
    js: "./ui.modal.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css"],
    deps: ["ui.modal"],
    export: "createActionModal",
  },
  "ui.dialog": {
    js: "./ui.dialog.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.dialog.css"],
    deps: ["ui.modal"],
    export: null,
  },
  "ui.dialog.alert": {
    js: "./ui.dialog.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.dialog.css"],
    deps: ["ui.dialog"],
    export: "uiAlert",
  },
  "ui.dialog.confirm": {
    js: "./ui.dialog.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.dialog.css"],
    deps: ["ui.dialog"],
    export: "uiConfirm",
  },
  "ui.dialog.prompt": {
    js: "./ui.dialog.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.dialog.css"],
    deps: ["ui.dialog"],
    export: "uiPrompt",
  },
  "ui.toast": {
    js: "./ui.toast.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.toast.css"],
    deps: [],
    export: "createToastStack",
  },
  "ui.form.modal": {
    js: "./ui.form.modal.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.form.modal.css", "../../css/ui/ui.select.css"],
    deps: ["ui.action.modal"],
    export: "createFormModal",
  },
  "ui.form.modal.login": {
    js: "./ui.form.modal.presets.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.form.modal.css"],
    deps: ["ui.form.modal"],
    export: "createLoginFormModal",
  },
  "ui.form.modal.reauth": {
    js: "./ui.form.modal.presets.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.form.modal.css"],
    deps: ["ui.form.modal"],
    export: "createReauthFormModal",
  },
  "ui.form.modal.status": {
    js: "./ui.form.modal.presets.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.form.modal.css"],
    deps: ["ui.form.modal"],
    export: "createStatusUpdateFormModal",
  },
  "ui.form.modal.reason": {
    js: "./ui.form.modal.presets.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.modal.css", "../../css/ui/ui.form.modal.css"],
    deps: ["ui.form.modal"],
    export: "createReasonFormModal",
  },
  "ui.select": {
    js: "./ui.select.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.select.css"],
    deps: [],
    export: "createSelect",
  },
  "ui.toggle.button": {
    js: "./ui.toggle.button.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.toggle.css"],
    deps: [],
    export: "createToggleButton",
  },
  "ui.toggle.group": {
    js: "./ui.toggle.group.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.toggle.css"],
    deps: ["ui.toggle.button"],
    export: "createToggleGroup",
  },
  "ui.datepicker": {
    js: "./ui.datepicker.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.datepicker.css"],
    deps: [],
    export: "createDatepicker",
  },
  "ui.timeline": {
    js: "./ui.timeline.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.timeline.css"],
    deps: [],
    export: "createTimeline",
  },
  "ui.timeline.scrubber": {
    js: "./ui.timeline.scrubber.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.timeline.scrubber.css"],
    deps: [],
    export: "createTimelineScrubber",
  },
  "ui.command.palette": {
    js: "./ui.command.palette.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.command.palette.css"],
    deps: [],
    export: "createCommandPalette",
  },
  "ui.tree": {
    js: "./ui.tree.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.tree.css"],
    deps: [],
    export: "createTree",
  },
  "ui.kanban": {
    js: "./ui.kanban.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.kanban.css"],
    deps: [],
    export: "createKanban",
  },
  "ui.stepper": {
    js: "./ui.stepper.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.stepper.css"],
    deps: [],
    export: "createStepper",
  },
  "ui.splitter": {
    js: "./ui.splitter.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.splitter.css"],
    deps: [],
    export: "createSplitter",
  },
  "ui.data.inspector": {
    js: "./ui.data.inspector.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.data.inspector.css"],
    deps: [],
    export: "createDataInspector",
  },
  "ui.empty.state": {
    js: "./ui.empty.state.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.empty.state.css"],
    deps: [],
    export: "createEmptyState",
  },
  "ui.skeleton": {
    js: "./ui.skeleton.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.skeleton.css"],
    deps: [],
    export: "createSkeleton",
  },
  "ui.progress": {
    js: "./ui.progress.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.progress.css"],
    deps: [],
    export: "createProgress",
  },
  "ui.file.uploader": {
    js: "./ui.file.uploader.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.progress.css", "../../css/ui/ui.file.uploader.css"],
    deps: ["ui.progress"],
    export: "createFileUploader",
  },
  "ui.tabs": {
    js: "./ui.tabs.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.tabs.css"],
    deps: [],
    export: "createTabs",
  },
  "ui.strips": {
    js: "./ui.strips.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.strips.css"],
    deps: [],
    export: "createStrip",
  },
  "ui.media.strip": {
    js: "./ui.media.strip.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.media.strip.css"],
    deps: ["ui.media.viewer"],
    export: "createMediaStrip",
  },
  "ui.media.viewer": {
    js: "./ui.media.viewer.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.media.viewer.css"],
    deps: ["ui.audio.audiograph"],
    export: "createMediaViewer",
  },
  "ui.grid": {
    js: "./ui.grid.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.grid.css"],
    deps: [],
    export: "createGrid",
  },
  "ui.tree.grid": {
    js: "./ui.tree.grid.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.tree.grid.css"],
    deps: [],
    export: "createTreeGrid",
  },
  "ui.hierarchy.map": {
    js: "./ui.hierarchy.map.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.hierarchy.map.css"],
    deps: [],
    export: "createHierarchyMap",
  },
  "ui.virtual.list": {
    js: "./ui.virtual.list.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.virtual.list.css"],
    deps: [],
    export: "createVirtualList",
  },
  "ui.scheduler": {
    js: "./ui.scheduler.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.scheduler.css"],
    deps: [],
    export: "createScheduler",
  },
  "ui.menu": {
    js: "./ui.menu.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.nav.css"],
    deps: [],
    export: "createMenu",
  },
  "ui.dropdown": {
    js: "./ui.dropdown.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.nav.css"],
    deps: ["ui.menu"],
    export: "createDropdown",
  },
  "ui.dropup": {
    js: "./ui.dropup.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.nav.css"],
    deps: ["ui.menu"],
    export: "createDropup",
  },
  "ui.navbar": {
    js: "./ui.navbar.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.nav.css"],
    deps: ["ui.dropdown"],
    export: "createNavbar",
  },
  "ui.sidebar": {
    js: "./ui.sidebar.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.nav.css"],
    deps: [],
    export: "createSidebar",
  },
  "ui.breadcrumbs": {
    js: "./ui.breadcrumbs.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.nav.css"],
    deps: [],
    export: "createBreadcrumbs",
  },
  "ui.audio.player": {
    js: "./ui.audio.player.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.audio.css"],
    deps: [],
    export: "createAudioPlayer",
  },
  "ui.audio.audiograph": {
    js: "./ui.audio.audiograph.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.audio.css"],
    deps: [],
    export: "createAudioGraph",
  },
  "ui.audio.callSession": {
    js: "./ui.audio.callSession.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, "../../css/ui/ui.audio.css"],
    deps: ["ui.audio.player", "ui.audio.audiograph"],
    export: "createAudioCallSession",
  },
  "incident.base": {
    js: "../incident/incident.base.js",
    css: [UI_TOKENS_CSS, UI_COMPONENTS_CSS, INCIDENT_BASE_CSS, "../../css/incident/incident.base.css"],
    deps: [],
    export: "incidentBase",
  },
  "incident.teams.assignments.editor": {
    js: "../incident/incident.teams.assignments.editor.js",
    css: [
      UI_TOKENS_CSS,
      UI_COMPONENTS_CSS,
      INCIDENT_BASE_CSS,
      "../../css/incident/incident.base.css",
      "../../css/incident/incident.teams.assignments.css",
      "../../css/incident/incident.teams.assignments.editor.css",
    ],
    deps: ["incident.base"],
    export: "incidentTeamsAssignmentsEditor",
  },
  "incident.teams.assignments.viewer": {
    js: "../incident/incident.teams.assignments.viewer.js",
    css: [
      UI_TOKENS_CSS,
      UI_COMPONENTS_CSS,
      INCIDENT_BASE_CSS,
      "../../css/incident/incident.base.css",
      "../../css/incident/incident.teams.assignments.css",
      "../../css/incident/incident.teams.assignments.viewer.css",
    ],
    deps: ["incident.base"],
    export: "incidentTeamsAssignmentsViewer",
  },
  "incident.teams.assignments": {
    js: "../incident/incident.teams.assignments.js",
    css: [
      UI_TOKENS_CSS,
      UI_COMPONENTS_CSS,
      INCIDENT_BASE_CSS,
      "../../css/incident/incident.base.css",
      "../../css/incident/incident.teams.assignments.css",
      "../../css/incident/incident.teams.assignments.editor.css",
      "../../css/incident/incident.teams.assignments.viewer.css",
    ],
    deps: ["incident.base", "incident.teams.assignments.editor", "incident.teams.assignments.viewer"],
    export: "incidentTeamsAssignments",
  },
  "incident.types.details.editor": {
    js: "../incident/incident.types.details.editor.js",
    css: [
      UI_TOKENS_CSS,
      UI_COMPONENTS_CSS,
      INCIDENT_BASE_CSS,
      "../../css/incident/incident.base.css",
      "../../css/incident/incident.types.css",
      "../../css/incident/incident.types.details.editor.css",
    ],
    deps: ["incident.base"],
    export: "incidentTypesDetailsEditor",
  },
  "incident.types.details.viewer": {
    js: "../incident/incident.types.details.viewer.js",
    css: [
      UI_TOKENS_CSS,
      UI_COMPONENTS_CSS,
      INCIDENT_BASE_CSS,
      "../../css/incident/incident.base.css",
      "../../css/incident/incident.types.css",
      "../../css/incident/incident.types.details.viewer.css",
    ],
    deps: ["incident.base"],
    export: "incidentTypesDetailsViewer",
  },
  "incident.types": {
    js: "../incident/incident.types.js",
    css: [
      UI_TOKENS_CSS,
      UI_COMPONENTS_CSS,
      INCIDENT_BASE_CSS,
      "../../css/incident/incident.base.css",
      "../../css/incident/incident.types.css",
      "../../css/incident/incident.types.details.editor.css",
      "../../css/incident/incident.types.details.viewer.css",
    ],
    deps: ["incident.base", "incident.types.details.editor", "incident.types.details.viewer"],
    export: "incidentTypes",
  },
};

export const DEFAULT_COMPONENT_GROUPS = {
  "core-shell": [
    "ui.dom",
    "ui.events",
    "ui.search",
    "ui.drawer",
    "ui.window",
    "ui.modal",
    "ui.action.modal",
    "ui.dialog",
    "ui.toast",
    "ui.menu",
    "ui.dropdown",
    "ui.dropup",
    "ui.navbar",
    "ui.sidebar",
    "ui.breadcrumbs",
  ],
  forms: [
    "ui.form.modal",
    "ui.form.modal.login",
    "ui.form.modal.reauth",
    "ui.form.modal.status",
    "ui.form.modal.reason",
    "ui.select",
    "ui.toggle.button",
    "ui.toggle.group",
    "ui.datepicker",
    "ui.file.uploader",
  ],
  data: [
    "ui.grid",
    "ui.tree.grid",
    "ui.hierarchy.map",
    "ui.progress",
    "ui.virtual.list",
    "ui.scheduler",
    "ui.timeline",
    "ui.timeline.scrubber",
    "ui.data.inspector",
    "ui.empty.state",
    "ui.skeleton",
  ],
  media: [
    "ui.media.strip",
    "ui.media.viewer",
    "ui.audio.player",
    "ui.audio.audiograph",
    "ui.audio.callSession",
  ],
  workflow: [
    "ui.command.palette",
    "ui.tree",
    "ui.kanban",
    "ui.stepper",
    "ui.splitter",
    "ui.tabs",
    "ui.strips",
  ],
  incident: [
    "incident.base",
    "incident.teams.assignments",
    "incident.types",
  ],
};

const DEFAULT_LOADER_OPTIONS = {
  debug: false,
};

export function createUiLoader(initialRegistry = DEFAULT_COMPONENT_REGISTRY, config = {}) {
  const loaderOptions = normalizeLoaderOptions(config);
  const registry = new Map(Object.entries(initialRegistry).map(([name, entry]) => [name, normalizeEntry(entry)]));
  const groups = new Map(Object.entries(loaderOptions.groups).map(([name, entries]) => [String(name), uniqueStrings(entries)]));
  const stylePromises = new Map();
  const modulePromises = new Map();
  const failedCss = new Map();
  const failedModules = new Map();

  function has(name) {
    return registry.has(String(name || ""));
  }

  function hasGroup(name) {
    return groups.has(String(name || ""));
  }

  function register(name, entry) {
    const key = requireName(name, "uiLoader.register(name, entry)");
    registry.set(key, normalizeEntry(entry));
    debugLog("register", { name: key });
    return key;
  }

  function unregister(name) {
    registry.delete(String(name || ""));
  }

  function registerGroup(name, entries) {
    const key = requireName(name, "uiLoader.registerGroup(name, entries)");
    groups.set(key, uniqueStrings(entries));
    debugLog("registerGroup", { name: key, count: groups.get(key).length });
    return key;
  }

  function unregisterGroup(name) {
    groups.delete(String(name || ""));
  }

  function resolve(name) {
    const key = String(name || "");
    const entry = registry.get(key);
    if (!entry) {
      throw new Error(`uiLoader could not resolve component "${key}".`);
    }
    return {
      name: key,
      ...cloneEntry(entry),
    };
  }

  function resolveGroup(name) {
    const key = String(name || "");
    const entries = groups.get(key);
    if (!entries) {
      throw new Error(`uiLoader could not resolve group "${key}".`);
    }
    return [...entries];
  }

  async function ensureStyles(name, options = {}) {
    const entry = resolve(name);
    const parent = getStyleParent(options.parent);
    if (options.recursive !== false) {
      for (const depName of entry.deps) {
        await ensureStyles(depName, options);
      }
    }
    await Promise.all(entry.css.map((path) => ensureStyleHref(path, parent)));
    debugLog("ensureStyles", { name, cssCount: entry.css.length });
    return entry;
  }

  async function load(name, options = {}) {
    const entry = resolve(name);
    if (options.recursive !== false) {
      for (const depName of entry.deps) {
        await load(depName, options);
      }
    }
    if (options.css !== false) {
      await ensureStyles(name, options);
    }
    if (options.js) {
      return importComponent(name, options);
    }
    debugLog("load", { name });
    return entry;
  }

  async function loadMany(names, options = {}) {
    const list = Array.isArray(names) ? names : [];
    return Promise.all(list.map((name) => load(name, options)));
  }

  async function loadGroup(name, options = {}) {
    return loadMany(resolveGroup(name), options);
  }

  async function loadManyGroup(names, options = {}) {
    const list = Array.isArray(names) ? names : [names];
    const componentNames = uniqueStrings(list.flatMap((name) => resolveGroup(name)));
    return loadMany(componentNames, options);
  }

  async function importComponent(name, options = {}) {
    const entry = resolve(name);
    if (options.recursive !== false) {
      for (const depName of entry.deps) {
        await importComponent(depName, options);
      }
    }
    if (options.css !== false) {
      await ensureStyles(name, options);
    }
    if (modulePromises.has(name)) {
      return modulePromises.get(name);
    }
    const promise = import(toAbsoluteUrl(entry.js))
      .then((module) => {
        failedModules.delete(name);
        debugLog("import", { name, export: entry.export || null });
        return module;
      })
      .catch((error) => {
        modulePromises.delete(name);
        failedModules.set(name, createFailureRecord({
          kind: "module",
          id: name,
          path: entry.js,
          error,
        }));
        debugLog("import.error", { name, message: String(error?.message || error) });
        throw error;
      });
    modulePromises.set(name, promise);
    return promise;
  }

  async function get(name, options = {}) {
    const entry = resolve(name);
    const module = await importComponent(name, options);
    return resolveModuleExport(entry, module);
  }

  async function create(name, ...args) {
    const factory = await get(name);
    if (typeof factory !== "function") {
      throw new Error(`uiLoader.create("${name}") requires the registry entry to resolve to a function export.`);
    }
    return factory(...args);
  }

  function getRegistry() {
    const out = {};
    for (const [name, entry] of registry.entries()) {
      out[name] = cloneEntry(entry);
    }
    return out;
  }

  function getGroups() {
    const out = {};
    for (const [name, values] of groups.entries()) {
      out[name] = [...values];
    }
    return out;
  }

  function getLoadedCss() {
    return Array.from(stylePromises.keys());
  }

  function getLoadedModules() {
    return Array.from(modulePromises.keys());
  }

  function getFailedCss() {
    return Array.from(failedCss.values()).map(cloneFailureRecord);
  }

  function getFailedModules() {
    return Array.from(failedModules.values()).map(cloneFailureRecord);
  }

  function getDiagnostics() {
    return {
      registry: getRegistry(),
      groups: getGroups(),
      loadedCss: getLoadedCss(),
      loadedModules: getLoadedModules(),
      failedCss: getFailedCss(),
      failedModules: getFailedModules(),
      debug: Boolean(loaderOptions.debug),
    };
  }

  function setDebug(nextValue) {
    loaderOptions.debug = Boolean(nextValue);
    return loaderOptions.debug;
  }

  function normalizeEntry(entry = {}) {
    return {
      js: String(entry.js || ""),
      css: Array.isArray(entry.css) ? uniqueStrings(entry.css) : [],
      deps: Array.isArray(entry.deps) ? uniqueStrings(entry.deps) : [],
      export: typeof entry.export === "string" && entry.export.trim() ? entry.export.trim() : null,
    };
  }

  function ensureStyleHref(path, parent) {
    const href = toAbsoluteUrl(path);
    if (stylePromises.has(href)) {
      return stylePromises.get(href);
    }
    const promise = new Promise((resolvePromise, rejectPromise) => {
      const existing = document.querySelector(`link[data-ui-loader-href="${cssEscape(href)}"]`);
      if (existing) {
        failedCss.delete(href);
        resolvePromise(existing);
        return;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.uiLoaderHref = href;
      link.addEventListener("load", () => {
        failedCss.delete(href);
        debugLog("css.load", { href });
        resolvePromise(link);
      }, { once: true });
      link.addEventListener("error", () => {
        const error = new Error(`Failed to load stylesheet: ${href}`);
        stylePromises.delete(href);
        failedCss.set(href, createFailureRecord({
          kind: "css",
          id: href,
          path,
          error,
        }));
        debugLog("css.error", { href, message: error.message });
        rejectPromise(error);
      }, { once: true });
      parent.appendChild(link);
    });
    stylePromises.set(href, promise);
    return promise;
  }

  function debugLog(event, payload) {
    if (!loaderOptions.debug || typeof console === "undefined" || typeof console.debug !== "function") {
      return;
    }
    console.debug("[uiLoader]", event, payload || {});
  }

  return {
    has,
    hasGroup,
    register,
    unregister,
    registerGroup,
    unregisterGroup,
    resolve,
    resolveGroup,
    load,
    loadMany,
    loadGroup,
    loadManyGroup,
    import: importComponent,
    get,
    create,
    ensureStyles,
    getRegistry,
    getGroups,
    getLoadedCss,
    getLoadedModules,
    getFailedCss,
    getFailedModules,
    getDiagnostics,
    setDebug,
  };
}

export const uiLoader = createUiLoader();

if (typeof window !== "undefined") {
  window.uiLoader = uiLoader;
}

function resolveModuleExport(entry, module) {
  if (!entry.export) {
    return module;
  }
  const value = module?.[entry.export];
  if (typeof value === "undefined") {
    throw new Error(`uiLoader expected export "${entry.export}" from "${entry.name}".`);
  }
  return value;
}

function cloneEntry(entry) {
  return {
    js: entry.js,
    css: [...entry.css],
    deps: [...entry.deps],
    export: entry.export,
  };
}

function normalizeLoaderOptions(config = {}) {
  if (!isPlainObject(config)) {
    return {
      ...DEFAULT_LOADER_OPTIONS,
      groups: cloneGroups(DEFAULT_COMPONENT_GROUPS),
    };
  }
  return {
    ...DEFAULT_LOADER_OPTIONS,
    ...config,
    groups: {
      ...cloneGroups(DEFAULT_COMPONENT_GROUPS),
      ...(isPlainObject(config.groups) ? cloneGroups(config.groups) : {}),
    },
  };
}

function cloneGroups(groups) {
  const out = {};
  for (const [name, entries] of Object.entries(groups || {})) {
    out[name] = uniqueStrings(entries);
  }
  return out;
}

function createFailureRecord({ kind, id, path, error }) {
  return {
    kind,
    id,
    path: String(path || ""),
    message: String(error?.message || error || ""),
    at: new Date().toISOString(),
  };
}

function cloneFailureRecord(entry) {
  return {
    kind: entry.kind,
    id: entry.id,
    path: entry.path,
    message: entry.message,
    at: entry.at,
  };
}

function requireName(name, label) {
  const key = String(name || "").trim();
  if (!key) {
    throw new Error(`${label} requires a non-empty name.`);
  }
  return key;
}

function toAbsoluteUrl(path) {
  return new URL(String(path || ""), import.meta.url).href;
}

function getStyleParent(parent) {
  if (parent && typeof parent.appendChild === "function") {
    return parent;
  }
  return document.head || document.documentElement;
}

function uniqueStrings(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value || "")).filter(Boolean)));
}

function cssEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return String(value).replace(/"/g, '\\"');
}

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

