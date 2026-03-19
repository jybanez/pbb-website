import { createRoot, normalizeIncidentOptions, safeArray } from "./incident.base.js";

export function incidentTypesDetailsEditor(container, data, options = {}) {
  let currentData = normalizeIncidentTypeData(data);
  let currentOptions = normalizeIncidentOptions(options);
  const listeners = [];
  let missingRequired = false;

  function bind(el, event, handler) {
    el.addEventListener(event, handler);
    listeners.push(() => el.removeEventListener(event, handler));
  }

  function cleanupListeners() {
    listeners.splice(0).forEach((off) => off());
  }

  function validateRequired() {
    const missing = [];
    if (!currentData || typeof currentData !== "object") {
      missing.push("data");
    }
    if (typeof currentOptions.removeIncidentType !== "function") {
      missing.push("options.removeIncidentType");
    }
    if (!currentData?.incident_type_id && !currentData?.id) {
      missing.push("data.incident_type_id");
    }
    if (missing.length) {
      console.error(`[incident.types.details.editor] Missing required input: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

  function getFieldValue(field) {
    const match = currentData.detail_entries.find((item) => item?.field_key === field?.field_key);
    if (!match) {
      if (field?.default_value !== null && field?.default_value !== undefined && field?.default_value !== "") {
        return String(field.default_value);
      }
      return "";
    }
    return String(match?.field_value ?? "");
  }

  function setFieldValue(field, value) {
    const fieldKey = String(field?.field_key || "");
    if (!fieldKey) {
      return;
    }
    const entryIndex = currentData.detail_entries.findIndex((item) => item?.field_key === fieldKey);
    if (entryIndex >= 0) {
      currentData.detail_entries[entryIndex] = {
        ...currentData.detail_entries[entryIndex],
        field_key: fieldKey,
        field_label: field?.field_label || currentData.detail_entries[entryIndex]?.field_label || fieldKey,
        field_value: value,
      };
      return;
    }
    currentData.detail_entries.push({
      incident_id: currentData.incident_id,
      incident_type_id: currentData.incident_type_id,
      field_key: fieldKey,
      field_label: field?.field_label || fieldKey,
      field_value: value,
    });
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

  function setResourceQuantity(resourceTypeId, quantityNeeded) {
    const idx = currentData.resources_needed.findIndex(
      (item) => String(item?.resource_type_id) === String(resourceTypeId)
    );
    if (idx >= 0) {
      currentData.resources_needed[idx] = {
        ...currentData.resources_needed[idx],
        resource_type_id: resourceTypeId,
        quantity_needed: quantityNeeded,
      };
      return;
    }
    currentData.resources_needed.push({
      incident_id: currentData.incident_id,
      incident_type_id: currentData.incident_type_id,
      resource_type_id: resourceTypeId,
      quantity_needed: quantityNeeded,
    });
  }

  function createFieldInput(field, value) {
    const inputType = String(field?.input_type || "text").toLowerCase();
    if (inputType === "textarea") {
      const textarea = document.createElement("textarea");
      textarea.className = "hh-input ui-input";
      textarea.value = value;
      return textarea;
    }

    if (inputType === "select") {
      const select = document.createElement("select");
      select.className = "hh-input ui-input";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select";
      select.appendChild(placeholder);
      safeArray(field?.options).forEach((opt) => {
        const option = document.createElement("option");
        option.value = String(opt);
        option.textContent = String(opt);
        select.appendChild(option);
      });
      select.value = value;
      return select;
    }

    if (inputType === "multiselect") {
      const wrap = document.createElement("div");
      wrap.className = "hh-multiselect";
      const selected = new Set(
        String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      );
      safeArray(field?.options).forEach((opt) => {
        const optionWrap = document.createElement("label");
        optionWrap.className = "hh-multiselect-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "hh-multiselect-checkbox";
        checkbox.value = String(opt);
        checkbox.checked = selected.has(String(opt));

        const text = document.createElement("span");
        text.textContent = String(opt);

        optionWrap.append(checkbox, text);
        wrap.appendChild(optionWrap);
      });
      return wrap;
    }

    const input = document.createElement("input");
    input.className = "hh-input ui-input";
    input.type = inputType === "number" ? "number" : "text";
    input.value = value;
    if (field?.placeholder) {
      input.placeholder = String(field.placeholder);
    }
    if (input.type === "number") {
      if (field?.min !== null && field?.min !== undefined && field?.min !== "") {
        input.min = String(field.min);
      }
      if (field?.max !== null && field?.max !== undefined && field?.max !== "") {
        input.max = String(field.max);
      }
      if (field?.step !== null && field?.step !== undefined && field?.step !== "") {
        input.step = String(field.step);
      }
    }
    return input;
  }

  function getInputValue(input, field) {
    const inputType = String(field?.input_type || "text").toLowerCase();
    if (inputType === "multiselect") {
      return safeArray(input?.querySelectorAll('input[type="checkbox"]:checked'))
        .map((checkbox) => checkbox.value)
        .join(",");
    }
    return input?.value ?? "";
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

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "hh-remove";
    removeBtn.setAttribute("aria-label", "Remove incident type");
    removeBtn.innerHTML = '<span aria-hidden="true">\u2715</span>';
    bind(removeBtn, "click", () => {
      currentOptions.removeIncidentType?.(cloneData(currentData));
    });

    header.append(titleWrap, removeBtn);
    root.appendChild(header);
  }

  function renderFieldsSection(root) {
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

    const grid = document.createElement("div");
    grid.className = "hh-field-grid";
    fields.forEach((field) => {
      const row = document.createElement("div");
      row.className = "hh-field-row";
      row.dataset.fieldKey = String(field?.field_key || "");

      const labelWrap = document.createElement("div");
      labelWrap.className = "hh-field-label-wrap";

      const label = document.createElement("label");
      label.className = "hh-field-label";
      label.textContent = field?.field_label || field?.field_key || "Field";
      labelWrap.appendChild(label);

      if (field?.is_required) {
        const required = document.createElement("span");
        required.className = "hh-required";
        required.textContent = "Required";
        labelWrap.appendChild(required);
      }

      const input = createFieldInput(field, getFieldValue(field));
      if (field?.is_required && String(field?.input_type || "").toLowerCase() !== "multiselect") {
        input.required = true;
      }

      bind(input, "change", () => {
        const value = getInputValue(input, field);
        setFieldValue(field, value);
        currentOptions.onFieldChange?.(currentData.incident_type_id, field?.field_key, value);
      });
      if (!["select", "multiselect"].includes(String(field?.input_type || "").toLowerCase())) {
        bind(input, "input", () => {
          const value = getInputValue(input, field);
          setFieldValue(field, value);
          currentOptions.onFieldChange?.(currentData.incident_type_id, field?.field_key, value);
        });
      }

      row.append(labelWrap, input);
      grid.appendChild(row);
    });

    section.appendChild(grid);
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

    const grid = document.createElement("div");
    grid.className = "hh-resource-grid";

    resources.forEach((resource) => {
      const resourceTypeId = resource?.id ?? resource?.resource_type_id;
      const row = document.createElement("div");
      row.className = "hh-resource-row";

      const label = document.createElement("label");
      label.className = "hh-field-label";
      label.textContent = resource?.name || resource?.resource_type?.name || `Resource #${resourceTypeId ?? "-"}`;

      const input = document.createElement("input");
      input.className = "hh-input ui-input";
      input.type = "number";
      input.min = "0";
      input.step = "1";
      input.value = String(getResourceQuantity(resourceTypeId));
      bind(input, "input", () => {
        const numeric = Number(input.value);
        const next = Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
        setResourceQuantity(resourceTypeId, next);
        currentOptions.onResourceChange?.(currentData.incident_type_id, resourceTypeId, next);
      });

      row.append(label, input);
      grid.appendChild(row);
    });

    section.appendChild(grid);
    root.appendChild(section);
  }

  function render() {
    const root = createRoot(container, "hh-incident-types-details-editor", currentOptions);
    if (!root) {
      return;
    }

    cleanupListeners();
    missingRequired = !validateRequired();
    if (missingRequired) {
      return;
    }

    renderHeader(root);
    renderFieldsSection(root);
    renderResourcesSection(root);
  }

  function validate() {
    if (missingRequired) {
      return {
        status: false,
        errors: [{ field_key: "_instance", error: "Missing required data/options" }],
      };
    }

    const errors = [];
    const fields = safeArray(currentData.fields);
    const entryMap = safeArray(currentData.detail_entries).reduce((acc, entry) => {
      acc[String(entry?.field_key || "")] = String(entry?.field_value ?? "");
      return acc;
    }, {});

    fields.forEach((field) => {
      const fieldKey = String(field?.field_key || "");
      const value = entryMap[fieldKey] ?? "";
      const trimmed = String(value).trim();
      if (field?.is_required && !trimmed) {
        errors.push({ field_key: fieldKey, error: "Required value is missing" });
      }

      const inputType = String(field?.input_type || "").toLowerCase();
      if (inputType === "number" && trimmed) {
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric)) {
          errors.push({ field_key: fieldKey, error: "Value must be a valid number" });
        } else {
          if (field?.min !== null && field?.min !== undefined && field?.min !== "" && numeric < Number(field.min)) {
            errors.push({ field_key: fieldKey, error: `Value must be >= ${field.min}` });
          }
          if (field?.max !== null && field?.max !== undefined && field?.max !== "" && numeric > Number(field.max)) {
            errors.push({ field_key: fieldKey, error: `Value must be <= ${field.max}` });
          }
        }
      }
    });

    safeArray(currentData.resources_needed).forEach((resource) => {
      const qty = Number(resource?.quantity_needed);
      if (!Number.isFinite(qty) || qty < 0) {
        errors.push({
          field_key: `resource:${resource?.resource_type_id ?? "unknown"}`,
          error: "quantity_needed must be a number >= 0",
        });
      }
    });

    return {
      status: errors.length === 0,
      errors,
    };
  }

  render();

  return {
    destroy() {
      cleanupListeners();
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
