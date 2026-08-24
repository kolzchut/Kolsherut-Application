from srm_tools.datagovil import find_dataset_by_exact_name, find_resource_by_exact_name


def extract_datagovil_resource_id(payload, params):
    datasets = payload['result']['results']
    dataset = find_dataset_by_exact_name(datasets, params['dataset'])
    if dataset is None:
        raise ValueError(f'data.gov.il dataset "{params["dataset"]}" not found in package_search results')
    resource = find_resource_by_exact_name(dataset, params['resource'])
    if resource is None and params.get('fallback_first_resource'):
        resource = dataset['resources'][0]
    if resource is None:
        raise ValueError(f'data.gov.il resource "{params["resource"]}" not found in dataset "{params["dataset"]}"')
    return resource['id']


EXTRACTORS = {
    'datagovil_resource_id': extract_datagovil_resource_id,
}
