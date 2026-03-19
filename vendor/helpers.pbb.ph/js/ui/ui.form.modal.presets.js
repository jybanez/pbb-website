import { createFormModal } from "./ui.form.modal.js";

export function createLoginFormModal(options = {}) {
  const fields = normalizeFieldMap(options.fields, {
    identifier: "email",
    password: "password",
  });
  const identifierKind = normalizeIdentifierKind(options.identifierKind);
  const identifierLabel = String(options.identifierLabel || (identifierKind === "username" ? "Username" : "Email address"));
  const identifierPlaceholder = String(options.identifierPlaceholder || (identifierKind === "username" ? "Enter username" : "name@agency.gov.ph"));
  const identifierInput = identifierKind === "username" ? "text" : "email";
  const identifierAutocomplete = String(options.identifierAutocomplete || (identifierKind === "username" ? "username" : "username"));
  const passwordLabel = String(options.passwordLabel || "Password");
  const passwordPlaceholder = String(options.passwordPlaceholder || "Enter password");
  const message = String(options.message || "Please sign in to continue.");

  return createFormModal({
    ...options,
    title: options.title || "Operator Login",
    size: options.size || "sm",
    busyMessage: options.busyMessage || "Signing in...",
    submitLabel: options.submitLabel || "Login",
    rows: [
      [{ type: "text", content: message }],
      [{
        type: "input",
        input: identifierInput,
        name: fields.identifier,
        label: identifierLabel,
        value: resolveInitialValue(options, fields.identifier),
        placeholder: identifierPlaceholder,
        autocomplete: identifierAutocomplete,
        required: true,
      }],
      [{
        type: "input",
        input: "password",
        name: fields.password,
        label: passwordLabel,
        value: resolveInitialValue(options, fields.password),
        placeholder: passwordPlaceholder,
        autocomplete: "current-password",
        required: true,
      }],
    ],
  });
}

export function createReauthFormModal(options = {}) {
  const fields = normalizeFieldMap(options.fields, {
    identifier: "email",
    password: "password",
  });
  const identifierKind = normalizeIdentifierKind(options.identifierKind);
  const identifierLabel = String(options.identifierLabel || (identifierKind === "username" ? "Username" : "Email address"));
  const identifierValue = String(
    options.identifierValue
    ?? resolveInitialValue(options, fields.identifier)
    ?? ""
  );
  const passwordLabel = String(options.passwordLabel || "Password");
  const passwordPlaceholder = String(options.passwordPlaceholder || "Re-enter password");
  const message = String(options.message || "Your session has expired. Please re-enter your password to continue.");
  const rows = [
    [{ type: "text", content: message }],
    [{
      type: "input",
      input: identifierKind === "username" ? "text" : "email",
      name: fields.identifier,
      label: identifierLabel,
      value: identifierValue,
      readonly: true,
      disabled: true,
      autocomplete: identifierKind === "username" ? "username" : "username",
    }],
    [{
      type: "input",
      input: "password",
      name: fields.password,
      label: passwordLabel,
      value: resolveInitialValue(options, fields.password),
      placeholder: passwordPlaceholder,
      autocomplete: "current-password",
      required: true,
    }],
  ];

  return createFormModal({
    ...options,
    title: options.title || "Session Expired",
    size: options.size || "sm",
    busyMessage: options.busyMessage || "Re-authenticating...",
    submitLabel: options.submitLabel || "Continue",
    rows,
  });
}

