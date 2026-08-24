from app.services.service_text_rendering.dedupe_preserving_order import dedupe_preserving_order


def collect_union_of_list_fields(service: dict, source_field_names: list) -> list:
    """Concatenate several list-valued srm_services fields into one deduped list.

    srm_services populates equivalent fields inconsistently - the same logical value lands in a
    branch-derived field, a per-branch repeated field or a legacy Airtable lookup depending on the
    row, and usually only one of them is set. Every such group is therefore unioned rather than read
    from a single field, and deduped because the per-branch variants repeat one value per branch.
    """
    collected_values = []
    for source_field_name in source_field_names:
        collected_values.extend(service.get(source_field_name) or [])
    return dedupe_preserving_order(collected_values)
