from evaluation import vars


def split_slug_cell(slug_cell: str) -> list[str]:
    """Split the comma-separated slug column into trimmed, non-empty slugs."""
    parts = slug_cell.split(vars.SLUGS_SEPARATOR)
    return [part.strip() for part in parts if part.strip()]


def bucket_slugs_by_branch(slugs: list[str]) -> tuple[list[str], list[str]]:
    """Bucket slugs into (response_slugs, situation_slugs) by their taxonomy prefix."""
    response_slugs = [slug for slug in slugs if slug.startswith(vars.RESPONSE_SLUG_PREFIX)]
    situation_slugs = [slug for slug in slugs if slug.startswith(vars.SITUATION_SLUG_PREFIX)]
    return response_slugs, situation_slugs
