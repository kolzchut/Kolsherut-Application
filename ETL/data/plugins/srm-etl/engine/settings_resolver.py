from conf import settings


def resolve_settings_name(settings_attribute_name):
    return getattr(settings, settings_attribute_name)
