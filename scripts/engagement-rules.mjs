export const ENGAGEMENT_INQUIRY_TYPES = Object.freeze(["briefing", "pilot", "partnership"]);
export const ENGAGEMENT_FORM_KEYS = Object.freeze(["homepage", "briefing", "pilot", "partnership"]);
export const ENGAGEMENT_FIELD_TYPES = Object.freeze(["text", "select", "textarea", "checkbox-group"]);
export const EXPECTED_ENGAGEMENT_FIELDS = Object.freeze({
  homepage: ["messageInput"],
  briefing: ["intendedAudience", "briefingTopics", "sessionFormat", "additionalNotes"],
  pilot: ["locality", "continuityNeed", "moduleInterests", "targetTimeframe", "fieldConstraints", "additionalNotes"],
  partnership: ["partnershipType", "proposedContribution", "communitiesOrSectors", "expectedRole", "resourcesOrExpertise", "timingOrGovernance", "additionalNotes"]
});
const EXPECTED_INQUIRY_TYPES = Object.freeze({ homepage: "briefing", briefing: "briefing", pilot: "pilot", partnership: "partnership" });

export const normalizeInquiryType = (value) =>
  ENGAGEMENT_INQUIRY_TYPES.includes(value) ? value : "briefing";

const presentString = (value) => typeof value === "string" && value.trim().length > 0;
const duplicateValues = (values) => new Set(values).size !== values.length;

export const engagementConfigurationErrors = (configuration) => {
  const errors = [];
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) return ["Engagement form configuration must be an object."];
  const keys = Object.keys(configuration);
  if (JSON.stringify(keys) !== JSON.stringify(ENGAGEMENT_FORM_KEYS)) errors.push(`Engagement form configuration keys must be exactly: ${ENGAGEMENT_FORM_KEYS.join(", ")}.`);

  for (const key of ENGAGEMENT_FORM_KEYS) {
    const form = configuration[key];
    if (!form || typeof form !== "object") {
      errors.push(`Engagement form ${key} is missing.`);
      continue;
    }
    if (!ENGAGEMENT_INQUIRY_TYPES.includes(form.inquiryType)) errors.push(`Engagement form ${key} has unknown inquiry type: ${form.inquiryType}.`);
    if (form.inquiryType !== EXPECTED_INQUIRY_TYPES[key]) errors.push(`Engagement form ${key} must use inquiry type ${EXPECTED_INQUIRY_TYPES[key]}.`);
    if (!presentString(form.submitLabel)) errors.push(`Engagement form ${key} requires a submit label.`);
    if (!Array.isArray(form.fields)) {
      errors.push(`Engagement form ${key} requires an ordered fields array.`);
      continue;
    }
    const names = form.fields.map((field) => field?.name);
    const ids = form.fields.map((field) => field?.id);
    if (duplicateValues(names)) errors.push(`Engagement form ${key} has duplicate field names.`);
    if (duplicateValues(ids)) errors.push(`Engagement form ${key} has duplicate field IDs.`);
    if (JSON.stringify(names) !== JSON.stringify(EXPECTED_ENGAGEMENT_FIELDS[key])) errors.push(`Engagement form ${key} fields do not match the approved order.`);

    for (const field of form.fields) {
      const label = `${key}.${field?.name ?? "unknown"}`;
      for (const property of ["name", "id", "label", "summaryLabel"]) {
        if (!presentString(field?.[property])) errors.push(`Engagement field ${label} requires ${property}.`);
      }
      if (!ENGAGEMENT_FIELD_TYPES.includes(field?.type)) errors.push(`Engagement field ${label} has unknown type: ${field?.type}.`);
      if (typeof field?.required !== "boolean") errors.push(`Engagement field ${label} requires a boolean required value.`);
      if (field?.maxlength !== undefined && (!Number.isInteger(field.maxlength) || field.maxlength < 1)) errors.push(`Engagement field ${label} has invalid maxlength.`);
      if (field?.layout !== undefined && field.layout !== "half") errors.push(`Engagement field ${label} has unknown layout hint.`);
      if (["select", "checkbox-group"].includes(field?.type)) {
        if (!Array.isArray(field.options) || !field.options.length) {
          errors.push(`Engagement field ${label} requires options.`);
        } else {
          const options = field.options.map((option) => typeof option === "string" ? option.trim() : "");
          if (options.some((option) => !option)) errors.push(`Engagement field ${label} has an empty option value.`);
          if (duplicateValues(options)) errors.push(`Engagement field ${label} has duplicate option values.`);
        }
      }
      if (field?.type === "checkbox-group" && field.required && (!Array.isArray(field.options) || !field.options.length)) errors.push(`Required checkbox group ${label} requires options.`);
    }
  }
  return errors;
};
