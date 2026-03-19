import { createRoot, normalizeIncidentOptions, safeArray } from "./incident.base.js";

export function incidentTypesDetailsViewer(container, data, options = {}) {
  let currentData = normalizeIncidentTypeData(data);
  let currentOptions = normalizeIncidentOptions(options);
  let missingRequired = false;

  function validateRequired() {
    const missing = [];
    if (!currentData || typeof currentData !== "object") {
      missing.push("data");
    }
    if (!currentData?.incident_type_id && !currentData?.id) {
      missing.push("data.incident_type_id");
    }
    if (missing.length) {
      console.error(`[incident.types.details.viewer] Missing required input: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

  function getFieldValue(field) {
    const match = currentData.detail_entries.find((item) => item?.field_key === field?.field_key);
    if (!match) {
      return "-";
    }
    const value = String(match?.field_value ?? "").trim();
    return value || "-";
  }

  function getResourceQuantity(resourceTypeId) {
    const match = currentData.resources_needed.find(
      (item) => String(item?.resource_type_id) === String(resourceTypeId)
    );
    if (!match) {
      return 0;
    }
    const value = Number(match?.quantity_needed);
    return Number.isFinite(value) ? value : 0;
  }

  function renderHeader(root) {
    const header = document.createElement("header");
    header.className = "hh-type-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "hh-type-title-wrap";
    const title = document.createElement("h4");
    title.className = "hh-title ui-title";
    title.textContent = currentData.name || `Incident Type #${currentData.incident_type_id ?? currentData.id ?? "-"}`;
    titleWrap.appendChild(title);

    if (currentData.incident_type_category_name) {
      const subtitle = document.createElement("p");
      subtitle.className = "hh-meta";
      subtitle.textContent = currentData.incident_type_category_name;
      titleWrap.appendChild(subtitle);
    }

    header.appendChild(titleWrap);
    root.appendChild(header);
  }

  function renderFieldsSection(root) {
    if (!safeArray(currentData.detail_entries).length) {
      return;
    }

    const fields = [...safeArray(currentData.fields)].sort(
      (a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0)
    );
    if (!fields.length) {
      return;
    }

    const section = document.createElement("section");
    section.className = "hh-type-section";

    const sectionTitle = document.createElement("h5");
    sectionTitle.className = "hh-title ui-title";
    sectionTitle.textContent = "Fields";
    section.appendChild(sectionTitle);

    const content = document.createElement("div");
    content.className = "hh-content";

    fields.forEach((field) => {
      const row = document.createElement("p");
      row.className = "hh-row";
      const label = field?.field_label || field?.field_key || "Field";
      row.textContent = `${label}: ${getFieldValue(field)}`;
      content.appendChild(row);
    });

    section.appendChild(content);
    root.appendChild(section);
  }

  function renderResourcesSection(root) {
    const resources = safeArray(currentData.resources);
    if (!resources.length) {
      return;
    }

    const section = document.createElement("section");
    section.className = "hh-type-section";

    const title = document.createElement("h5");
    title.className = "hh-title ui-title";
    title.textContent = "Resources Needed";
    section.appendChild(title);

    const content = document.createElement("div");
    content.className = "hh-content";

    resources.forEach((resource) => {
      const resourceTypeId = resource?.id ?? resource?.resource_type_id;
      const row = document.createElement("p");
      row.className = "hh-row";
      row.textContent = `${resource?.name || resource?.resource_type?.name || `Resource #${resourceTypeId ?? "-"}`}: ${getResourceQuantity(resourceTypeId)}`;
      content.appendChild(row);
    });

    section.appendChild(content);
    root.appendChild(section);
  }

  function render() {
    const root = createRoot(container, "hh-incident-types-details-viewer", currentOptions);
    if (!root) {
      return;
    }
    missingRequired = !validateRequired();
    if (missingRequired) {
      return;
    }
    renderHeader(root);
    renderFieldsSection(root);
    renderResourcesSection(root);
  }

  function validate() {
    return {
      status: !missingRequired,
      errors: missingRequired ? [{ field_key: "_instance", error: "Missing required data/options" }] : [],
    };
  }

  render();

  return {
    destroy() {
      if (container && container.nodeType === 1) {
        container.innerHTML = "";
      }
    },
    update(nextData, nextOptions = {}) {
      currentData = normalizeIncidentTypeData(nextData);
      currentOptions = normalizeIncidentOptions({ ...currentOptions, ...nextOptions });
      render();
    },
    getData() {
      return cloneData(currentData);
    },
    validate,
    isValid() {
      return validate().status;
    },
  };
}

function normalizeIncidentTypeData(data) {
  const source = data && typeof data === "object" ? data : {};
  return {
    id: source.id ?? null,
    incident_id: source.incident_id ?? null,
    incident_type_id: source.incident_type_id ?? source.id ?? null,
    incident_type_category_id: source.incident_type_category_id ?? null,
    incident_type_category_name: source.incident_type_category_name ?? source.category_name ?? "",
    name: source.name ?? "",
    fields: safeArray(source.fields),
    detail_entries: safeArray(source.detail_entries).map((item) => ({ ...item })),
    resources: safeArray(source.resources).map((item) => ({ ...item })),
    resources_needed: safeArray(source.resources_needed).map((item) => ({ ...item })),
  };
}

function cloneData(value) {
  try {
    return structuredClone(value);
  } catch (_) {
    return JSON.parse(JSON.stringify(value));
  }
}
