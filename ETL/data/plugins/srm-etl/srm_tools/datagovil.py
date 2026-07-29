import requests

from conf import settings

REQUEST_FAILED_MESSAGE = 'data.gov.il returned success=false.\nURL: {url}\nResponse: {payload}'
DATASET_NOT_FOUND_MESSAGE = (
    'data.gov.il dataset "{dataset_name}" was not found. '
    'package_search returned {result_count} result(s) and package_show returned HTTP {status_code}. '
    'HTTP 403 means the dataset still exists but is no longer published publicly; '
    'HTTP 404 means it does not exist at all.'
)
RESOURCE_NOT_FOUND_MESSAGE = (
    'data.gov.il dataset "{dataset_name}" has no resource named "{resource_name}". '
    'Available resources: {available_resource_names}.'
)


class DatagovilSourceError(Exception):
    pass


def fetch_datagovil_json(url, params=None):
    response = requests.get(url, params=params, timeout=settings.DATAGOVIL_REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()
    payload = response.json()
    if not payload.get('success'):
        raise DatagovilSourceError(REQUEST_FAILED_MESSAGE.format(url=url, payload=payload))
    return payload


def fetch_datagovil_package_show_status_code(dataset_name):
    # Diagnostic only: distinguishes "unpublished" (403) from "never existed" (404),
    # so it must report the status instead of raising on it.
    response = requests.get(
        settings.DATAGOVIL_PACKAGE_SHOW_API,
        params=dict(id=dataset_name),
        timeout=settings.DATAGOVIL_REQUEST_TIMEOUT_SECONDS,
    )
    return response.status_code


def search_datagovil_datasets(dataset_name):
    payload = fetch_datagovil_json(
        settings.DATAGOVIL_PACKAGE_SEARCH_API, dict(q=f'"{dataset_name}"')
    )
    return payload['result']['results']


def find_dataset_by_exact_name(datasets, dataset_name):
    matches = [dataset for dataset in datasets if dataset['name'] == dataset_name]
    return matches[0] if matches else None


def find_resource_by_exact_name(dataset, resource_name):
    matches = [resource for resource in dataset['resources'] if resource['name'] == resource_name]
    return matches[0] if matches else None


def resolve_datagovil_resource(dataset_name, resource_name):
    datasets = search_datagovil_datasets(dataset_name)
    dataset = find_dataset_by_exact_name(datasets, dataset_name)
    if dataset is None:
        raise DatagovilSourceError(DATASET_NOT_FOUND_MESSAGE.format(
            dataset_name=dataset_name,
            result_count=len(datasets),
            status_code=fetch_datagovil_package_show_status_code(dataset_name),
        ))
    resource = find_resource_by_exact_name(dataset, resource_name)
    if resource is None:
        raise DatagovilSourceError(RESOURCE_NOT_FOUND_MESSAGE.format(
            dataset_name=dataset_name,
            resource_name=resource_name,
            available_resource_names=', '.join(
                repr(other['name']) for other in dataset['resources']
            ),
        ))
    return resource


def fetch_datagovil_datastore(dataset_name, resource_name):
    resource_id = resolve_datagovil_resource(dataset_name, resource_name)['id']
    payload = fetch_datagovil_json(
        settings.DATAGOVIL_DATASTORE_SEARCH_API, dict(resource_id=resource_id)
    )
    while True:
        records = payload.get('result', {}).get('records') or []
        if len(records) == 0:
            return
        print('FETCHED', len(records), 'records for', dataset_name)
        yield from records
        next_path = payload['result'].get('_links', {}).get('next')
        if next_path is None:
            return
        payload = fetch_datagovil_json(settings.DATAGOVIL_BASE + next_path)
