import dataflows as DF
from dataflows_airtable import dump_to_airtable

from conf import settings
from srm_tools.logger import logger
from transformers.enrich import resolve_source_frame

REJECTED_STATUS = 'REJECTED'


def register_unmapped_taxonomy(tag_name):
    # Mirrors the old operator: an unmapped Guidestar tag is registered in the
    # staging taxonomy table so content editors can map it.
    DF.Flow(
        [dict(name=tag_name)],
        DF.update_resource(-1, name='taxonomies'),
        dump_to_airtable({
            (settings.AIRTABLE_STAGING_BASE, settings.AIRTABLE_TAXONOMY_MAPPING_GUIDESTAR_TABLE): {
                'resource-name': 'taxonomies',
                'typecast': True,
            }
        }, settings.AIRTABLE_API_KEY),
    ).process()


def normalize_id_lists(row):
    for key in ('situation_ids', 'response_ids'):
        if not isinstance(row.get(key), list):
            row[key] = None
    return row


def build_taxonomy(params, context):
    guidestar_rows = [normalize_id_lists(row) for row in resolve_source_frame(
        params['guidestar_taxonomy_source'], context)[
        ['name', 'Status', 'situation_ids', 'response_ids']].to_dict(orient='records')]
    rejected_names = [row['name'] for row in guidestar_rows if row.get('Status') == REJECTED_STATUS]
    taxonomy = {
        row.pop('name'): row for row in guidestar_rows if row['name'] not in rejected_names
    }
    soproc_rows = [normalize_id_lists(row) for row in resolve_source_frame(
        params['soproc_taxonomy_source'], context)[
        ['id', 'situation_ids', 'response_ids']].to_dict(orient='records')]
    taxonomy.update({row.pop('id'): row for row in soproc_rows})
    return taxonomy, rejected_names


def update_from_taxonomy(tag_names, taxonomy, responses, situations):
    for tag_name in tag_names:
        if not tag_name:
            continue
        if tag_name not in taxonomy:
            logger.warning(f'WARNING: no mapping for {tag_name}')
            taxonomy[tag_name] = dict(response_ids=[], situation_ids=[])
            register_unmapped_taxonomy(tag_name)
            continue
        mapping = taxonomy[tag_name]
        responses.update(mapping['response_ids'] or [])
        situations.update(mapping['situation_ids'] or [])


def has_rejected_tag(tag_names, rejected_names):
    return any(str(tag_name) in rejected_names for tag_name in tag_names)
