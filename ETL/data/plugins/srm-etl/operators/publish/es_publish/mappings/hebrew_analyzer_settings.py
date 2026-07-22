"""Index settings defining the hebrew ICU analyzer (legacy es_utils).

Requires the analysis-icu plugin on the Elasticsearch cluster.
"""
HEBREW_ANALYZER_INDEX_SETTINGS = {
    'analysis': {
        'analyzer': {
            'hebrew': {
                'tokenizer': 'icu_tokenizer',
                'filter': [
                    'icu_folding',
                    'icu_normalizer',
                ],
            }
        }
    }
}
