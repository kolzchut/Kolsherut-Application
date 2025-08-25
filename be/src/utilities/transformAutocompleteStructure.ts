interface IStructureAutocomplete {
    label: string,
    query: string,
    situationId: string,
    responseId: string,
    bounds: [number, number, number, number],
    cityName: string,
    labelHighlighted?: string,
}

interface IUnStructuredAutocomplete {
    label: string,
    query: string,
    labelHighlighted?: string,
}

const pickHighlight = (highlight: any, fallback: string) => {
    if (!highlight) return fallback;
    // Prefer main query fields first
    const candidates = [
        "query",
        "query._2gram",
        "query._3gram",
        "query_heb",
        "query_heb.hebrew"
    ];
    for (const key of candidates) {
        if (highlight[key] && Array.isArray(highlight[key]) && highlight[key].length) {
            return highlight[key][0];
        }
    }
    // If nothing matched, return fallback
    return fallback;
}

const transformAutocompleteStructure = (resultsInElasticFormat: any) => {
    const results = resultsInElasticFormat.hits.hits.map((hit: any) => ({
        source: hit._source,
        highlight: hit.highlight
    }));
    const structuredResults: IStructureAutocomplete[] = [];
    const unstructuredResults: IUnStructuredAutocomplete[] = [];

    results.forEach((item: any) => {
        const result = item.source;
        const label = result.query;
        const labelHighlighted = pickHighlight(item.highlight, label);

        if (result.situation || result.response || result.bounds) {
            structuredResults.push({
                label,
                labelHighlighted,
                query: result.id,
                situationId: result.situation,
                responseId: result.response,
                bounds: result.bounds,
                cityName: result.city_name
            });
        } else {
            unstructuredResults.push({
                label,
                labelHighlighted,
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