export function createStatusUpdateFormModal(options = {}) {
  const fields = normalizeFieldMap(options.fields, {
    status: "status",
    remarks: "remarks",
    notify: "notify",
  });
  const statusOptions = normalizeOptionsList(options.statusOptions);
  const showNotify = options.showNotify !== false;

  return createFormModal({
    ...options,
    title: options.title || "Update Status",
    size: options.size || "sm",
    busyMessage: options.busyMessage || "Saving status update...",
    submitLabel: options.submitLabel || "Save Status",
    rows: [
      [{ type: "text", content: String(options.message || "Update the current operational status for this record.") }],
      [{
        type: "select",
        name: fields.status,
        label: String(options.statusLabel || "Status"),
        value: resolveInitialValue(options, fields.status),
        required: true,
        options: statusOptions,
      }],
      [{
        type: "textarea",
        name: fields.remarks,
        label: String(options.remarksLabel || "Remarks"),
        value: resolveInitialValue(options, fields.remarks),
        placeholder: String(options.remarksPlaceholder || "Add status notes"),
      }],
      ...(showNotify ? [[{
        type: "checkbox",
        name: fields.notify,
        label: String(options.notifyLabel || "Notify affected teams"),
        value: resolveCheckboxValue(options, fields.notify, options.defaultNotify !== false),
      }]] : []),
    ],
  });
}

export function createReasonFormModal(options = {}) {
  const fields = normalizeFieldMap(options.fields, {
    reasonCode: "reasonCode",
    reasonDetails: "reasonDetails",
    confirmText: "confirmText",
    notify: "notify",
  });
  const reasonOptions = normalizeOptionsList(options.reasonOptions);
  const confirmPhrase = String(options.confirmPhrase || "").trim();
  const showNotify = Boolean(options.showNotify);

  return createFormModal({
    ...options,
    title: options.title || "Provide Reason",
    size: options.size || "sm",
    busyMessage: options.busyMessage || "Submitting reason...",
    submitLabel: options.submitLabel || "Confirm",
    submitVariant: options.submitVariant || "danger",
    rows: [
      [{
        type: "alert",
        tone: options.alertTone || "danger",
        content: String(options.message || "This action may affect downstream operations. Please provide a reason before continuing."),
      }],
      [{
        type: "select",
        name: fields.reasonCode,
        label: String(options.reasonLabel || "Reason Category"),
        value: resolveInitialValue(options, fields.reasonCode),
        required: true,
        options: reasonOptions,
      }],
      [{
        type: "textarea",
        name: fields.reasonDetails,
        label: String(options.detailsLabel || "Details"),
        value: resolveInitialValue(options, fields.reasonDetails),
        placeholder: String(options.detailsPlaceholder || "Explain why this action is necessary."),
        required: true,
      }],
      ...(confirmPhrase ? [[{
        type: "input",
        input: "text",
        name: fields.confirmText,
        label: String(options.confirmLabel || `Type ${confirmPhrase} to confirm`),
        value: resolveInitialValue(options, fields.confirmText),
        placeholder: confirmPhrase,
        required: true,
        pattern: escapePattern(confirmPhrase),
      }]] : []),
      ...(showNotify ? [[{
        type: "checkbox",
        name: fields.notify,
        label: String(options.notifyLabel || "Notify affected users"),
        value: resolveCheckboxValue(options, fields.notify, false),
      }]] : []),
    ],
  });
}

function normalizeFieldMap(value, fallback) {
  const input = value && typeof value === "object" ? value : {};
  return {
    ...fallback,
    ...Object.fromEntries(
      Object.entries(input).map(([key, fieldName]) => [key, String(fieldName || "").trim() || fallback[key]])
    ),
  };
}

function normalizeIdentifierKind(value) {
  const next = String(value || "email").trim().toLowerCase();
  return next === "username" ? "username" : "email";
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

function resolveInitialValue(options, name) {
  if (options.initialValues && typeof options.initialValues === "object" && Object.prototype.hasOwnProperty.call(options.initialValues, name)) {
    return options.initialValues[name];
  }
  return "";
}

function resolveCheckboxValue(options, name, fallback) {
  if (options.initialValues && typeof options.initialValues === "object" && Object.prototype.hasOwnProperty.call(options.initialValues, name)) {
    return Boolean(options.initialValues[name]);
  }
  return Boolean(fallback);
}

function escapePattern(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
