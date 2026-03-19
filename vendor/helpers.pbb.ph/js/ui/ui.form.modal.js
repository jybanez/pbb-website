import { createElement, clearNode } from "./ui.dom.js";
import { createActionModal } from "./ui.modal.js";
import { createSelect } from "./ui.select.js";

const DEFAULT_OPTIONS = {
  title: "",
  size: "sm",
  className: "",
  ariaLabel: "Form dialog",
  context: null,
  rows: [],
  initialValues: null,
  mode: "",
  submitLabel: "Submit",
  cancelLabel: "Cancel",
  submitVariant: "primary",
  submitIcon: "",
  cancelIcon: "",
  closeOnSuccess: true,
  busyMessage: "Saving...",
  onSubmit: null,
  onChange: null,
  onClose: null,
};

export function createFormModal(options = {}) {
  const currentOptions = normalizeOptions(options);
  const refs = {
    shell: createElement("div", { className: "ui-form-modal" }),
    form: createElement("form", {
      className: "ui-form-modal-form",
      attrs: { novalidate: "novalidate" },
    }),
    context: createElement("div", {
      className: "ui-form-modal-context",
      attrs: { hidden: "hidden" },
    }),
    rows: createElement("div", { className: "ui-form-modal-rows" }),
    hiddenFields: createElement("div", {
      className: "ui-form-modal-hidden-fields",
      attrs: { hidden: "hidden", "aria-hidden": "true" },
    }),
    formError: createElement("p", {
      className: "ui-form-error ui-form-modal-form-error",
      attrs: { hidden: "hidden" },
    }),
    submitProxy: createElement("button", {
      className: "ui-form-modal-submit-proxy",
      text: "Submit",
      attrs: { type: "submit", tabindex: "-1", "aria-hidden": "true" },
    }),
  };
  refs.form.append(refs.context, refs.rows, refs.hiddenFields, refs.formError, refs.submitProxy);
  refs.shell.appendChild(refs.form);

  const fields = new Map();
  const displays = new Map();
  let destroyed = false;
  let modal = null;

  function destroyHostedFieldInstances() {
    fields.forEach((field) => {
      if (field?.type === "ui.select") {
        field.control?.__uiSelectInstance?.destroy?.();
      }
    });
  }

  function resolveItemConfig(item) {
    if (!item || typeof item !== "object") {
      return item;
    }
    const next = { ...item };
    const mode = currentOptions.mode;
    next.type = String(next.type || "").trim().toLowerCase();
    next.span = normalizeSpan(next.span);
    next._initialValues = currentOptions.initialValues || {};
    next.required = Boolean(next.required) || resolveModeFlag(next.requiredOn, mode);
    if (resolveModeFlag(next.optionalOn, mode)) {
      next.required = false;
    }
    next.readonly = Boolean(next.readonly) || resolveModeFlag(next.readonlyOn, mode);
    next._hiddenByRule = resolveModeFlag(next.hiddenOn, mode);
    return next;
  }

  function render() {
    destroyHostedFieldInstances();
    renderContext();
    clearNode(refs.rows);
    clearNode(refs.hiddenFields);
    fields.clear();
    displays.clear();

    normalizeRows(currentOptions.rows).forEach((row, rowIndex) => {
      const resolvedRow = row.map((item) => resolveItemConfig(item));
      const visibleItems = resolvedRow.filter((item) => isVisibleRenderableItem(item));
      if (!visibleItems.length) {
        resolvedRow.forEach((item, itemIndex) => {
          if (!item || item._hiddenByRule || item.type !== "hidden") {
            return;
          }
          const hiddenEl = renderItem(item, rowIndex, itemIndex);
          if (hiddenEl) {
            refs.hiddenFields.appendChild(hiddenEl);
          }
        });
        return;
      }
      const rowEl = createElement("div", {
        className: `ui-form-modal-row is-items-${Math.min(visibleItems.length, 2) || 1}`,
      });
      let warned = false;
      let renderedVisibleCount = 0;

      resolvedRow.forEach((item, itemIndex) => {
        if (!item || item._hiddenByRule) {
          return;
        }
        if (item.type === "hidden") {
          const hiddenEl = renderItem(item, rowIndex, itemIndex);
          if (hiddenEl) {
            refs.hiddenFields.appendChild(hiddenEl);
          }
          return;
        }
        const isVisible = true;
        if (isVisible) {
          renderedVisibleCount += 1;
          if (renderedVisibleCount > 2) {
            if (!warned) {
              console.warn(`[createFormModal] Row ${rowIndex + 1} has ${visibleItems.length} visible items; current implementation supports at most 2. Rendering first 2 visible items only.`);
              warned = true;
            }
            return;
          }
        }
        const itemEl = renderItem(item, rowIndex, itemIndex);
        if (itemEl) {
          rowEl.appendChild(itemEl);
        }
      });

      if (rowEl.childNodes.length) {
        refs.rows.appendChild(rowEl);
      }
    });
  }

  function renderItem(item, rowIndex, itemIndex) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const type = String(item.type || "").trim().toLowerCase();
    if (type === "text") {
      return createElement("p", {
        className: getItemClassName("ui-form-modal-text", item),
        text: String(item.content || ""),
      });
    }
    if (type === "alert") {
      return createElement("div", {
        className: getItemClassName(`ui-form-modal-alert is-${normalizeTone(item.tone)}`, item),
        text: String(item.content || ""),
        attrs: { role: "alert" },
      });
    }
    if (type === "divider") {
      return createElement("hr", {
        className: getItemClassName("ui-form-modal-divider", item),
      });
    }
    if (type === "display") {
      return renderDisplayItem(item);
    }
    if (type === "hidden" || type === "input" || type === "textarea" || type === "select" || type === "checkbox" || type === "ui.select") {
      return renderField(item, type, rowIndex, itemIndex);
    }
    console.warn(`[createFormModal] Unsupported item type "${type}".`);
    return null;
  }

  function renderDisplayItem(item) {
    const wrapper = createElement("div", {
      className: getItemClassName(`ui-field ui-form-modal-field is-${normalizeTypeClass("display")}`, item),
    });
    const name = String(item.name || "").trim();
    const labelText = String(item.label || "").trim();
    const helpText = String(item.help || "").trim();
    const displayValue = resolveItemValue(item);
    if (labelText) {
      wrapper.appendChild(createElement("label", {
        className: "ui-label",
        text: labelText,
      }));
    }
    const valueEl = createElement("div", {
      className: "ui-form-modal-display-value",
      text: displayValue == null || displayValue === "" ? String(item.emptyText || "-") : String(displayValue),
    });
    wrapper.appendChild(valueEl);
    if (helpText) {
      wrapper.appendChild(createElement("p", {
        className: "ui-form-modal-help",
        text: helpText,
      }));
    }
    if (name) {
      displays.set(name, {
        name,
        valueEl,
        config: { ...item },
      });
    }
    return wrapper;
  }

  function renderContext() {
    clearNode(refs.context);
    const context = normalizeContext(currentOptions.context);
    if (!context) {
      refs.context.hidden = true;
      return;
    }
    refs.context.hidden = false;
    refs.context.className = `ui-form-modal-context is-${context.kind}`;
    if (context.badge) {
      refs.context.appendChild(createElement("span", {
        className: "ui-form-modal-context-badge",
        text: context.badge,
      }));
    }
    if (context.summary) {
      refs.context.appendChild(createElement("span", {
        className: "ui-form-modal-context-summary",
        text: context.summary,
      }));
    }
  }

  function renderField(item, type, rowIndex, itemIndex) {
    const name = String(item.name || "").trim();
    if (!name) {
      console.warn(`[createFormModal] Field item at row ${rowIndex + 1}, index ${itemIndex + 1} is missing "name".`);
      return null;
    }
    const id = `ui-form-modal-${name}-${rowIndex}-${itemIndex}`;
    const wrapper = createElement("div", {
      className: getItemClassName(`ui-field ui-form-modal-field is-${normalizeTypeClass(type)}`, item),
      attrs: type === "hidden" ? { hidden: "hidden" } : {},
    });
    const label = createElement("label", {
      className: type === "checkbox" ? "ui-form-modal-checkbox" : "ui-label",
      attrs: type === "checkbox" || type === "hidden" ? {} : { for: id },
    });
    const labelText = String(item.label || "").trim();
    const helpText = String(item.help || "").trim();
    const errorEl = type === "hidden"
      ? null
      : createElement("p", {
        className: "ui-form-error ui-form-modal-field-error",
        attrs: { hidden: "hidden", id: `${id}-error` },
      });

    const value = resolveItemValue(item);
    const control = createControl(type, id, name, item, value, errorEl);
    if (!control) {
      return null;
    }

    if (type === "hidden") {
      fields.set(name, {
        name,
        type,
        config: { ...item },
        wrapper: null,
        control,
        errorEl: null,
      });
      return control;
    } else if (type === "ui.select") {
      if (labelText) {
        label.textContent = labelText;
        wrapper.appendChild(label);
      }
      wrapper.appendChild(control);
    } else if (type === "checkbox") {
      label.append(control, createElement("span", {
        className: "ui-form-modal-checkbox-label",
        text: labelText,
      }));
      wrapper.appendChild(label);
    } else {
      if (labelText) {
        label.textContent = labelText;
        wrapper.appendChild(label);
      }
      wrapper.appendChild(control);
    }

    if (helpText && type !== "hidden") {
      const helpEl = createElement("p", {
        className: "ui-form-modal-help",
        text: helpText,
        attrs: { id: `${id}-help` },
      });
      wrapper.appendChild(helpEl);
      appendDescribedBy(getFieldAriaTarget({ type, control }), helpEl.id);
    }

    if (type === "ui.select" && errorEl) {
      appendDescribedBy(getFieldAriaTarget({ type, control }), errorEl.id);
    }

    if (errorEl) {
      wrapper.appendChild(errorEl);
    }

    fields.set(name, {
      name,
      type,
      config: { ...item },
      wrapper,
      control,
      errorEl,
    });
    return wrapper;
  }

  function createControl(type, id, name, item, value, errorEl) {
    const describedBy = errorEl?.id || null;
    const commonAttrs = {
      id,
      name,
      ...(item.required ? { required: "required" } : {}),
      ...(item.disabled ? { disabled: "disabled" } : {}),
      ...(item.autocomplete ? { autocomplete: String(item.autocomplete) } : {}),
      ...(item.min != null ? { min: String(item.min) } : {}),
      ...(item.max != null ? { max: String(item.max) } : {}),
      ...(item.step != null ? { step: String(item.step) } : {}),
      ...(item.pattern ? { pattern: String(item.pattern) } : {}),
      ...(item.inputmode ? { inputmode: String(item.inputmode) } : {}),
      ...(describedBy ? { "aria-describedby": describedBy } : {}),
    };
    let control = null;

    if (type === "hidden") {
      control = createElement("input", {
        attrs: {
          id,
          name,
          type: "hidden",
          value: value == null ? "" : String(value),
        },
      });
      return control;
    }

    if (type === "ui.select") {
      const host = createElement("div", {
        className: "ui-form-modal-select-host",
        attrs: { id },
      });
      const selectInstance = createSelect(host, item.items || item.options || [], {
        ariaLabel: item.ariaLabel || item.label || name,
        placeholder: item.placeholder || "Select...",
        emptyText: item.emptyText || "No options found.",
        searchable: item.searchable !== false,
        multiple: Boolean(item.multiple),
        closeOnSelect: item.closeOnSelect !== false,
        selectOnTab: Boolean(item.selectOnTab),
        clearable: item.clearable !== false,
        selected: value,
        onChange() {
          handleFieldChange(name);
        },
      });
      host.__uiSelectInstance = selectInstance;
      control = host;
      return control;
    }

    if (type === "input") {
      control = createElement("input", {
        className: "ui-input",
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { readonly: "readonly" } : {}),
          type: normalizeInputType(item.input),
          value: value == null ? "" : String(value),
          ...(item.placeholder ? { placeholder: String(item.placeholder) } : {}),
        },
      });
    } else if (type === "textarea") {
      control = createElement("textarea", {
        className: "ui-input",
        text: value == null ? "" : String(value),
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { readonly: "readonly" } : {}),
          ...(item.placeholder ? { placeholder: String(item.placeholder) } : {}),
        },
      });
    } else if (type === "select") {
      control = createElement("select", {
        className: "ui-input",
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { disabled: "disabled" } : {}),
        },
      });
      normalizeOptionsList(item.options).forEach((option) => {
        const optionEl = createElement("option", {
          text: option.label,
          attrs: { value: option.value },
        });
        if (String(option.value) === String(value ?? "")) {
          optionEl.selected = true;
        }
        control.appendChild(optionEl);
      });
    } else if (type === "checkbox") {
      control = createElement("input", {
        className: "ui-form-modal-checkbox-input",
        attrs: {
          ...commonAttrs,
          type: "checkbox",
          ...(item.readonly ? { disabled: "disabled" } : {}),
          ...(value ? { checked: "checked" } : {}),
        },
      });
      control.checked = Boolean(value);
    }

    if (!control) {
      return null;
    }
    control.addEventListener("input", () => handleFieldChange(name));
    control.addEventListener("change", () => handleFieldChange(name));
    return control;
  }

  function handleFieldChange(name) {
    clearFieldError(name);
    if (refs.formError.textContent) {
      clearFormError();
    }
    if (typeof currentOptions.onChange === "function") {
      currentOptions.onChange(getValues(), createContext(name));
    }
  }

  async function handleSubmit(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (destroyed || modal.isBusy()) {
      return false;
    }
    clearErrors();
    clearFormError();
    const validation = validate();
    if (!validation.valid) {
      applyErrors(validation.errors);
      focusFirstInvalid(validation.firstInvalidField);
      return false;
    }
    if (typeof currentOptions.onSubmit !== "function") {
      return true;
    }
    modal.setBusy(true, { message: currentOptions.busyMessage });
    try {
      const result = await currentOptions.onSubmit(getValues(), createContext(null));
      if (result) {
        return currentOptions.closeOnSuccess !== false;
      }
      return false;
    } catch (_error) {
      return false;
    } finally {
      if (modal.getState().open) {
        modal.setBusy(false);
      }
    }
  }

  function validate() {
    const errors = {};
    let firstInvalidField = null;
    fields.forEach((field, name) => {
      if (field.type === "hidden") {
        return;
      }
      const control = field.control;
      if (!(control instanceof HTMLElement)) {
        return;
      }
      let message = "";
    if (field.type === "checkbox") {
        if (field.config.required && !control.checked) {
          message = "This field is required.";
        }
      } else if (field.type === "ui.select") {
        const value = getFieldValue(field);
        const isEmpty = Array.isArray(value) ? value.length === 0 : value == null || value === "";
        if (field.config.required && isEmpty) {
          message = "This field is required.";
        }
      } else if (field.config.required && !getFieldValue(field)) {
        message = "This field is required.";
      } else if (typeof control.checkValidity === "function" && !control.checkValidity()) {
        message = control.validationMessage || "Invalid value.";
      }
      if (message) {
        errors[name] = message;
        if (!firstInvalidField) {
          firstInvalidField = name;
        }
      }
    });
    return {
      valid: !Object.keys(errors).length,
      errors,
      firstInvalidField,
    };
  }

  function resolveErrorField(name) {
    if (!name || typeof name !== "string") {
      return null;
    }
    const direct = fields.get(name);
    if (direct) {
      return direct;
    }
    if (!name.includes(".")) {
      return null;
    }
    return fields.get(name.split(".")[0]) || null;
  }

  function focusFirstInvalid(name) {
    if (!name) {
      return;
    }
    const field = fields.get(name);
    if (field?.type === "hidden") {
      return;
    }
    const focusTarget = field?.type === "ui.select"
      ? getFieldAriaTarget(field)
      : field?.control;
    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
  }

  function applyErrors(errors = {}) {
    Object.keys(errors || {}).forEach((name) => {
      const field = resolveErrorField(name);
      if (!field || !field.errorEl) {
        return;
      }
      field.errorEl.hidden = false;
      field.errorEl.textContent = String(errors[name] || "");
      const ariaTarget = getFieldAriaTarget(field);
      ariaTarget?.setAttribute?.("aria-invalid", "true");
    });
  }

  function clearFieldError(name) {
    const field = resolveErrorField(name);
    if (!field || !field.errorEl) {
      return;
    }
    field.errorEl.hidden = true;
    field.errorEl.textContent = "";
    const ariaTarget = getFieldAriaTarget(field);
    ariaTarget?.removeAttribute?.("aria-invalid");
  }

  function clearErrors() {
    fields.forEach((_field, name) => clearFieldError(name));
  }

  function setFormError(message) {
    const text = String(message || "").trim();
    refs.formError.textContent = text;
    refs.formError.hidden = !text;
  }

  function clearFormError() {
    setFormError("");
  }

  function getValues() {
    const values = {};
    fields.forEach((field, name) => {
      values[name] = getFieldValue(field);
    });
    return values;
  }

  function setValues(nextValues = {}) {
    Object.keys(nextValues || {}).forEach((name) => {
      const field = fields.get(name);
      if (field) {
        setFieldValue(field, nextValues[name]);
      }
      const display = displays.get(name);
      if (display) {
        display.valueEl.textContent = nextValues[name] == null || nextValues[name] === ""
          ? String(display.config.emptyText || "-")
          : String(nextValues[name]);
      }
    });
  }

  function applyApiErrors(response) {
    const mapped = normalizeApiErrors(response);
    if (Object.keys(mapped.fieldErrors).length) {
      setErrors(mapped.fieldErrors);
    } else {
      clearErrors();
    }
    if (mapped.formError) {
      setFormError(mapped.formError);
    }
    return mapped;
  }

  function createContext(changedFieldName) {
    return {
      modal,
      mode: currentOptions.mode,
      setErrors,
      clearErrors,
      setFormError,
      clearFormError,
      applyApiErrors,
      setBusy: (...args) => modal.setBusy(...args),
      isBusy: () => modal.isBusy(),
      changedFieldName,
    };
  }

  function setErrors(fieldErrors = {}) {
    clearErrors();
    applyErrors(fieldErrors);
  }

  function buildModalConfig() {
    return {
      ...currentOptions,
      className: ["ui-form-modal-shell", currentOptions.className || ""].filter(Boolean).join(" "),
      content: refs.shell,
      autoBusy: false,
      actions: [
        {
          id: "cancel",
          label: currentOptions.cancelLabel,
          variant: "ghost",
          icon: currentOptions.cancelIcon || "",
        },
        {
          id: "submit",
          label: currentOptions.submitLabel,
          variant: currentOptions.submitVariant,
          icon: currentOptions.submitIcon || "",
          autoFocus: true,
          closeOnClick: false,
          async onClick(eventContext) {
            const shouldClose = await handleSubmit(eventContext.event);
            if (shouldClose) {
              await modal.close({
                reason: "submit",
                actionId: "submit",
                result: true,
              });
            }
            return false;
          },
        },
      ],
    };
  }

  function update(nextOptions = {}) {
    const previousValues = getValues();
    const merged = normalizeOptions({
      ...currentOptions,
      ...(nextOptions || {}),
      rows: Object.prototype.hasOwnProperty.call(nextOptions, "rows") ? nextOptions.rows : currentOptions.rows,
      initialValues: Object.prototype.hasOwnProperty.call(nextOptions, "initialValues") ? nextOptions.initialValues : currentOptions.initialValues,
    });
    Object.assign(currentOptions, merged);
    render();
    setValues({
      ...(currentOptions.initialValues || {}),
      ...previousValues,
      ...((nextOptions.initialValues && typeof nextOptions.initialValues === "object") ? nextOptions.initialValues : {}),
    });
    modal.update(buildModalConfig());
  }

  function getState() {
    return {
      ...modal.getState(),
      mode: currentOptions.mode,
      values: getValues(),
    };
  }

  function destroy() {
    destroyed = true;
    destroyHostedFieldInstances();
    modal.destroy();
  }

  refs.form.addEventListener("submit", async (event) => {
      const shouldClose = await handleSubmit(event);
      if (shouldClose) {
        await modal.close({
          reason: "submit",
          actionId: "submit",
          result: true,
        });
      }
    });
  render();

  modal = createActionModal({
    ...buildModalConfig(),
    onClose(meta) {
      currentOptions.onClose?.(meta);
      destroy();
    },
  });

  setValues(currentOptions.initialValues || {});

  return {
    ...modal,
    update,
    getState,
    getValues,
    setValues,
    setErrors,
    clearErrors,
    setFormError,
    clearFormError,
    applyApiErrors,
    refs: {
      ...modal.refs,
      shell: refs.shell,
      form: refs.form,
      rows: refs.rows,
      hiddenFields: refs.hiddenFields,
      formError: refs.formError,
      fields,
      displays,
    },
  };
}

