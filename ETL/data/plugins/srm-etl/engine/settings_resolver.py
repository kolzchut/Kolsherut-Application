from conf import settings

SETTINGS_PREFIX = 'settings:'


def resolve_settings_reference(value):
    if isinstance(value, str) and value.startswith(SETTINGS_PREFIX):
        return getattr(settings, value[len(SETTINGS_PREFIX):])
    return value


def resolve_settings_name(settings_attribute_name):
    return getattr(settings, settings_attribute_name)
