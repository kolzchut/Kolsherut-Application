from transformers.address import address_cascade, pluscode_location
from transformers.aggregate import groupby_aggregate
from transformers.airtable_links import resolve_foreign_key
from transformers.airtable_match import airtable_lookup_match
from transformers.cleaning import nullify_missing_values, nullify_values, replace_values
from transformers.derive import template_field
from transformers.enrich import enrich_from_source, pluck_where
from transformers.filtering import filter_rows
from transformers.guidestar_branches import guidestar_unwind_branches
from transformers.guidestar_orgs import guidestar_org_enrichment
from transformers.guidestar_services import guidestar_unwind_services
from transformers.hashing import hash_fields, hash_slice, slugify_with_prefix
from transformers.html import strip_html
from transformers.joining import (
    join_nonempty, join_present_fields, labeled_lines, split_concat_fields)
from transformers.lookup import (
    lookup_field, lookup_flag_union, lookup_map, lookup_override, lookup_union)
from transformers.meser_core import meser_core_transform, sanitize_columns
from transformers.meser_enrichment import meser_program_enrichment
from transformers.meser_local import meser_local_authority_override
from transformers.nested import dedupe_rows, flatten_nested_field
from transformers.strings import (
    ensure_prefix, regex_replace, replace_by_prefix_rules, strip_padded_id)
from transformers.templating import (
    conditional_template, drop_last_segment, template, wrap_in_list)
from transformers.text import (
    cast, join_address, labeled_concat, regex_extract_join, regex_search_first, strip)

COLUMN_OPS = {
    'address_cascade': address_cascade,
    'cast': cast,
    'conditional_template': conditional_template,
    'drop_last_segment': drop_last_segment,
    'ensure_prefix': ensure_prefix,
    'hash_fields': hash_fields,
    'hash_slice': hash_slice,
    'join_address': join_address,
    'join_nonempty': join_nonempty,
    'join_present_fields': join_present_fields,
    'labeled_concat': labeled_concat,
    'labeled_lines': labeled_lines,
    'lookup_field': lookup_field,
    'lookup_flag_union': lookup_flag_union,
    'lookup_map': lookup_map,
    'lookup_override': lookup_override,
    'lookup_union': lookup_union,
    'nullify_values': nullify_values,
    'pluck_where': pluck_where,
    'pluscode_location': pluscode_location,
    'regex_extract_join': regex_extract_join,
    'regex_replace': regex_replace,
    'regex_search_first': regex_search_first,
    'replace_by_prefix_rules': replace_by_prefix_rules,
    'replace_values': replace_values,
    'slugify_with_prefix': slugify_with_prefix,
    'split_concat_fields': split_concat_fields,
    'strip': strip,
    'strip_html': strip_html,
    'strip_padded_id': strip_padded_id,
    'template': template,
    'wrap_in_list': wrap_in_list,
}


def transform_column(frame, params, context):
    column_op = COLUMN_OPS[params['column_op']]
    op_params = {key: value for key, value in params.items() if key not in ('column', 'column_op')}
    result_frame = frame.copy()
    result_frame[params['column']] = column_op(frame[params['column']], op_params, context)
    return result_frame


ROW_OPS = {
    'airtable_lookup_match': airtable_lookup_match,
    'dedupe_rows': dedupe_rows,
    'enrich_from_source': enrich_from_source,
    'filter_rows': filter_rows,
    'flatten_nested_field': flatten_nested_field,
    'groupby_aggregate': groupby_aggregate,
    'guidestar_org_enrichment': guidestar_org_enrichment,
    'guidestar_unwind_branches': guidestar_unwind_branches,
    'guidestar_unwind_services': guidestar_unwind_services,
    'meser_core_transform': meser_core_transform,
    'meser_local_authority_override': meser_local_authority_override,
    'meser_program_enrichment': meser_program_enrichment,
    'nullify_missing_values': nullify_missing_values,
    'resolve_foreign_key': resolve_foreign_key,
    'sanitize_columns': sanitize_columns,
    'template_field': template_field,
    'transform_column': transform_column,
}
