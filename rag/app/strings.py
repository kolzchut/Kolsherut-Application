APP_TITLE = 'Kolsherut RAG Service'

RAG_SYSTEM_PROMPT = """You are an assistant for the Kolsherut social-services platform.
Answer the user's question based only on the context documents provided below.
Each context document describes a social service card.
If the answer cannot be found in the context documents, say that you do not know.
Answer in the same language the user asked in.

Context documents:
{context}"""

# Card field -> macro token. Every field either card-text template may reference.
CARD_FIELD_MACROS = {
    'service_name': '%%SERVICE_NAME%%',
    'service_description': '%%SERVICE_DESCRIPTION%%',
    'service_details': '%%SERVICE_DETAILS%%',
    'organization_name': '%%ORGANIZATION_NAME%%',
    'organization_description': '%%ORGANIZATION_DESCRIPTION%%',
    'organization_purpose': '%%ORGANIZATION_PURPOSE%%',
    'organization_kind': '%%ORGANIZATION_KIND%%',
    'branch_city': '%%BRANCH_CITY%%',
    'branch_address': '%%BRANCH_ADDRESS%%',
    'branch_phone_numbers': '%%BRANCH_PHONES%%',
    'service_phone_numbers': '%%SERVICE_PHONES%%',
    'organization_phone_numbers': '%%ORGANIZATION_PHONES%%',
    'service_payment_required': '%%PAYMENT_REQUIRED%%',
    'service_payment_details': '%%PAYMENT_DETAILS%%',
    'national_service': '%%NATIONAL_SERVICE%%',
    'organization_urls': '%%ORGANIZATION_URLS%%',
    'service_urls': '%%SERVICE_URLS%%',
    'situations': '%%SITUATIONS%%',
    'responses': '%%RESPONSES%%',
    'response_categories': '%%RESPONSE_CATEGORIES%%',
}

# Lean, semantic prose that gets vectorized for retrieval (no contact/payment noise).
CARD_EMBEDDING_TEXT_TEMPLATE = (
    '%%SERVICE_NAME%% הוא שירות מטעם הארגון %%ORGANIZATION_NAME%%. '
    'תיאור השירות: %%SERVICE_DESCRIPTION%%. '
    'מטרת הארגון: %%ORGANIZATION_PURPOSE%%. '
    'פרטים נוספים: %%SERVICE_DETAILS%%. '
    'השירות ניתן בעיר %%BRANCH_CITY%%. '
    'מיועד עבור: %%SITUATIONS%%. '
    'סוגי מענה: %%RESPONSES%% (%%RESPONSE_CATEGORIES%%).'
)

# Rich prose handed to the final LLM as context (adds factual/contact details).
CARD_CONTEXT_TEXT_TEMPLATE = (
    '%%SERVICE_NAME%% הוא שירות מטעם הארגון %%ORGANIZATION_NAME%% (%%ORGANIZATION_KIND%%). '
    'תיאור: %%SERVICE_DESCRIPTION%%. '
    'מטרת הארגון: %%ORGANIZATION_PURPOSE%%. '
    'פרטים: %%SERVICE_DETAILS%%. '
    'מיקום: %%BRANCH_ADDRESS%%, %%BRANCH_CITY%%. '
    'טלפונים: %%SERVICE_PHONES%% %%BRANCH_PHONES%% %%ORGANIZATION_PHONES%%. '
    'תשלום: %%PAYMENT_REQUIRED%% %%PAYMENT_DETAILS%%. '
    'שירות ארצי: %%NATIONAL_SERVICE%%. '
    'קישורים: %%SERVICE_URLS%% %%ORGANIZATION_URLS%%. '
    'מיועד עבור: %%SITUATIONS%%. '
    'סוגי מענה: %%RESPONSES%%.'
)

ERROR_CARD_NOT_FOUND = 'Card {card_id} was not found in the cards index'
ERROR_CARD_HAS_NO_EMBEDDABLE_TEXT = 'Card {card_id} has no text in the configured embedding fields'
ERROR_INTERNAL_SERVER = 'Internal server error: {error}'

HEALTH_STATUS_OK = 'ok'

CARD_EMBED_STATUS_EMBEDDED = 'embedded'
CARD_EMBED_STATUS_SKIPPED_NO_TEXT = 'skipped_no_text'
CARD_EMBED_STATUS_NOT_FOUND = 'not_found'

RAG_LOGGER_NAME = 'kolsherut-rag'
LOG_FORMAT = '%(asctime)s | %(levelname)s | %(name)s | %(message)s'
SERVICE_STARTUP_MESSAGE = 'Kolsherut RAG service started'
ASK_LOG_TERMINAL_MESSAGE = (
    'ask | id={log_id} | model={model} | latency_ms={latency_ms} | timings=[{timings}] | '
    'prompt={prompt} | answer={answer}'
)
ERROR_ASK_LOG_FAILED = 'Failed to write ask log to Elasticsearch: {error}'
RATING_STATUS_OK = 'ok'

# Pipeline step names (used as trace step + timings_ms keys)
PIPELINE_STEP_BI_ENCODER = 'bi_encoder'
PIPELINE_STEP_KNN = 'knn'
PIPELINE_STEP_BM25 = 'bm25'
PIPELINE_STEP_CROSS_ENCODER = 'cross_encoder'
PIPELINE_STEP_LLM = 'llm'
