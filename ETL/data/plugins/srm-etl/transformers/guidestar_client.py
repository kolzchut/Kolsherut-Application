from srm_tools.guidestar_api import GuidestarAPI

_guidestar_client = None


def get_guidestar_client():
    # One authenticated, cache-warmed client per run — fetchCaches is expensive
    global _guidestar_client
    if _guidestar_client is None:
        _guidestar_client = GuidestarAPI()
        _guidestar_client.fetchCaches()
    return _guidestar_client
