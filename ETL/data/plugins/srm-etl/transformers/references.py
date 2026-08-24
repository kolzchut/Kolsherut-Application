LOOKUPS_PREFIX = 'lookups.'
STATIC_DATA_PREFIX = 'static_data.'


def resolve_named_data(reference, context):
    if reference.startswith(STATIC_DATA_PREFIX):
        return context['static_data'][reference[len(STATIC_DATA_PREFIX):]]
    if reference.startswith(LOOKUPS_PREFIX):
        return context['lookups'][reference[len(LOOKUPS_PREFIX):]]
    return context['lookups'][reference]
