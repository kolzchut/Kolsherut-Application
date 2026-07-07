// Typo-tolerant matching is applied only to high-signal name/title fields.
// Fuzzy expansion is costly per field, so long free-text fields (descriptions,
// addresses, synonyms) are intentionally excluded here — they are still matched
// exactly through freeSearchFields in the primary clause.
export const fuzzySearchFields = [
  "branch_operating_unit^5.0",
  "organization_name_parts.primary^10.0",
  "organization_name_parts.secondary^5.0",
  "branch_name^10.0",
  "branch_name.hebrew^10.0",
  "organization_name^10.0",
  "organization_name.hebrew^10.0",
  "organization_short_name^10.0",
  "organization_short_name.hebrew^10.0",
  "organization_resolved_name^10.0",
  "organization_resolved_name.hebrew^10.0",
  "organization_original_name^10.0",
  "organization_original_name.hebrew^10.0",
  "service_name^10.0",
  "service_name.hebrew^10.0",
  "situations.name^10.0",
  "situations.name.hebrew^10.0",
  "responses.name^10.0",
  "responses.name.hebrew^10.0"
];
