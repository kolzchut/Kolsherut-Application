APP_TITLE = 'Kolsherut Retrieval Service'

# Service field -> macro token. Every field either service-text template may reference.
# The derived keys (situations_hebrew, organization_names, organization_kind) are
# built in build_service_values before rendering; the rest map straight to source fields.
SERVICE_FIELD_MACROS = {
    'name': '%%NAME%%',
    'description': '%%DESCRIPTION%%',
    'details': '%%DETAILS%%',
    'situations_hebrew': '%%SITUATIONS%%',
    'organization_names': '%%ORGANIZATIONS%%',
    'organization_kind': '%%ORGANIZATION_KIND%%',
    'phone_numbers': '%%PHONES%%',
    'email_address': '%%EMAIL%%',
    'payment_required': '%%PAYMENT_REQUIRED%%',
    'payment_details': '%%PAYMENT_DETAILS%%',
}

# Hebrew-only prose that gets vectorized for retrieval (and matched by BM25).
# No English machine IDs and no contact/payment noise - only semantic content.
SERVICE_EMBEDDING_TEXT_TEMPLATE = (
    '%%NAME%%. %%DESCRIPTION%% %%DETAILS%% '
    'אוכלוסיית יעד: %%SITUATIONS%%. '
    'מופעל על ידי: %%ORGANIZATIONS%%.'
)

# Richer prose returned to the caller for display (adds provider kind and contact).
SERVICE_DISPLAY_TEXT_TEMPLATE = (
    '%%NAME%%. %%DESCRIPTION%% '
    'סוג ארגון: %%ORGANIZATION_KIND%%. '
    'טלפונים: %%PHONES%%. '
    'דוא"ל: %%EMAIL%%. '
    'תשלום: %%PAYMENT_REQUIRED%% %%PAYMENT_DETAILS%%.'
)

ERROR_SERVICE_NOT_FOUND = 'Service {service_id} was not found in the services index'
ERROR_SERVICE_HAS_NO_EMBEDDABLE_TEXT = 'Service {service_id} has no text in the configured embedding fields'
ERROR_INTERNAL_SERVER = 'Internal server error: {error}'

HEALTH_STATUS_OK = 'ok'

SERVICE_EMBED_STATUS_EMBEDDED = 'embedded'
SERVICE_EMBED_STATUS_SKIPPED_NO_TEXT = 'skipped_no_text'
SERVICE_EMBED_STATUS_NOT_FOUND = 'not_found'

# Reindex progress stream (Server-Sent Events). Each line is "data: {json}\n\n".
SSE_MEDIA_TYPE = 'text/event-stream'
SSE_DATA_LINE_TEMPLATE = 'data: {payload}\n\n'
REINDEX_EVENT_PROGRESS = 'progress'
REINDEX_EVENT_DONE = 'done'

RETRIEVAL_LOGGER_NAME = 'kolsherut-retrieval'
LOG_FORMAT = '%(asctime)s | %(levelname)s | %(name)s | %(message)s'
SERVICE_STARTUP_MESSAGE = 'Kolsherut retrieval service started'
RETRIEVE_LOG_TERMINAL_MESSAGE = (
    'retrieve | id={log_id} | latency_ms={latency_ms} | timings=[{timings}] | '
    'query={query} | num_documents={num_documents}'
)
ERROR_RETRIEVE_LOG_FAILED = 'Failed to write retrieval log to Elasticsearch: {error}'

# Pipeline step names (used as trace step + timings_ms keys)
PIPELINE_STEP_BI_ENCODER = 'bi_encoder'
PIPELINE_STEP_KNN = 'knn'
PIPELINE_STEP_BM25 = 'bm25'
PIPELINE_STEP_FUSION = 'fusion'
