interface IStructureAutocomplete {
    label: string,
    query: string,
    situationId: string,
    responseId: string,
    bounds: [number, number, number, number],
    cityName: string,
}

interface IUnStructuredAutocomplete {
    label: string,
    query: string,
}

const transformAutocompleteStructure = (resultsInElasticFormat: any) => {
    const results = resultsInElasticFormat.hits.hits.map((hit: any) => hit._source)
    const structuredResults: IStructureAutocomplete[] = [];
    const unstructuredResults: IUnStructuredAutocomplete[] = [];

    results.forEach((result: any) => {
        if (result.situation || result.response || result.bounds) {
            structuredResults.push({
                label: result.query,
                query: result.id,
                situationId: result.situation,
                responseId: result.response,
                bounds: result.bounds,
                cityName: result.city_name
            });
        } else {
            unstructuredResults.push({
                label: result.query,
                query: result.id
            });
        }
    });
    return {
        structured: structuredResults,
        unstructured: unstructuredResults
    };
}
export default transformAutocompleteStructure;
