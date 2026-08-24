import unicodedata

UNICODE_NORMAL_FORM = 'NFC'


def normalize_service_name(raw_name: str) -> str:
    """Both sides render the same srm__cards field, so only spacing and Unicode form can differ."""
    return ' '.join(unicodedata.normalize(UNICODE_NORMAL_FORM, raw_name).split())


def normalize_and_dedupe(raw_names: list[str]) -> tuple[str, ...]:
    """Normalize, drop blanks, and dedupe while preserving rank order."""
    seen = set()
    ordered = []
    for raw_name in raw_names:
        name = normalize_service_name(raw_name)
        if name and name not in seen:
            seen.add(name)
            ordered.append(name)
    return tuple(ordered)