function normalizeOptions(options = {}) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    rows: normalizeRows(options.rows),
    initialValues: options.initialValues && typeof options.initialValues === "object" ? { ...options.initialValues } : null,
    context: options.context ?? null,
    mode: String(options.mode || "").trim(),
    submitLabel: String(options.submitLabel || DEFAULT_OPTIONS.submitLabel),
    cancelLabel: String(options.cancelLabel || DEFAULT_OPTIONS.cancelLabel),
    submitVariant: normalizeSubmitVariant(options.submitVariant),
    busyMessage: String(options.busyMessage || DEFAULT_OPTIONS.busyMessage),
  };
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => (Array.isArray(row) ? row.filter(Boolean) : []))
    .filter((row) => row.length);
}

function normalizeOptionsList(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => {
      if (option == null) {
        return null;
      }
      if (typeof option === "string" || typeof option === "number") {
        const value = String(option);
        return { label: value, value };
      }
      const label = String(option.label ?? option.value ?? "").trim();
      const value = String(option.value ?? option.label ?? "").trim();
      if (!label && !value) {
        return null;
      }
      return { label: label || value, value: value || label };
    })
    .filter(Boolean);
}

function normalizeContext(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const kind = String(value.kind || "badge-summary").trim().toLowerCase();
  const badge = String(value.badge || "").trim();
  const summary = String(value.summary || "").trim();
  if (!badge && !summary) {
    return null;
  }
  return {
    kind,
    badge,
    summary,
  };
}

