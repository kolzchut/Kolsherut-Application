import requests

DEFAULT_TIMEOUT_SECONDS = 60


def http_get_json(url, params=None, headers=None, timeout_seconds=DEFAULT_TIMEOUT_SECONDS):
    response = requests.get(url, params=params, headers=headers, timeout=timeout_seconds)
    response.raise_for_status()
    return response.json()


def http_get_text(url, params=None, headers=None, timeout_seconds=DEFAULT_TIMEOUT_SECONDS):
    response = requests.get(url, params=params, headers=headers, timeout=timeout_seconds)
    response.raise_for_status()
    return response.text