function normalizeSubmitVariant(value) {
  const variant = String(value || "primary").trim().toLowerCase();
  return variant === "danger" ? "danger" : "primary";
}

function normalizeInputType(value) {
  const input = String(value || "text").trim().toLowerCase();
  if (["text", "email", "password", "number", "date", "url", "search"].includes(input)) {
    return input;
  }
  return "text";
}

function normalizeTone(value) {
  const tone = String(value || "info").trim().toLowerCase();
  if (tone === "danger" || tone === "warning" || tone === "success" || tone === "info") {
    return tone;
  }
  return "info";
}

function normalizeSpan(value) {
  return Number(value) === 2 ? 2 : 1;
}

function normalizeTypeClass(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function normalizeModeList(value) {
  if (value == null) {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function resolveModeFlag(list, mode) {
  const normalized = normalizeModeList(list);
  if (!normalized.length) {
    return false;
  }
  return normalized.includes(String(mode || "").trim());
}

function isVisibleRenderableItem(item) {
  return Boolean(item && !item._hiddenByRule && item.type !== "hidden");
}

function getItemClassName(baseClassName, item) {
  const classes = [baseClassName];
  if (normalizeSpan(item?.span) === 2) {
    classes.push("is-span-2");
  }
  if (item?.rowClassName) {
    classes.push(String(item.rowClassName).trim());
  }
  return classes.filter(Boolean).join(" ");
}

function resolveItemValue(item) {
  if (Object.prototype.hasOwnProperty.call(item, "value")) {
    return item.value;
  }
  const initialValues = item?._initialValues;
  if (initialValues && typeof initialValues === "object" && Object.prototype.hasOwnProperty.call(initialValues, item.name)) {
    return initialValues[item.name];
  }
  return item.type === "checkbox" ? false : "";
}

function appendDescribedBy(control, id) {
  if (!control) {
    return;
  }
  const current = String(control.getAttribute("aria-describedby") || "").trim();
  const next = [current, id].filter(Boolean).join(" ");
  control.setAttribute("aria-describedby", next);
}

function getFieldValue(field) {
  if (field.type === "ui.select") {
    return field.control?.__uiSelectInstance?.getValue?.() ?? (field.config.multiple ? [] : null);
  }
  if (field.type === "checkbox") {
    return Boolean(field.control.checked);
  }
  return field.control.value;
}

function setFieldValue(field, value) {
  if (field.type === "ui.select") {
    const currentValue = field.control?.__uiSelectInstance?.getValue?.();
    if (isSameValue(currentValue, value)) {
      return;
    }
    field.control?.__uiSelectInstance?.setValue?.(value);
    return;
  }
  if (field.type === "checkbox") {
    field.control.checked = Boolean(value);
    return;
  }
  field.control.value = value == null ? "" : String(value);
}

function getFieldAriaTarget(field) {
  if (!field) {
    return null;
  }
  if (field.type === "ui.select") {
    return field.control?.querySelector?.(".ui-select-trigger") || null;
  }
  return field.control || null;
}

function isSameValue(left, right) {
  if (Array.isArray(left) || Array.isArray(right)) {
    const a = Array.isArray(left) ? left.map(String) : [];
    const b = Array.isArray(right) ? right.map(String) : [];
    if (a.length !== b.length) {
      return false;
    }
    return a.every((value, index) => value === b[index]);
  }
  return String(left ?? "") === String(right ?? "");
}

function normalizeApiErrors(response) {
  const source = response?.data && typeof response.data === "object" ? response.data : response;
  const fieldErrors = {};
  let formError = "";

  const candidates = [
    source?.errors,
    source?.fieldErrors,
    source?.validation?.errors,
  ];

  candidates.forEach((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return;
    }
    Object.keys(candidate).forEach((key) => {
      const value = candidate[key];
      const message = Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
      if (!message) {
        return;
      }
      if (key === "_form" || key === "form" || key === "non_field_errors") {
        if (!formError) {
          formError = message;
        }
        return;
      }
      fieldErrors[key] = message;
    });
  });

  if (!formError && source && typeof source === "object") {
    formError = String(source.formError || source.error || source.message || "").trim();
  } else if (!formError && typeof source === "string") {
    formError = source.trim();
  }

  return { fieldErrors, formError };
}




